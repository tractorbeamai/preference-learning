import difflib
import random

import streamlit as st
from openai import OpenAI

from fake_medical_record_generator import generate_fake_medical_record


# --- LLM Interaction Functions ---
def get_llm_summary(record, rules, api_key):
    """Generates a summary using the OpenAI API."""
    if not api_key:
        st.error("OpenAI API key not provided. Please enter it in the sidebar.")
        return "Error: API key missing."

    try:
        client = OpenAI(api_key=api_key)  # Initialize client locally
        rule_string = "\n".join(f"- {rule}" for rule in rules)
        prompt = f"""Please summarize the following fake medical record in exactly 3-4 concise sentences.

Follow these rules/preferences when generating the summary:
{rule_string}

Medical Record:
```
{record}
```

Summary (3-4 sentences):
"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # Or use "gpt-4" if preferred
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that summarizes medical records according to user preferences.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.5,  # Adjust for creativity vs determinism
            max_tokens=150,  # Limit summary length
        )
        summary = response.choices[0].message.content.strip()
        st.toast("Summary generated successfully!", icon="✅")
        return summary
    except Exception as e:
        st.error(f"Error generating summary via OpenAI: {e}")
        return "Error: Could not generate summary."


def update_rules(
    initial_summary, edited_summary, direct_preference, current_rules, api_key
):
    """Updates the rule set based on summary edits and direct preferences using OpenAI."""
    if not api_key:
        st.error("OpenAI API key not provided. Please enter it in the sidebar.")
        return current_rules  # Return current rules if key is missing

    # Calculate the difference between summaries
    diff_generator = difflib.unified_diff(
        initial_summary.splitlines(keepends=True),
        edited_summary.splitlines(keepends=True),
        fromfile="initial_summary.txt",
        tofile="edited_summary.txt",
        lineterm="",
    )
    diff = "\n".join(diff_generator)

    # Handle empty diff
    if not diff.strip() and not direct_preference:
        st.toast("No changes detected in summary and no direct preference provided.")
        return current_rules  # No changes needed

    current_rules_string = "\n".join(f"- {rule}" for rule in current_rules)
    preference_string = (
        f"Direct Preference Provided: '{direct_preference}'"
        if direct_preference
        else "No direct preference provided."
    )

    prompt = f"""Analyze the user's feedback to refine a set of rules for summarizing medical records.

Current Rules:
{current_rules_string}

Original LLM Summary:
```
{initial_summary}
```

User-Edited Summary:
```
{edited_summary}
```

Difference (Unified Diff format):
```diff
{diff}
```

{preference_string}

Based on the differences in the summaries and the direct preference (if any), update the current rules. Your goal is to generalize the user's implicit and explicit feedback into a new, concise set of rules.

Instructions:
1.  Analyze the diff and the direct preference.
2.  Identify implicit changes or explicit instructions.
3.  Generalize these into potentially new or modified rules.
4.  Consolidate, remove redundant/conflicting rules, or delete rules contradicted by the feedback.
5.  Output the *complete* updated list of rules below.
6.  Each rule MUST start with 'Rule: ' or 'Preference: '.
7.  List one rule per line.

