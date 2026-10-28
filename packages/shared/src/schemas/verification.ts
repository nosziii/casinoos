import { z } from "zod";

export const rootCauseClaimSchema = z.object({
  serviceId: z.string().min(1),
  affectedServiceIds: z.array(z.string().min(1)),
  modelConfidence: z.number().min(0).max(1),
}).strict();

export const verificationCheckSchema = z.object({
  check: z.enum(["service_degradation", "dependency_match", "temporal_ordering", "evidence_minimum"]),
  passed: z.boolean(),
  score: z.number().min(0).max(1),
  explanation: z.string().min(1),
  evidenceIds: z.array(z.string()),
}).strict();

export const verificationResultSchema = z.object({
  status: z.enum(["verified", "insufficient_evidence", "rejected"]),
  verificationScore: z.number().min(0).max(1),
  finalConfidence: z.number().min(0).max(1),
  checks: z.array(verificationCheckSchema).length(4),
}).strict();

export type RootCauseClaim = z.infer<typeof rootCauseClaimSchema>;
export type VerificationCheck = z.infer<typeof verificationCheckSchema>;
export type VerificationResult = z.infer<typeof verificationResultSchema>;
