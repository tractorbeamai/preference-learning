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
    """Analyzes feedback and returns potential new observations (rules/preferences)."""
    if not api_key:
        st.error("OpenAI API key not provided. Please enter it in the sidebar.")
        return []  # Return empty list if key is missing

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
        return []  # No new observations

    # Include current rules for context, but LLM shouldn't just return them
    current_rules_string = "\n".join(f"- {rule}" for rule in current_rules)
    preference_string = (
        f"Direct Preference Provided: '{direct_preference}'"
        if direct_preference
        else "No direct preference provided."
    )

    prompt = f"""Analyze the user's feedback (summary edits and direct preference) compared to the original summary and current rules.

Identify potential new rules or preferences suggested by this feedback. Generalize the user's intent.

Current Rules (for context only):
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

Based *only* on the user's edits (diff) and direct preference, list the *newly suggested rules or preferences*. 
Do not simply repeat the current rules unless the feedback strongly reinforces them in a new way.

Instructions:
1.  Focus on changes implied by the diff and the explicit preference.
2.  Generate concise, actionable rule statements.
3.  Prefix each suggested rule/preference with 'Rule: ' or 'Preference: '.
4.  List one suggestion per line.
5.  If no new suggestions are clear, output nothing or a simple 'No new suggestions.'

Suggested New Rules/Preferences:
"""

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4",  # Keep capable model for this reasoning task
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert system analyzing user feedback to suggest new summarization rules/preferences. You only output newly suggested rules, prefixed appropriately, one per line.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=200,  # Shorter max tokens as we expect fewer outputs
        )
        raw_new_observations = response.choices[0].message.content.strip()

        # Parse the response for new observations
        new_observations = []
        for line in raw_new_observations.split("\n"):
            cleaned_line = line.strip().lstrip("- ").strip()
            if cleaned_line.startswith("Rule: ") or cleaned_line.startswith(
                "Preference: "
            ):
                new_observations.append(cleaned_line)
            # Ignore lines like 'No new suggestions.' or empty lines

        if new_observations:
            st.toast(
                f"Identified {len(new_observations)} potential observation(s).",
                icon="👀",
            )
        else:
            st.toast("No new observations identified from feedback.")

        return new_observations

    except Exception as e:
        st.error(f"Error analyzing feedback via OpenAI: {e}")
        st.warning("Could not analyze feedback.")
        return []  # Return empty list on error


# --- Streamlit App Layout ---

st.set_page_config(layout="wide", page_title="Tractorbeam Preference Learning")

# Sidebar for API Key and Configuration
st.sidebar.header("Configuration")
api_key_input = st.sidebar.text_input(
    "Enter your OpenAI API Key",
    type="password",
    key="openai_api_key",  # Store in session state
    help="Get your API key from https://platform.openai.com/account/api-keys",
)

# Learning Rate Selector
learning_rate_options = ["Slow", "Normal", "Fast"]
learning_rate = st.sidebar.selectbox(
    "Learning Rate (Observations to Rule)",
    options=learning_rate_options,
    index=1,  # Default to Normal
    key="learning_rate",
    help="How many times an observation must appear before becoming a rule (Slow=5, Normal=3, Fast=2).",
)

st.title("🩺 Tractorbeam: Preference Learning Prototype")
st.caption(
    "Generate a fake medical record, summarize it, edit the summary, add preferences, and watch the 'learned' rules evolve."
)

# Initialize session state (if not already done)
if "rules" not in st.session_state:
    st.session_state.rules = ["Rule: Be concise.", "Rule: Focus on actionable items."]
if "observations" not in st.session_state:
    # Store observations as {observation_text: count}
    st.session_state.observations = {}
if "fake_record" not in st.session_state:
    st.session_state.fake_record = generate_fake_medical_record()
if "initial_summary" not in st.session_state:
    st.session_state.initial_summary = ""
if "edited_summary" not in st.session_state:
    st.session_state.edited_summary = ""
if "openai_api_key" not in st.session_state:
    st.session_state.openai_api_key = ""
# Ensure learning_rate is initialized from selectbox
if "learning_rate" not in st.session_state:
    st.session_state.learning_rate = "Normal"  # Match default index


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

                with st.spinner("Analyzing feedback and suggesting observations..."):
                    # This now returns potential new observations
                    new_observations = update_rules(
                        st.session_state.initial_summary,
                        st.session_state.edited_summary,
                        direct_preference,
                        st.session_state.rules,  # Pass current rules for context
                        current_api_key,
                    )

                # Define learning rate thresholds
                thresholds = {"Slow": 5, "Normal": 3, "Fast": 2}
                threshold = thresholds.get(
                    st.session_state.learning_rate, 3
                )  # Default to Normal

                promoted_count = 0
                if new_observations:
                    with st.spinner(
                        f"Processing {len(new_observations)} observation(s)..."
                    ):
                        # Update observation counts and promote if threshold met
                        for obs in new_observations:
                            # Increment count
                            current_count = st.session_state.observations.get(obs, 0)
                            current_count += 1
                            st.session_state.observations[obs] = current_count
                            st.toast(
                                f'Observation updated: "{obs[:30]}..." (Count: {current_count})',
                                icon="📊",
                            )

                            # Check for promotion
                            if current_count >= threshold:
                                if obs not in st.session_state.rules:
                                    st.session_state.rules.append(obs)
                                    promoted_count += 1
                                    st.toast(
                                        f'Observation promoted to rule: "{obs[:30]}..."',
                                        icon="🏆",
                                    )
                                    # Optional: Remove from observations once promoted?
                                    # del st.session_state.observations[obs]

                if promoted_count > 0:
                    st.success(f"{promoted_count} observation(s) promoted to rules!")
                # No explicit success message if only observations were updated

                st.rerun()  # Rerun to update UI displays


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

    st.divider()  # Add a visual separator

    st.subheader("Observation Log")
    if not st.session_state.observations:
        st.info("No observations recorded yet. Edit summaries or add preferences.")
    else:
        # Sort observations by count descending for clarity
        sorted_observations = sorted(
            st.session_state.observations.items(),
            key=lambda item: item[1],
            reverse=True,
        )
        for obs, count in sorted_observations:
            # Strip prefix for display
            display_obs = obs
            if display_obs.startswith("Rule: "):
                display_obs = display_obs[len("Rule: ") :]
            elif display_obs.startswith("Preference: "):
                display_obs = display_obs[len("Preference: ") :]

            st.text(f"Count: {count} | {display_obs}")
            # Optional: Add delete buttons for observations too?


# --- Footer/Debug Info (Optional) ---
# with st.expander("Debug Info"):
#     st.write("Session State:", st.session_state)
