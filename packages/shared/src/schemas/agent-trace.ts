import { z } from "zod";

export const agentTraceStageSchema = z.enum(["plan", "tool_call", "observation", "verification", "report"]);

export const agentTraceEventSchema = z.object({
  id: z.string().min(1),
  investigationId: z.string().min(1),
  timestamp: z.iso.datetime(),
  agent: z.literal("infrastructure-agent"),
  stage: agentTraceStageSchema,
  status: z.enum(["info", "success", "error"]),
  summary: z.string().min(1).max(500),
  evidenceIds: z.array(z.string()),
  details: z.record(z.string(), z.unknown()),
}).strict();

export type AgentTraceEvent = z.infer<typeof agentTraceEventSchema>;
export type AgentTraceStage = z.infer<typeof agentTraceStageSchema>;
