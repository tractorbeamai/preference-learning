import { env } from "@/env/server";
import { LEARNING_RATE_THRESHOLDS } from "@/utils/types";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { generateText, hasToolCall, tool } from "ai";
import { diffWordsWithSpace } from "diff";
import { z } from "zod";
import { observationsPrompt, rulesPrompt } from "./prompts";

const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });

const Observation = z.object({
  observation: z.string(),
  count: z.coerce.number(),
});
type Observation = z.infer<typeof Observation>;

export const analyzePreferences = createServerFn({ method: "POST" })
  .validator(
    zodValidator(
      z.object({
        initialSummary: z.string(),
        editedSummary: z.string(),
        directPreference: z.string(),
        currentRules: z.array(z.string()),
        currentObservations: z.array(Observation),
        learningRate: z.enum(["Slow", "Normal", "Fast"]),
      }),
    ),
  )
  .handler(
    async ({
      data: {
        initialSummary,
        editedSummary,
        directPreference,
        currentRules,
        currentObservations,
        learningRate,
      },
    }) => {
      const observationsLog = currentObservations
        .map((o) => `- ${o.observation} [count: ${o.count}]`)
        .join("\n");

      const diff = diffWordsWithSpace(initialSummary, editedSummary)
        .map(({ value, added, removed }) =>
          added ? `- added: ${value}` : removed ? `- removed: ${value}` : null,
        )
        .filter((d) => d !== null)
        .join("\n");

      let newObservations: Observation[] = [];

      await generateText({
        model: anthropic(env.ANTHROPIC_MODEL),
        prompt: observationsPrompt(
          observationsLog,
          initialSummary,
          editedSummary,
          diff,
          directPreference,
        ),
        tools: {
          submit_observations: tool({
            description:
              "Return the unified observations list reflecting the user's preferences and counts.",
            inputSchema: z.object({
              observations: z.array(Observation),
            }),
            execute: async ({ observations }) => {
              newObservations = observations;
              return "ok";
            },
          }),
        },
        toolChoice: {
          type: "tool",
          toolName: "submit_observations",
        },
        stopWhen: [hasToolCall("submit_observations")],
        maxOutputTokens: 1024,
      });

      const threshold = LEARNING_RATE_THRESHOLDS[learningRate];
      const eligibleObservations = newObservations.filter(
        (o) => o.count >= threshold,
      );

      const newRulesPromises = eligibleObservations.map(
        async ({ observation }) => {
          const { text: newRule } = await generateText({
            model: anthropic(env.ANTHROPIC_MODEL),
            prompt: rulesPrompt(observation, currentRules),
            maxOutputTokens: 200,
          });
          return newRule;
        },
      );

      let newRules = await Promise.all(newRulesPromises);

      newRules = currentRules
        .concat(newRules)
        .map((rule) => rule.trim())
        .filter((rule, index, self) => self.indexOf(rule) === index);

      return {
        observations: newObservations,
        rules: newRules,
      };
    },
  );
