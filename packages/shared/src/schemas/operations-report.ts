import { z } from "zod";

export const operationsReportSchema = z.object({
  incidentDetected: z.boolean(),
  affectedPlayers: z.number().int().nonnegative(),
  failedTransactions: z.number().int().nonnegative(),
  estimatedBlockedValue: z.number().nonnegative(),
  supportLoadIncrease: z.number().min(0),
  summary: z.string().min(1),
});

export type OperationsReport = z.infer<typeof operationsReportSchema>;

