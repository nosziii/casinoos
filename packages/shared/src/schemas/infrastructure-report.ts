import { z } from "zod";

export const infrastructureReportSchema = z.object({
  incidentDetected: z.boolean(),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1),
  suspectedRootCauses: z.array(
    z.object({
      service: z.string().min(1),
      confidence: z.number().min(0).max(1),
    }),
  ),
  affectedServices: z.array(z.string().min(1)),
  severity: z.enum(["low", "medium", "high", "critical"]),
});

export type InfrastructureReport = z.infer<typeof infrastructureReportSchema>;

