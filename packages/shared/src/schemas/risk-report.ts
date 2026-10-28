import { z } from "zod";

export const riskReportSchema = z.object({
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  financialExposure: z.number().nonnegative(),
  criticalSystems: z.array(z.string().min(1)),
  recommendedEscalation: z.boolean(),
  summary: z.string().min(1),
});

export type RiskReport = z.infer<typeof riskReportSchema>;

