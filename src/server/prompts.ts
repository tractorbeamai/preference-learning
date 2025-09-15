export function summaryPrompt(rules: string[], medical_record: string) {
  return `
  Your task is to create a comprehensive medical record summary that demonstrates understanding of patient preferences and communication styles.
  
  Generate a summary of exactly 3-4 concise, well-structured sentences that captures the key medical information from the provided record.
  
  <context>
  This is a demonstration of preference learning in an AI product. The medical record is synthetically generated for testing purposes.
  Your summary will be evaluated on how well it follows the user's established preferences, not on medical accuracy.
  The synthetic records may contain logical inconsistencies - treat all information as valid for this demonstration.
  </context>
  
  <user_preferences>
  Apply each of these preferences meticulously when crafting your summary:
  ${rules.map((rule) => `- ${rule}`).join("\n  ")}
  </user_preferences>
  
  <medical_record>
  ${medical_record}
  </medical_record>
  
  <output_format>
  Write your summary in exactly 3-4 complete sentences using smoothly flowing prose.
  Each sentence should convey distinct, meaningful information about the patient.
  Apply all user preferences naturally within your narrative summary.
  </output_format>
  
  Summary:
  `;
}

export function rulesPrompt(observation: string, currentRules: string[]) {
  return `
  Your task is to convert user preference observations into actionable, consistent rules for text summarization.
  
  <context>
  You are part of a preference learning system that captures and standardizes user preferences.
  Consistency is crucial - when users express similar preferences, they should map to the same rule.
  This ensures the system learns efficiently and avoids redundant or conflicting rules.
  </context>
  
  <observation_to_convert>
  ${observation}
  </observation_to_convert>
  
  <existing_rules>
  Review these established rules carefully. If the observation matches an existing rule's intent, return that rule verbatim:
  ${currentRules.map((rule) => `- ${rule}`).join("\n  ")}
  </existing_rules>
  
  <instructions>
  Transform the observation into a clear, imperative rule that future LLMs can follow.
  
  Your rule should:
  - Be written as a direct command (e.g., "Use medical abbreviations" not "The user prefers medical abbreviations")
  - Be specific and actionable
  - Match existing rules word-for-word if they express the same preference
  - Be concise while maintaining clarity
  </instructions>
  
  <output_format>
  Provide only the rule text with no additional commentary, explanations, or formatting.
  </output_format>
  
  Rule:`;
}

export function observationsPrompt(
  observationsLog: string,
  initialSummary: string,
  editedSummary: string,
  diff: string,
) {
  return `
  Your task is to analyze user feedback and extract specific preferences for text summarization, maintaining consistency with existing observations.
  
  <context>
  You are an expert preference learning system that identifies patterns in user behavior and feedback.
  Users express preferences through both direct statements and indirect actions (like editing summaries).
  Maintaining observation consistency is critical - similar preferences should map to the same observation.
  Even unconventional preferences (unusual abbreviations, specific formats, unique styles) are valid and should be captured.
  </context>
  
  <analysis_inputs>
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
  </analysis_inputs>
  
  <instructions>
  Analyze the user's modifications to identify preference patterns.
  
  Critical rules for observation management:
  1. When you identify a preference that matches an existing observation semantically, use the EXACT canonical string from prior_observations_log and increment its count by exactly 1
  2. Create new observations only for genuinely new preferences not covered by existing observations
  3. Observations should be simple statements of preference without conditions (avoid "when X, do Y" or "if X, then Y")
  4. Each observation can only have its count incremented by 1 per analysis
  5. If no new preferences are identified, return the prior_observations_log exactly as provided
  
  Focus on extracting actionable preferences from:
  - Specific changes the user made to the summary
  - Patterns in how the user wants information presented
  </instructions>
  
  <output_format>
  Call the submit_observations tool exactly ONCE with your complete, unified list of observations.
  Include both existing observations (with updated counts where applicable) and any new observations.
  </output_format>
  `;
}
