import { z } from "zod";

const toolNameSchema = z.enum(["getServiceState", "getDependencies", "getDependents", "getRecentEvents"]);

export const investigationActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("call_tool"),
    rationale: z.string().min(1).max(500),
    toolName: toolNameSchema,
    input: z.record(z.string(), z.unknown()),
  }).strict(),
  z.object({
    action: z.literal("finish"),
    rationale: z.string().min(1).max(500),
  }).strict(),
]);

export type InvestigationAction = z.infer<typeof investigationActionSchema>;
