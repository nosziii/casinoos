import { z } from "zod";

export const casinoDomainSchema = z.enum([
  "infrastructure",
  "payment",
  "kyc",
  "cashier",
  "gaming",
  "security",
  "player",
  "support",
]);

export const eventSeveritySchema = z.enum(["info", "warning", "error", "critical"]);

export const casinoEventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.iso.datetime(),
  domain: casinoDomainSchema,
  source: z.string().min(1),
  type: z.string().min(1),
  severity: eventSeveritySchema,
  data: z.record(z.string(), z.unknown()),
});

export type CasinoDomain = z.infer<typeof casinoDomainSchema>;
export type CasinoEvent = z.infer<typeof casinoEventSchema>;
export type EventSeverity = z.infer<typeof eventSeveritySchema>;

