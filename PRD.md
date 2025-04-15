Below is a comprehensive Product Requirements Document (PRD) intended for the engineering team. This document outlines the goals, functionality, user flows, technical specifications, and success criteria for our one-page Streamlit prototype that learns user preferences and integrates them into LLM workflows.

---

# Product Requirements Document (PRD)

**Product Name:** Tractorbeam Preference Learning Prototype

**Document Version:** 1.0  
**Author:** [Your Name], Lead Product Manager  
**Date:** April 15, 2025

---

## 1. Overview

The goal of this prototype is to demonstrate a system that learns user preferences over time by generalizing rules from both implicit text differences (diff data) and explicit direct-stated preferences. The interface will use Streamlit to offer a simple, one-page layout split into two columns:

- **Left Column:** Displays a randomly generated, long fake medical record (∼1000 words) with controls to regenerate and summarize records.
- **Right Column:** Shows a list of “learned” rules (preferences) with management controls (delete/edit).

The system will feed the full fake record into an LLM call (incorporating both static prompt content and the current rule set) to generate a concise 3-4 sentence patient summary. The summary is editable by the user before being submitted for rule extraction and rule adjustment. The prototype’s goal is to serve as proof-of-concept for LLM generalization and dynamic rule learning.

---

## 2. Goals and Objectives

- **Demonstrate Adaptive Learning:** Show that an LLM can extract generalized rules from user-edited text and diff changes to learn preferences.
- **User-Driven Interaction:** Allow the user to influence the output by providing direct preferences and editing summaries.
- **Dynamic Rule Management:** Implement a system where rules can be automatically updated, added, or deleted based on new user input.
- **Simplicity and Clarity:** Keep the prototype to a single Streamlit page with intuitive UI elements.
- **Tool Integration:** Use direct LLM calls (via OpenAI models) to generate text summarizations and rule processing, while avoiding complex frameworks like LangChain.

---

## 3. User Stories

### 3.1 Primary User Story

**As a user, I want to generate and review a long fake medical record, adjust the generated patient summary, and provide direct preferences so that the system can learn and generalize my rules over time.**

#### Acceptance Criteria:

- **Fake Medical Record Generation:**

  - The system generates a 1000-word fake medical record that is highly detailed and follows a consistent format.
  - A "Regenerate Medical Record" button enables refreshing the record.

- **Summarization Process:**

  - A “Summarize” button sends the full record (along with current learned rules) to an LLM using a static prompt.
  - The LLM returns a concise 3-4 sentence summary.
  - The summary appears in an editable text box for the user to modify as needed.

- **Direct Preference Capture:**

  - A separate text area is provided below the summary for the user to input a direct preference.
  - A "Save" button below both sections triggers a process that:
    - Analyzes the user-edited summary (diff data) and the direct preference.
    - Compares this feedback against the current rule set.
    - Determines if new rules should be created, if existing rules should be modified, or if redundant rules should be deleted.
    - Rewrites direct preferences into a standard rule format before insertion, ensuring there are no duplicates.

- **Rule Management UI:**
  - The right side of the page displays all current rules.
  - Each rule is shown in a clear, structured format with an associated "Delete" button that allows the user to remove the rule from memory.
  - Optional: Provide an "Edit" functionality for individual rules if further refinement is needed.

### 3.2 Secondary User Story

**As a developer, I need to ensure that all LLM calls and tool integrations are performed in a structured manner, reducing dependency on heavy frameworks while maintaining clarity in code and flow.**

#### Acceptance Criteria:

- Use straightforward calls to OpenAI models to retrieve summaries and process rules.
- Maintain clear separation between UI components and backend rule processing logic.
- Leverage structured output from OpenAI models to facilitate rule extraction and updating with minimal additional parsing logic.

---

## 4. Features and Functionality

### 4.1 UI Layout

- **Two-Column Layout:**

  - **Left Column (Interactive Medical Record and Input)**

    - **Fake Medical Record Display:** A text area or div containing a generated 1000-word fake medical record.
    - **"Regenerate Medical Record" Button:** Triggers a function to generate a new record.
    - **"Summarize" Button:** Initiates an LLM call to create a 3-4 sentence summary based on the current record and existing rules.
    - **Editable Summary Box:** Populated with the LLM-generated summary that the user can further edit.
    - **Direct Preference Input Area:** A text area below the summary for direct user preference input.
    - **"Save" Button:** Initiates the rule update process (see section 4.3).

  - **Right Column (Rule Management)**
    - **Rules List:** A dynamic list displaying all learned rules in a consistent format.
    - **Delete Buttons:** Each rule entry has a button to remove it from the rule set.
    - **Optional – Edit Functionality:** Consider allowing inline editing of rules for fine-tuning.

### 4.2 Data Generation

- **Fake Medical Record Generator:**
  - The generator creates a long-form, detailed fake medical record (∼1000 words) that mimics the format of a real doctor’s visit.
  - The structure remains consistent (e.g., patient information, visit details, diagnosis, treatment plans, notes), but all data is fabricated.
  - Ensure the generated content is sufficiently varied between regenerations.

### 4.3 Summarization and Rule Extraction Flow

- **Summarization Process:**

  - Combine the fake record text with the current rule set and a static prompt that instructs the LLM to produce a concise patient summary.
  - Send the request to the LLM and return the 3-4 sentence summary.
  - Display the summary in an editable textbox for user adjustments.

