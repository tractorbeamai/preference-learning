import difflib
import json
import random

import streamlit as st
from openai import OpenAI
from streamlit_extras.row import row

from fake_medical_record_generator import generate_fake_medical_record

MODEL = "gpt-4.1-mini"


# --- Add Helper Function near top ---
def normalize_observation(text):
    """Simple normalization: remove prefix, lowercase, strip punctuation/whitespace."""
    text = text.lower().strip()
    if text.startswith("rule:"):
        text = text[len("rule:") :].strip()
    if text.startswith("preference:"):
        text = text[len("preference:") :].strip()
    text = text.rstrip(".!?").strip()
    # Add more normalization if needed (e.g., removing articles)
    return text


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

Follow these rules/preferences carefully when generating the summary. These rules reflect the specific preferences of THIS user:
{rule_string}

Medical Record:
```
{record}
```

Summary (3-4 sentences):
"""

        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that summarizes medical records according to the specific preferences and rules provided by the current user.",
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
    initial_summary,
    edited_summary,
    direct_preference,
    current_rules,
    current_observations,
    api_key,
):
    """Analyzes feedback against existing observations/rules using OpenAI Tool Calling."""
    if not api_key:
        st.error("OpenAI API key not provided. Please enter it in the sidebar.")
        return []

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
        return []

    # Include current rules for context
    current_rules_string = "\n".join(f"- {rule}" for rule in current_rules)
    preference_string = (
        f"Direct Preference Provided: '{direct_preference}'"
        if direct_preference
        else "No direct preference provided."
    )
    # Format observations with counts for context
    observations_string = "\n".join(
        f"- {obs} (Count: {count})" for obs, count in current_observations.items()
    )
    if not observations_string:
        observations_string = "None yet."

    # Define the tool schema
    observation_tool_schema = {
        "type": "function",
        "function": {
            "name": "extract_observations",
            "description": "Extracts observation strings reflecting this specific user's preferences (reinforced or new) based on their feedback and context. Capture specific patterns, like preferred shorthand or signatures, not just general summarization principles.",
            "parameters": {
                "type": "object",
                "properties": {
                    "relevant_observations": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "A single observation string reflecting a specific user preference. If reinforcing an existing theme, use the exact canonical string. If new, formulate a concise string (e.g., 'Rule: Always end with signature X', 'Preference: Use shorthand Y for Z') prefixed with 'Rule: ' or 'Preference: '.",
                        },
                        "description": "A list of observation strings identified as relevant based on the user feedback and context. Focus on capturing the user's specific preferences.",
                    }
                },
                "required": ["relevant_observations"],
            },
        },
    }

    # Simplified prompt focusing on the task and context, letting the tool handle structure
    prompt = f"""Analyze the user's feedback (summary edits and direct preference) in the context of their existing rules and observations. The goal is to learn *this specific user's* preferences, even if they are idiosyncratic (like specific signatures, formatting, or shorthand).

Identify existing observation themes that are reinforced OR genuinely new observation themes suggested by the feedback. Use the 'extract_observations' tool to output the results.

Current User's Rules (for context):
{current_rules_string}

Current User's Observations Log (Canonical String: Count):
{observations_string}

Original LLM Summary:
```
{initial_summary}
```

User-Edited Summary (Reflects their preferences):
```
{edited_summary}
```

Difference (Unified Diff format):
```diff
{diff}
```

{preference_string}

