import type { CasinoEvent } from "@casino-os/shared";
import { describe, expect, it } from "vitest";
import { MockAIClient } from "./clients/mock-client.js";
import { InfrastructureAgent } from "./infrastructure-agent.js";

describe("InfrastructureAgent", () => {
  it("identifies auth-service as the shared root cause", async () => {
    const event = (source: string, type: string): CasinoEvent => ({
      id: `evt-${type}`,
      timestamp: "2026-10-27T10:31:00.000Z",
      domain: source.startsWith("payment") ? "payment" : source.startsWith("kyc") ? "kyc" : source.startsWith("cashier") ? "cashier" : "infrastructure",
      source,
      type,
      severity: "error",
      data: { dependency: "auth-service" },
    });
    const report = await new InfrastructureAgent(new MockAIClient()).analyze([
      event("auth-service", "AUTH_LATENCY_HIGH"),
      event("payment-service", "PAYMENT_AUTH_TIMEOUT"),
      event("kyc-service", "KYC_TOKEN_VALIDATION_FAILED"),
      event("cashier-service", "CASHIER_AUTH_TIMEOUT"),
    ]);

    expect(report.incidentDetected).toBe(true);
    expect(report.suspectedRootCauses[0]?.service).toBe("auth-service");
    expect(report.affectedServices).toEqual(["payment-service", "kyc-service", "cashier-service"]);
  });
});

