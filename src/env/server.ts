import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  runtimeEnv: process.env,
  server: {
    ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-"),
    ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-20250514"),
    VITE_PROMOTION_THRESHOLD: z.coerce.number().default(3),
  },
});