Updated Rules:
"""

    try:
        client = OpenAI(api_key=api_key)  # Initialize client locally
        response = client.chat.completions.create(
            model="gpt-4",  # Using a more capable model for rule generation might be beneficial
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert system that refines summarization rules based on user feedback (summary edits and direct preferences). You output only the final, updated list of rules, one per line, prefixed appropriately.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=300,  # Allow more tokens for potentially longer rule lists
        )
        raw_updated_rules = response.choices[0].message.content.strip()

        # Parse the response - expecting one rule per line
        new_rules = []
        for line in raw_updated_rules.split("\n"):
            # Strip leading/trailing whitespace AND leading hyphens/spaces
            cleaned_line = line.strip().lstrip("- ").strip()
            if cleaned_line.startswith("Rule: ") or cleaned_line.startswith(
                "Preference: "
            ):
                new_rules.append(cleaned_line)
            elif cleaned_line:  # Handle potentially malformed lines if necessary
                # Keep the warning for truly unexpected formats
                st.warning(
                    f"LLM produced rule in unexpected format (after cleaning): '{cleaned_line}'"
                )

        if not new_rules:
            st.warning("LLM did not return any valid rules. Keeping existing rules.")
            return current_rules

        unique_new_rules = list(dict.fromkeys(new_rules))

        added_rules = [r for r in unique_new_rules if r not in current_rules]
        removed_rules = [r for r in current_rules if r not in unique_new_rules]

        if added_rules or removed_rules:
            st.success(
                f"Rules updated! Added: {len(added_rules)}, Removed: {len(removed_rules)}."
            )
        else:
            st.success("Rules analyzed, no changes needed.")

        return unique_new_rules

    except Exception as e:
        st.error(f"Error updating rules via OpenAI: {e}")
        st.warning("Could not update rules. Keeping existing rules.")
        return current_rules


# --- Streamlit App Layout ---

st.set_page_config(layout="wide", page_title="Tractorbeam Preference Learning")

# Sidebar for API Key
st.sidebar.header("Configuration")
api_key_input = st.sidebar.text_input(
    "Enter your OpenAI API Key",
    type="password",
    key="openai_api_key",  # Store in session state
    help="Get your API key from https://platform.openai.com/account/api-keys",
)

st.title("🩺 Tractorbeam: Preference Learning Prototype")
st.caption(
    "Generate a fake medical record, summarize it, edit the summary, add preferences, and watch the 'learned' rules evolve."
)

# Initialize session state
if "rules" not in st.session_state:
    st.session_state.rules = ["Rule: Be concise.", "Rule: Focus on actionable items."]
if "fake_record" not in st.session_state:
    st.session_state.fake_record = generate_fake_medical_record()
if "initial_summary" not in st.session_state:
    st.session_state.initial_summary = ""
if "edited_summary" not in st.session_state:
    st.session_state.edited_summary = ""
# Ensure openai_api_key is initialized if not present
if "openai_api_key" not in st.session_state:
    st.session_state.openai_api_key = ""

# Define columns
col1, col2 = st.columns([2, 1])  # Left column wider

# --- Left Column: Interaction Area ---
with col1:
    st.subheader("Fake Medical Record")
    record_display_area = st.text_area(
        "Generated Record",
        st.session_state.fake_record,
        height=300,
        key="record_display",
    )

    if st.button("🔄 Regenerate Medical Record"):
        st.session_state.fake_record = generate_fake_medical_record()
        st.session_state.initial_summary = ""  # Clear summary when record changes
        st.session_state.edited_summary = ""
        st.rerun()

    if st.button("📝 Summarize Record", type="primary"):
        if st.session_state.fake_record:
            # Retrieve API key from session state
            current_api_key = st.session_state.openai_api_key
            if not current_api_key:
                st.warning("Please enter your OpenAI API key in the sidebar first.")
            else:
                with st.spinner("Generating summary via OpenAI..."):
                    summary = get_llm_summary(
                        st.session_state.fake_record,
                        st.session_state.rules,
                        current_api_key,  # Pass key to function
                    )
                    # Check if summary generation resulted in an error message
                    if not summary.startswith("Error:"):
                        st.session_state.initial_summary = summary
                        st.session_state.edited_summary = (
                            summary  # Initialize editable summary
                        )
                        # Use a different key for the text_area to force update
                        st.session_state.summary_key = random.random()
                        # No rerun needed here, key change handles update
                    else:
                        # If get_llm_summary returned an error string, clear summaries
                        st.session_state.initial_summary = ""
                        st.session_state.edited_summary = ""
                        # Optionally, display the error if not already shown by get_llm_summary
                        # st.error(summary) # Usually redundant as function shows error

        else:
            st.warning("Please generate a record first.")

    st.subheader("Patient Summary")
    summary_key = st.session_state.get("summary_key", "summary_edit_area")
    edited_summary_input = st.text_area(
        "Edit Summary (3-4 sentences)",
        value=st.session_state.edited_summary,
        height=100,
        key=summary_key,  # Use dynamic key to reset if needed
    )

    st.subheader("Direct Preference Input")
    direct_preference_input = st.text_input(
        "Add a preference (e.g., 'Always include allergies')", key="direct_preference"
    )

    if st.button("💾 Save Summary & Preference"):
        if not st.session_state.initial_summary:
            st.warning("Please generate a summary before saving.")
        else:
            current_api_key = st.session_state.openai_api_key
            if not current_api_key:
                st.warning("Please enter your OpenAI API key in the sidebar first.")
            else:
                st.session_state.edited_summary = edited_summary_input
                direct_preference = st.session_state.get("direct_preference", "")

                with st.spinner("Analyzing feedback and updating rules via OpenAI..."):
                    updated_rules = update_rules(
                        st.session_state.initial_summary,
                        st.session_state.edited_summary,
                        direct_preference,
                        st.session_state.rules,
                        current_api_key,  # Pass key to function
                    )
                    st.session_state.rules = updated_rules
                    st.rerun()


# --- Right Column: Rule Management ---
with col2:
    st.subheader("Learned Rules")
    if not st.session_state.rules:
        st.info("No rules learned yet. Edit summaries or add preferences.")
    else:
        rules_to_keep = []
        for i in range(len(st.session_state.rules)):
            if i < len(st.session_state.rules):
                rule = st.session_state.rules[i]

                # Create a container for the card effect
                with st.container(border=True):
                    rule_col, button_col = st.columns(
                        [0.85, 0.15]
                    )  # Adjust ratio for button

                    with rule_col:
                        # Strip the prefix for display
                        display_rule = rule
                        if display_rule.startswith("Rule: "):
                            display_rule = display_rule[len("Rule: ") :]
                        elif display_rule.startswith("Preference: "):
                            display_rule = display_rule[len("Preference: ") :]
                        st.markdown(
                            f"{display_rule}"
                        )  # Use markdown for potentially better formatting

                    with button_col:
                        # Delete button remains the same
                        if st.button(
                            "🗑️",
                            key=f"delete_rule_{i}_{rule}",  # Key uses original rule with prefix for uniqueness
                            help=f"Delete rule: '{rule}'",  # Help text shows original rule
                        ):
                            st.toast(f"Rule '{rule}' deleted.")
                        else:
                            rules_to_keep.append(
                                rule
                            )  # Keep the original rule with prefix in state
            else:
                break

        if len(rules_to_keep) != len(st.session_state.rules):
            st.session_state.rules = rules_to_keep
            st.rerun()


# --- Footer/Debug Info (Optional) ---
# with st.expander("Debug Info"):
#     st.write("Session State:", st.session_state)
