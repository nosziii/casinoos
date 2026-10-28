import type { CasinoEvent } from "@casino-os/shared";
import { describe, expect, it } from "vitest";
import { CasinoBrain } from "./casino-brain.js";
import { MockAIClient } from "./clients/mock-client.js";
import { InfrastructureAgent } from "./infrastructure-agent.js";
import { OperationsAgent } from "./operations-agent.js";
import { RiskAgent } from "./risk-agent.js";

const events: CasinoEvent[] = [
  event("infrastructure", "auth-service", "AUTH_LATENCY_CRITICAL", "critical", { latencyMs: 3200 }),
  event("payment", "payment-service", "PAYMENT_AUTH_TIMEOUT", "error", { dependency: "auth-service" }),
  event("kyc", "kyc-service", "KYC_TOKEN_VALIDATION_FAILED", "error", { dependency: "auth-service" }),
  event("cashier", "cashier-service", "CASHIER_AUTH_TIMEOUT", "error", { dependency: "auth-service" }),
];

describe("multi-agent correlation", () => {
  it("combines three specialist reports into a Casino Brain incident", async () => {
    const client = new MockAIClient();
    const [infrastructureReport, operationsReport, riskReport] = await Promise.all([
      new InfrastructureAgent(client).analyze(events),
      new OperationsAgent(client).analyze(events),
      new RiskAgent(client).analyze(events),
    ]);
    const incident = await new CasinoBrain(client).analyze({
      infrastructureReport,
      operationsReport,
      riskReport,
      digitalTwinState: { phase: 2, services: [] },
    });

    expect(incident.incidentDetected).toBe(true);
    expect(incident.rootCause).toEqual({ service: "auth-service", confidence: 0.94 });
    expect(incident.affectedSystems).toEqual(["payment-service", "kyc-service", "cashier-service"]);
    expect(incident.recommendedActions.every((action) => action.toLowerCase().includes("simulate") || !action.toLowerCase().includes("failover"))).toBe(true);
  });
});

function event(
  domain: CasinoEvent["domain"],
  source: string,
  type: string,
  severity: CasinoEvent["severity"],
  data: Record<string, unknown>,
): CasinoEvent {
  return { id: `evt-${type}`, timestamp: "2026-10-27T10:31:00.000Z", domain, source, type, severity, data };
}
