export function summaryPrompt(rules: string[], medical_record: string) {
  return `
  Please summarize the following fake medical record in exactly 3-4 concise sentences.
  Always include demographic information about the patient in your summary.
  Ensure your summary is useful for a fast-moving, busy clinical setting.
  
  <rules>${rules.join("\n - ")}</rules>
  <medical_record>${medical_record}</medical_record>
  
  ALWAYS follow the rules/preferences flawlessly when generating the summary.
  
  3-4 sentences summary:
  `;
}

export function rulesPrompt(observation: string, currentRules: string[]) {
  return `
  We are learning a user's preferences for summarizing text.
  Rewrite the following observation, which the user has established as a preference, into an imperative rule that can be used to instruct future LLM summarizations.
  If a very similar rule already exists, you should output the existing rule perfectly, word-for-word.
  
  <observation>${observation}</observation>
  <existing_rules>
  ${currentRules.join("\n - ")}
  </existing_rules>
  
  Do not include any other text or commentary in your response.
  Rule:`;
}

export function observationsPrompt(
  observationsLog: string,
  initialSummary: string,
  editedSummary: string,
  diff: string,
  directPreference: string,
) {
  return `
  As an expert system, analyze user feedback to uncover specific user preferences for text summarization.
  Focus on the user's feedback, including summary modifications and direct preferences, in the context of their existing rules and observations.
  Identify the user's unique preferences, even if unconventional, such as specific styles, formats, or abbreviations.
  - For existing themes, use the exact canonical observation string from the <prior_observations_log> and increment the count by 1.
  - If no new observations are identified, return the <prior_observations_log> unchanged.
  - NEVER increment the count of an observation by more than 1. ONLY increment the count if the observation is semantically the same as the existing observation.
  
  Call the submit_observations tool ONCE with the unified list of observations.
  
  <prior_observations_log>
  ${observationsLog}
  </prior_observations_log>
  <summary_before_important_user_edits>
  ${initialSummary}
  </summary_before_important_user_edits>
  <summary_after_important_user_edits>
  ${editedSummary}
  </summary_after_important_user_edits>
  <new_user_modifications>
  ${diff}
  </new_user_modifications>
  <new_user_direct_preference>
  ${directPreference}
  </new_user_direct_preference>`;
}
