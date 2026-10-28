import { z } from "zod";

export const predictionCheckpointSchema = z.object({
  minute: z.number().int().nonnegative(),
  affectedPlayers: z.number().int().nonnegative(),
});

export const simulationPredictionSchema = z.object({
  durationMinutes: z.number().int().positive(),
  currentAffectedPlayers: z.number().int().nonnegative(),
  timeline: z.array(predictionCheckpointSchema),
  affectedPlayers: z.number().int().nonnegative(),
  failedDeposits: z.number().int().nonnegative(),
  queuedWithdrawals: z.number().int().nonnegative(),
  estimatedBlockedValue: z.number().nonnegative(),
  kycQueueCriticalInMinutes: z.number().int().nonnegative(),
  supportLoadIncrease: z.number().nonnegative(),
});

export type SimulationPrediction = z.infer<typeof simulationPredictionSchema>;

