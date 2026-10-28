import { z } from "zod";

export const casinoIncidentSchema = z.object({
  incidentId: z.string().min(1),
  incidentDetected: z.boolean(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  title: z.string().min(1),
  summary: z.string().min(1),
  rootCause: z.object({ service: z.string().min(1), confidence: z.number().min(0).max(1) }),
  affectedSystems: z.array(z.string().min(1)),
  recommendedActions: z.array(z.string().min(1)).min(1),
  operationalImpact: z.object({
    affectedPlayers: z.number().int().nonnegative(),
    estimatedBlockedValue: z.number().nonnegative(),
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
  }),
});

export type CasinoIncident = z.infer<typeof casinoIncidentSchema>;

