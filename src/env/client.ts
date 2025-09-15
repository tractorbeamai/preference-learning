import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_PROMOTION_THRESHOLD: z.coerce.number().default(3),
  },
  runtimeEnv: import.meta.env,
});