- **Rule Extraction and Update:**
  - When the user clicks "Save", the system should:
    - Compute the diff between the initial LLM-generated summary and the user-edited version.
    - Analyze the direct preference text provided by the user.
    - Standardize the direct preference input into a pre-defined rule format.
    - Merge diff data and direct preferences with the existing rules:
      - **Insertion:** Add new rules that are not present.
      - **Deletion:** Remove rules if the diff suggests those rules are no longer applicable.
      - **Modification:** Edit any existing rules based on differences in the diff data.
  - **Tool Calling and Structured Output:**
    - Use direct LLM calls with a structured schema to output a set of potential rules.
    - The LLM response should be parsed to update the rule set accordingly.

### 4.4 Backend Considerations

- **State Management:**

  - Manage the state of the generated record, summary, and rules list within Streamlit session state.
  - Ensure that every save operation updates the session state appropriately without needing to persist the entire medical record output externally.

- **LLM Integration:**

  - Use a simple, direct API wrapper for OpenAI models.
  - All calls to the LLM should:
    - Include the full fake record text.
    - Include existing rules.
    - Use a consistent, static prompt to generate the summary.
  - Leverage structured outputs (e.g., JSON responses) from the LLM when parsing the rule extraction/update process.

- **Direct Preference Handling:**
  - Direct preferences should be parsed and rewritten into the standard rule format.
  - Implement duplicate detection logic to avoid inserting rule redundancies.

---

## 5. Technical Requirements

- **Framework:** Streamlit for rapid prototyping with Python.
- **Python Environment:**
  - Use Python 3.8+ with required packages (e.g., Streamlit, OpenAI SDK, any text-diff libraries if needed).
- **LLM API:**
  - Integrate with OpenAI's API using lightweight wrappers for calls.
- **Session State Management:**
  - Utilize Streamlit's session state for maintaining the current fake record, summary, and list of rules.
- **Diff Computation:**
  - Use built-in Python libraries or lightweight third-party libraries to compute text differences.
- **Data Flow:**
  - The entire flow (record generation → summarization → rule extraction/update) should occur within a single page load, with backend updates triggered on user input events (button presses).
- **Security & Permissions:**
  - Ensure that API keys (for OpenAI) and any sensitive information remain secured within environment variables.

---

## 6. User Interface and Experience (UX)

### 6.1 Wireframe Overview

- **Left Column:**

  - Top Section: Generated fake medical record with a “Regenerate” button.
  - Middle Section: "Summarize" button leading to the generation of a 3-4 sentence summary.
  - Below: Editable summary textbox.
  - Bottom: Direct preference input area and “Save” button.

- **Right Column:**
  - List view of existing rules.
  - Each list item displays the rule in a readable format along with a “Delete” button (and optionally an “Edit” option).

### 6.2 Interaction Flow

1. **Generate Medical Record:**
   - On page load or upon clicking "Regenerate", a new fake record is generated.
2. **Summarization:**
   - User clicks "Summarize", which triggers an LLM call combining the record and current rules.
   - The summary is displayed for review and edit.
3. **Direct Preference Submission:**
   - User edits the summary (if needed) and/or enters a direct preference in the text area.
4. **Save Changes:**
   - Upon clicking "Save", the system:
     - Computes the diff between the original generated summary and the edited text.
     - Processes the direct preference.
     - Calls the appropriate tool functions via structured OpenAI outputs to update the rule set.
     - Reflects the updated rule set in the right column.
5. **Rule Management:**
   - The user may delete (or optionally edit) any existing rule via the provided buttons in the rules list.

---

## 7. Success Metrics

- **User Engagement:**
  - Number of times a user clicks “Summarize”, “Save”, and uses direct input.
  - Frequency of using the "Regenerate Medical Record" button.
- **Accuracy of Rule Generalization:**
  - Measure the correctness and usefulness of the updated rules as a result of text diff analysis and direct preference rewriting.
- **System Response Time:**
  - LLM call response should be within acceptable limits (ideally under 2–3 seconds per call).
- **User Feedback:**
  - Qualitative feedback from beta users on ease of use and clarity of the learned rules.
- **Error Rates:**
  - Number of failed API calls or mis-computations during the diff and rule update process.

---

## 8. Risk Mitigation and Future Considerations

- **Complexity of Rule Extraction:**
  - Start with simple diff algorithms and explicit direct preference handling.
  - Document potential pitfalls in rule ambiguity for future iterations.
- **LLM Dependence:**
  - Handle timeouts and fallback gracefully if the LLM service is unresponsive.
- **Scalability:**
  - While this is a prototype, design the code in a modular fashion so that future iterations could integrate more advanced features like user authentication and persistent storage if needed.
- **User Interface Constraints:**
  - Keep the UI intuitive, ensuring users can see the impact of their preferences immediately.

---

## 9. Next Steps for Engineering Team

1. **Prototype Layout:**
   - Develop the two-column Streamlit layout as described.
2. **Fake Record Generation:**
   - Implement the fake medical record generator ensuring a consistent format.
3. **LLM Integration:**
   - Set up API calls to OpenAI (or alternative LLM service) for summarization and rule extraction.
4. **Rule Management Backend:**
   - Build the logic to compare, update, and maintain the rule list based on diff data and direct preference input.
5. **Testing & Iteration:**
   - Conduct user tests to validate flow, measure success metrics, and refine the rule update algorithm.
6. **Documentation & Deployment:**
   - Document the code and process flow clearly to facilitate future enhancements and potential integration into a larger product.

---

This PRD should serve as a complete guide for building the Tractorbeam preference learning prototype. Please reach out with any questions or if further clarification is needed on any section.
