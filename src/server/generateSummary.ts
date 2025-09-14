import { env } from "@/env/server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { generateText } from "ai";
import * as z from "zod";
import { summaryPrompt } from "./prompts";

const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });

export const generateSummary = createServerFn({ method: "POST" })
  .validator(
    zodValidator(
      z.object({
        record: z.string(),
        rules: z.array(z.string()),
      }),
    ),
  )
  .handler(async ({ data: { record, rules } }) => {
    const { text } = await generateText({
      model: anthropic(env.ANTHROPIC_MODEL),
      prompt: summaryPrompt(rules, record),
      maxOutputTokens: 256,
    });

    return { summary: text.trim() };
  });
