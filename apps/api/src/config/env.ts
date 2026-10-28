import { z } from "zod";

const booleanString = z.enum(["true", "false"]).transform((value) => value === "true");

const envSchema = z.object({
  AI_MODE: z.enum(["mock", "live"]).default("mock"),
  AI_ENABLED: booleanString.default(true),
  BASETEN_API_KEY: z.string().default(""),
  BASETEN_BASE_URL: z.url().default("https://inference.baseten.co/v1"),
  BASETEN_MODEL: z.string().min(1).default("meta-models/muse-spark-open-1026"),
  META_MODEL_API_KEY: z.string().default(""),
  META_BASE_URL: z.url().default("https://api.meta.ai/v1"),
  META_MODEL: z.string().default(""),
  MAX_AGENT_CALLS_PER_MINUTE: z.coerce.number().int().positive().default(12),
  MAX_EVENT_BATCH_SIZE: z.coerce.number().int().positive().max(100).default(20),
  AGENT_FLUSH_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
  CASINO_BRAIN_COOLDOWN_MS: z.coerce.number().int().nonnegative().default(15000),
  MAX_INVESTIGATION_TURNS: z.coerce.number().int().min(1).max(4).default(4),
  MAX_INVESTIGATION_TOOL_CALLS: z.coerce.number().int().min(1).max(6).default(6),
  INVESTIGATION_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(25000),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default("127.0.0.1"),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(environment);
  if (!result.success) throw new Error(`Invalid environment configuration: ${z.prettifyError(result.error)}`);
  if (result.data.AI_MODE === "live") {
    if (!result.data.BASETEN_API_KEY) throw new Error("BASETEN_API_KEY is required when AI_MODE=live");
    if (!result.data.META_MODEL_API_KEY || !result.data.META_MODEL) {
      throw new Error("META_MODEL_API_KEY and META_MODEL are required when AI_MODE=live");
    }
  }
  return result.data;
}
