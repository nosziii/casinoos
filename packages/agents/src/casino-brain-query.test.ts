import type { CasinoIncident } from "@casino-ops/shared";
import { compareMitigations, predictOutage } from "@casino-ops/simulator";
import { describe, expect, it } from "vitest";
import { CasinoBrainQueryService } from "./casino-brain-query.js";
import { MockAIClient } from "./clients/mock-client.js";
import { createDecisionSupportTools } from "./tools/decision-support-tools.js";

const incident: CasinoIncident = {
  incidentId: "INC-QUERY",
  incidentDetected: true,
  severity: "critical",
  title: "Auth incident",
  summary: "Verified fixture.",
  rootCause: { service: "auth-service", confidence: 0.95 },
  affectedSystems: ["payment-service"],
  recommendedActions: ["Compare synthetic mitigations"],
  operationalImpact: { affectedPlayers: 50, estimatedBlockedValue: 1000, riskLevel: "critical" },
};
const service = new CasinoBrainQueryService(new MockAIClient(), createDecisionSupportTools({ predictOutage, compareMitigations }));

describe("CasinoBrainQueryService", () => {
  it("routes a natural-language impact question to deterministic prediction", async () => {
    const response = await service.query("What happens if the outage lasts 45 minutes?", incident);
    expect(response.toolName).toBe("predictOutage");
    expect(response.durationMinutes).toBe(45);
    expect(response.requiresOperatorApproval).toBe(false);
  });

  it("routes a mitigation question to comparison without executing it", async () => {
    const response = await service.query("Compare mitigation strategies for the next 30 minutes", incident);
    expect(response.toolName).toBe("compareMitigations");
    expect(response.requiresOperatorApproval).toBe(true);
    if (response.toolName === "compareMitigations") expect(response.result.recommendedAction).toBe("failover_service");
  });

  it("rejects queries without an active verified incident", async () => {
    await expect(service.query("Predict 30 minutes", { ...incident, incidentDetected: false })).rejects.toThrow("verified active incident");
  });
});
