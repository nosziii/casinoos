import { z } from "zod";
import { simulationPredictionSchema } from "./simulation-prediction.js";

export const mitigationActionSchema = z.enum([
  "restart_service",
  "failover_service",
  "disable_feature",
  "queue_requests",
  "reduce_load",
]);

export const mitigationResultSchema = z.object({
  action: mitigationActionSchema,
  title: z.string().min(1),
  estimatedRecovery: z.number().min(0).max(1),
  risk: z.enum(["low", "medium", "high"]),
  operationalImpact: z.enum(["low", "medium", "high"]),
  recoveryTimeMinutes: z.number().int().positive(),
  projectedBlockedValue: z.number().nonnegative(),
  score: z.number(),
  recommended: z.boolean(),
});

export const mitigationComparisonSchema = z.object({
  durationMinutes: z.number().int().positive(),
  baseline: simulationPredictionSchema,
  strategies: z.array(mitigationResultSchema).min(1),
  recommendedAction: mitigationActionSchema,
});

export const mitigationSimulationSchema = z.object({
  action: mitigationActionSchema,
  status: z.enum(["running", "completed"]),
  outcome: z.enum(["pending", "recovered", "partial", "contained", "stabilized"]),
  progress: z.number().min(0).max(1),
  summary: z.string().min(1),
});

export type MitigationAction = z.infer<typeof mitigationActionSchema>;
export type MitigationComparison = z.infer<typeof mitigationComparisonSchema>;
export type MitigationResult = z.infer<typeof mitigationResultSchema>;
export type MitigationSimulation = z.infer<typeof mitigationSimulationSchema>;
