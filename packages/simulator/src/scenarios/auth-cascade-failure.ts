import type { CasinoDomain, CasinoEvent, EventSeverity, ServiceState } from "@casino-ops/shared";

interface EventDefinition {
  domain: CasinoDomain;
  source: string;
  type: string;
  severity: EventSeverity;
  data: Record<string, unknown>;
}

const phaseEvents: readonly EventDefinition[][] = [
  [],
  [
    { domain: "infrastructure", source: "auth-service", type: "AUTH_LATENCY_HIGH", severity: "warning", data: { latencyMs: 800, baselineMs: 80 } },
  ],
  [
    { domain: "infrastructure", source: "auth-service", type: "AUTH_LATENCY_CRITICAL", severity: "critical", data: { latencyMs: 3200, baselineMs: 80 } },
    { domain: "payment", source: "payment-service", type: "PAYMENT_AUTH_TIMEOUT", severity: "error", data: { dependency: "auth-service" } },
    { domain: "kyc", source: "kyc-service", type: "KYC_TOKEN_VALIDATION_FAILED", severity: "error", data: { dependency: "auth-service" } },
    { domain: "cashier", source: "cashier-service", type: "CASHIER_AUTH_TIMEOUT", severity: "error", data: { dependency: "auth-service" } },
    { domain: "player", source: "player-registration", type: "REGISTRATION_AUTH_FAILED", severity: "error", data: { dependency: "auth-service" } },
  ],
  [
    { domain: "payment", source: "payment-service", type: "PAYMENT_FAILED", severity: "critical", data: { failedTransactions: 12, blockedValueEur: 4250 } },
    { domain: "kyc", source: "kyc-service", type: "KYC_QUEUE_GROWING", severity: "warning", data: { queueDepth: 34 } },
    { domain: "player", source: "player-registration", type: "PLAYER_REGISTRATION_FAILED", severity: "error", data: { affectedPlayers: 17 } },
    { domain: "support", source: "customer-support", type: "SUPPORT_COMPLAINT_SPIKE", severity: "warning", data: { increaseRatio: 0.42 } },
  ],
];

export const AUTH_CASCADE_SCENARIO = "auth-cascade-failure";

export function applyAuthCascadePhase(services: Map<string, ServiceState>, phase: number): void {
  if (phase >= 1) services.set("auth-service", { ...required(services, "auth-service"), status: phase >= 2 ? "failed" : "degraded", latencyMs: phase >= 2 ? 3200 : 800, errorRate: phase >= 2 ? 0.58 : 0.12 });
  if (phase >= 2) {
    for (const id of ["payment-service", "kyc-service", "cashier-service", "player-registration"]) {
      const service = required(services, id);
      services.set(id, { ...service, status: phase >= 3 ? "failed" : "degraded", latencyMs: service.latencyMs * 4, errorRate: phase >= 3 ? 0.62 : 0.28 });
    }
  }
}

export function createAuthCascadeEvents(phase: number, now: Date, sequenceStart: number): CasinoEvent[] {
  const definitions = phaseEvents[phase] ?? [];
  return definitions.map((definition, index) => ({
    id: `evt_${String(sequenceStart + index).padStart(5, "0")}`,
    timestamp: new Date(now.getTime() + index * 1000).toISOString(),
    ...definition,
  }));
}

function required(services: Map<string, ServiceState>, id: string): ServiceState {
  const service = services.get(id);
  if (!service) throw new Error(`Unknown service: ${id}`);
  return service;
}

