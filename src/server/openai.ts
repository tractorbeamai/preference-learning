import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { generateText, generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { LEARNING_RATE_THRESHOLDS, PreferenceLearningState } from "@/types";
import { diffSentences, diffWords, diffWordsWithSpace } from "diff";

const MODEL = "gpt-4.1-2025-04-14";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateSummarySchema = z.object({
  record: z.string(),
  rules: z.array(z.string()),
});

export const generateSummary = createServerFn({ method: "POST" })
  .validator(zodValidator(generateSummarySchema))
  .handler(async ({ data }) => {
    const { record, rules } = data;

    const prompt = `
Please summarize the following fake medical record in exactly 3-4 concise sentences.

<rules>${rules.join("\n - ")}</rules>
<medical_record>${record}</medical_record>

ALWAYS follow the rules/preferences flawlessly when generating the summary.

3-4 sentences summary:
`;

    try {
      const { text } = await generateText({
        model: openai(MODEL),
        prompt,
        maxOutputTokens: 150,
      });
      return text.trim();
    } catch (error) {
      console.error("Error generating summary:", error);
      throw error;
    }
  });

const observationSchema = z.object({
  observation: z.string(),
  count: z.coerce.number(),
});

const analyzePreferencesSchema = z.object({
  initialSummary: z.string(),
  editedSummary: z.string(),
  directPreference: z.string(),
  currentRules: z.array(z.string()),
  currentObservations: z.array(observationSchema),
  learningRate: z.enum(["Slow", "Normal", "Fast"]),
});

export const analyzePreferences = createServerFn({ method: "POST" })
  .validator(zodValidator(analyzePreferencesSchema))
  .handler(async ({ data }) => {
    const {
      initialSummary,
      editedSummary,
      directPreference,
      currentRules,
      currentObservations,
      learningRate,
    } = data;

    const prompt = `
As an expert system, your task is to analyze user feedback to uncover specific user preferences for text summarization.
Focus on the user's feedback, including summary modifications and direct preferences, in the context of their existing rules and observations.
Identify the user's unique preferences, even if unconventional, such as specific styles, formats, or abbreviations.
- For existing themes, use the *exact canonical observation string* from the <prior_observations_log> and increment the count by 1.
- If no new observations are identified, return the <prior_observations_log> unchanged.

Your task: Generate a unified list of observations, ensuring no duplicates, and indicate their frequency of reinforcement or suggestion by the feedback.

NEVER increment the count of an observation by more than 1. ONLY increment the count if the observation is semantically the same as the existing observation.

<prior_observations_log>
${JSON.stringify(currentObservations)}
</prior_observations_log>
<summary_before_important_user_edits>
${initialSummary}
</summary_before_important_user_edits>
<summary_after_important_user_edits>
${editedSummary}
</summary_after_important_user_edits>
<new_user_modifications>
${JSON.stringify(diffWordsWithSpace(initialSummary, editedSummary))}
</new_user_modifications>
<new_user_direct_preference>
${directPreference}
</new_user_direct_preference>`;

    const { object } = await generateObject({
      model: openai(MODEL),
      prompt,
      schema: z.object({ observations: z.array(observationSchema) }),
      maxOutputTokens: 500,
    });

    const threshold = LEARNING_RATE_THRESHOLDS[learningRate];
    const elegibleObservations = object.observations.filter(
      (observation) => observation.count >= threshold
    );

    let newRules: string[] = [];
    for (const { observation } of elegibleObservations) {
      const rulesPrompt = `
We are learning a user's preferences for summarizing text.
Rewrite the following observation, which the user has established as a preference, into an imperative rule that can be used to instruct future LLM summarizations.
If a very similar rule already exists, you should output the existing rule perfectly, word-for-word.

<observation>${observation}</observation>
<existing_rules>
${currentRules.join("\n - ")}
</existing_rules>

Do not include any other text or commentary in your response.
Rule:`;

      const { text: newRule } = await generateText({
        model: openai(MODEL),
        prompt: rulesPrompt,
        maxOutputTokens: 500,
      });
      newRules.push(newRule);
    }

    newRules = currentRules
      .concat(newRules)
      .filter((rule, index, self) => self.indexOf(rule) === index)
      .map((rule) => rule.trim());

    return {
      observations: object.observations,
      rules: newRules,
    };
  });
