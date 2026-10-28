import { z } from "zod";
import { casinoEventSchema } from "./casino-event.js";
import { serviceStateSchema } from "./service-state.js";

export const evidenceProvenanceSchema = z.object({
  toolName: z.enum(["getServiceState", "getDependencies", "getDependents", "getRecentEvents"]),
  toolInput: z.record(z.string(), z.unknown()),
  capturedAt: z.iso.datetime(),
}).strict();

const evidenceBase = {
  id: z.string().regex(/^ev_[a-f0-9]{16}$/),
  summary: z.string().min(1).max(500),
  provenance: evidenceProvenanceSchema,
};

export const investigationEvidenceSchema = z.discriminatedUnion("kind", [
  z.object({ ...evidenceBase, kind: z.literal("service_state"), data: z.object({ service: serviceStateSchema }).strict() }).strict(),
  z.object({
    ...evidenceBase,
    kind: z.literal("dependency"),
    data: z.object({
      serviceId: z.string().min(1),
      relationship: z.enum(["depends_on", "depended_on_by"]),
      relatedServiceIds: z.array(z.string().min(1)),
    }).strict(),
  }).strict(),
  z.object({ ...evidenceBase, kind: z.literal("event"), data: z.object({ event: casinoEventSchema }).strict() }).strict(),
]);

export const investigationChecklistItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(["pending", "completed", "blocked"]),
}).strict();

export const investigationToolCallSchema = z.object({
  id: z.string().min(1),
  toolName: evidenceProvenanceSchema.shape.toolName,
  input: z.record(z.string(), z.unknown()),
  status: z.enum(["succeeded", "failed"]),
  evidenceIds: z.array(z.string()),
  error: z.string().optional(),
}).strict();

export const investigationContextSchema = z.object({
  id: z.string().min(1),
  hypothesis: z.object({ rootCauseService: z.string().min(1), statement: z.string().min(1) }).strict(),
  checklist: z.array(investigationChecklistItemSchema),
  evidence: z.array(investigationEvidenceSchema),
  toolCalls: z.array(investigationToolCallSchema),
  turn: z.number().int().nonnegative(),
  status: z.enum(["planned", "investigating", "verifying", "completed", "insufficient_evidence", "failed"]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).strict();

export type EvidenceProvenance = z.infer<typeof evidenceProvenanceSchema>;
export type InvestigationEvidence = z.infer<typeof investigationEvidenceSchema>;
export type InvestigationContext = z.infer<typeof investigationContextSchema>;