Use the 'extract_observations' tool to list all relevant observation strings reflecting this user's specific preferences.
- If reinforcing an existing theme, provide the *exact canonical observation string* from the 'Current User's Observations Log'.
- If identifying a new theme, formulate a concise observation string reflecting the specific preference (e.g., 'Rule: Add signature XYZ', 'Preference: Use TLA for Three Letter Acronym') prefixed with 'Rule: ' or 'Preference: '. Do NOT make the observations overly general.
- If no observations are identified, call the tool with an empty list.
"""

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert system analyzing user feedback to identify and learn *specific, potentially idiosyncratic* user preferences for summarizing text. You MUST use the provided 'extract_observations' tool to return your findings, focusing on capturing the user's unique style and requirements.",
                },
                {"role": "user", "content": prompt},
            ],
            tools=[observation_tool_schema],
            tool_choice={
                "type": "function",
                "function": {"name": "extract_observations"},
            },  # Force tool use
            temperature=0.1,  # Lower temperature for more structured output
            max_tokens=500,  # Adjust if needed, tool calls can consume tokens
        )

        message = response.choices[0].message
        relevant_observations = []  # Default to empty list

        # Check if the model decided to use the tool
        if message.tool_calls:
            tool_call = message.tool_calls[0]
            if tool_call.function.name == "extract_observations":
                try:
                    # Parse the JSON arguments string from the tool call
                    arguments = json.loads(tool_call.function.arguments)
                    # Extract the list of observations, handle case where key might be missing
                    relevant_observations = arguments.get("relevant_observations", [])

                    # Basic validation (ensure it's a list of strings)
                    if not isinstance(relevant_observations, list) or not all(
                        isinstance(item, str) for item in relevant_observations
                    ):
                        st.warning(
                            "LLM tool call returned unexpected format for observations. Treating as empty."
                        )
                        relevant_observations = []
                    else:
                        # Clean up whitespace just in case
                        relevant_observations = [
                            obs.strip() for obs in relevant_observations if obs.strip()
                        ]

                except json.JSONDecodeError:
                    st.error("Error decoding JSON arguments from LLM tool call.")
                    relevant_observations = []  # Treat as error/empty
                except Exception as e:
                    st.error(f"Error processing LLM tool call arguments: {e}")
                    relevant_observations = []  # Treat as error/empty

        # Provide feedback based on processed observations
        if relevant_observations:
            st.toast(
                f"LLM identified {len(relevant_observations)} relevant preference observation(s) via tool.",
                icon="🛠️",
            )
        elif message.tool_calls:  # Tool was called but list was empty or parsing failed
            st.toast(
                "LLM tool called, but no specific preference observations identified."
            )
        else:  # Tool wasn't called (shouldn't happen with tool_choice="required")
            st.warning("LLM did not use the expected tool to extract observations.")

        return relevant_observations  # Return list of strings identified by LLM

    except Exception as e:
        st.error(f"Error during OpenAI API call or processing: {e}")
        st.warning("Could not analyze feedback.")
        return []


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
    # Store observations as {canonical_observation_text: count}
    st.session_state.observations = {}
if "canonical_map" not in st.session_state:
    # Stores {normalized_observation: canonical_observation_text}
    st.session_state.canonical_map = {}
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
    row2 = row(2, vertical_align="bottom")
    row2.subheader("Fake Medical Record")
    if row2.button("Regenerate Medical Record", align="right"):
        st.session_state.fake_record = generate_fake_medical_record()
        st.session_state.initial_summary = ""  # Clear summary when record changes
        st.session_state.edited_summary = ""
        st.rerun()

    record_display_area = st.text_area(
        "Generated Record",
        st.session_state.fake_record,
        height=300,
        key="record_display",
    )

    if st.button("Summarize Record", type="primary"):
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

    if st.button("Save Summary & Preference"):
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
                    relevant_observations = update_rules(
                        st.session_state.initial_summary,
                        st.session_state.edited_summary,
                        direct_preference,
                        st.session_state.rules,  # Pass current rules for context
                        st.session_state.observations,  # Pass current observations
                        current_api_key,
                    )

                # Define learning rate thresholds
                thresholds = {"Slow": 5, "Normal": 3, "Fast": 2}
                threshold = thresholds.get(
                    st.session_state.learning_rate, 3
                )  # Default to Normal

                promoted_count = 0
                # Process the observations returned by the LLM
                if relevant_observations:
                    with st.spinner(
                        f"Processing {len(relevant_observations)} observation(s)..."
                    ):
                        for obs in relevant_observations:
                            normalized_obs = normalize_observation(obs)

                            # Check if this normalized theme exists
                            if normalized_obs in st.session_state.canonical_map:
                                canonical_key = st.session_state.canonical_map[
                                    normalized_obs
                                ]
                                # Increment count for existing canonical key
                                current_count = (
                                    st.session_state.observations.get(canonical_key, 0)
                                    + 1
                                )
                                st.session_state.observations[canonical_key] = (
                                    current_count
                                )
                                st.toast(
                                    f'Observation updated: "{canonical_key[:30]}..." (Count: {current_count})',
                                    icon="📊",
                                )
                            else:
                                # It's a new theme (use the LLM's first version as canonical)
                                canonical_key = obs
                                current_count = 1
                                st.session_state.observations[canonical_key] = (
                                    current_count
                                )
                                st.session_state.canonical_map[normalized_obs] = (
                                    canonical_key  # Map normalized to canonical
                                )
                                st.toast(
                                    f'New observation added: "{canonical_key[:30]}..." (Count: {current_count})',
                                    icon="✨",
                                )

                            # Check for promotion using the canonical key and its count
                            if current_count >= threshold:
                                if canonical_key not in st.session_state.rules:
                                    st.session_state.rules.append(canonical_key)
                                    promoted_count += 1
                                    st.toast(
                                        f'Observation promoted to rule: "{canonical_key[:30]}..."',
                                        icon="🏆",
                                    )
                                    # Optional: Remove from observations/map once promoted?
                                    # if canonical_key in st.session_state.observations:
                                    #     del st.session_state.observations[canonical_key]
                                    # if normalized_obs in st.session_state.canonical_map:
                                    #     del st.session_state.canonical_map[normalized_obs]

                if promoted_count > 0:
                    st.success(f"{promoted_count} observation(s) promoted to rules!")

                st.rerun()  # Rerun to update UI displays


# --- Right Column: Rule Management ---
with col2:
    st.subheader("Learned Rules")
    # Calculate the current threshold for the descriptive text
    thresholds = {"Slow": 5, "Normal": 3, "Fast": 2}
    current_threshold = thresholds.get(
        st.session_state.get("learning_rate", "Normal"), 3
    )

    if not st.session_state.rules:
        st.info("No rules learned yet. Edit summaries or add preferences.")
    else:
        rules_to_keep = []
        for i in range(len(st.session_state.rules)):
            if i < len(st.session_state.rules):
                rule = st.session_state.rules[i]
                rule_col, button_col = st.columns([0.85, 0.15])
                with rule_col:
                    display_rule = rule
                    if display_rule.startswith("Rule: "):
                        display_rule = display_rule[len("Rule: ") :]
                    elif display_rule.startswith("Preference: "):
                        display_rule = display_rule[len("Preference: ") :]
                    display_rule
                with button_col:
                    if st.button(
                        "Delete",
                        key=f"delete_rule_{i}_{rule}",
                        help=f"Delete rule: '{rule}'",
                    ):
                        st.toast(f"Rule '{rule}' deleted.")
                    else:
                        rules_to_keep.append(rule)
            else:
                break
        if len(rules_to_keep) != len(st.session_state.rules):
            st.session_state.rules = rules_to_keep
            st.rerun()

    # Add the descriptive caption here
    st.caption(
        f"Rules are automatically promoted from the Observation Log below when an observation's count reaches the threshold set by the Learning Rate (currently: {current_threshold})."
    )

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
