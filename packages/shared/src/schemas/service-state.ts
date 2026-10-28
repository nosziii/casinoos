import { z } from "zod";

export const serviceStatusSchema = z.enum(["healthy", "degraded", "failed"]);

export const serviceStateSchema = z.object({
  id: z.string().min(1),
  status: serviceStatusSchema,
  latencyMs: z.number().nonnegative(),
  errorRate: z.number().min(0).max(1),
  dependencies: z.array(z.string()),
});

export type ServiceState = z.infer<typeof serviceStateSchema>;

