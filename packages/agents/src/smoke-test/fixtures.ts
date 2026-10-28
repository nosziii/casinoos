import { casinoEventSchema, type CasinoEvent } from "@casino-os/shared";
import type { InfrastructureSmokeFixture } from "./types.js";

const BASE_TIME = "2026-01-15T10:00:00.000Z";

function event(input: Omit<CasinoEvent, "timestamp"> & { timestamp?: string }): CasinoEvent {
  return casinoEventSchema.parse({ timestamp: BASE_TIME, ...input });
}

export const infrastructureSmokeFixtures: InfrastructureSmokeFixture[] = [
  {
    id: "auth-cascade",
    description: "Shared authentication degradation propagates to dependent services.",
    events: [
      event({ id: "smoke-auth-1", domain: "infrastructure", source: "auth-service", type: "AUTH_LATENCY_CRITICAL", severity: "critical", data: { latencyMs: 4200 } }),
      event({ id: "smoke-auth-2", domain: "payment", source: "payment-service", type: "PAYMENT_AUTH_TIMEOUT", severity: "error", data: { dependency: "auth-service" } }),
      event({ id: "smoke-auth-3", domain: "kyc", source: "kyc-service", type: "KYC_TOKEN_VALIDATION_FAILED", severity: "error", data: { dependency: "auth-service" } }),
      event({ id: "smoke-auth-4", domain: "cashier", source: "cashier-service", type: "CASHIER_AUTH_TIMEOUT", severity: "error", data: { dependency: "auth-service" } }),
    ],
    expected: { incidentDetected: true, rootCause: "auth-service" },
  },
  {
    id: "payment-provider-degradation",
    description: "An independent payment provider failure must not be attributed to authentication.",
    events: [
      event({ id: "smoke-payment-1", domain: "payment", source: "payment-provider", type: "PAYMENT_PROVIDER_LATENCY_HIGH", severity: "error", data: { latencyMs: 5100 } }),
      event({ id: "smoke-payment-2", domain: "payment", source: "payment-service", type: "PAYMENT_PROVIDER_TIMEOUT", severity: "critical", data: { dependency: "payment-provider", failedTransactions: 18 } }),
    ],
    expected: { incidentDetected: true, rootCause: "payment-provider", forbiddenRootCause: "auth-service" },
  },
  {
    id: "healthy-baseline",
    description: "Routine healthy events must not create an incident.",
    events: [
      event({ id: "smoke-healthy-1", domain: "infrastructure", source: "auth-service", type: "SERVICE_HEALTHY", severity: "info", data: { latencyMs: 42 } }),
      event({ id: "smoke-healthy-2", domain: "payment", source: "payment-service", type: "PAYMENT_HEALTHY", severity: "info", data: { latencyMs: 67 } }),
    ],
    expected: { incidentDetected: false },
  },
];
