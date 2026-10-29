import { z } from "zod";

const aiProviderSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
}).strict();

export const aiRuntimeStatusSchema = z.object({
  configuredMode: z.enum(["mock", "live"]),
  effectiveMode: z.enum(["mock", "live", "fallback"]),
  fallbackEnabled: z.boolean(),
  specialists: aiProviderSchema,
  brain: aiProviderSchema,
  lastFailure: z.object({
    provider: z.enum(["baseten", "meta"]),
    reason: z.enum(["authentication", "rate_limit", "timeout", "network", "invalid_response", "provider_error", "unknown"]),
    occurredAt: z.iso.datetime(),
  }).strict().optional(),
}).strict();

export type AIRuntimeStatus = z.infer<typeof aiRuntimeStatusSchema>;
