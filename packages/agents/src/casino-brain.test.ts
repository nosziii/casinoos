import { describe, expect, it } from "vitest";
import type { AIClient, CompletionRequest } from "./clients/ai-client.js";
import { CasinoBrain, type CasinoBrainInput } from "./casino-brain.js";

describe("evidence-aware Casino Brain", () => {
  it("caps model confidence at the deterministic verification confidence", async () => {
    const incident = await new CasinoBrain(new FixedIncidentClient()).analyze(input("verified", 0.63));
    expect(incident.rootCause.confidence).toBe(0.63);
  });

  it("cannot create an active incident from insufficient evidence", async () => {
    const incident = await new CasinoBrain(new FixedIncidentClient()).analyze(input("insufficient_evidence", 0.2));
    expect(incident.incidentDetected).toBe(false);
    expect(incident.rootCause).toEqual({ service: "unknown", confidence: 0 });
  });
});

class FixedIncidentClient implements AIClient {
  complete<T>(request: CompletionRequest<T>): Promise<T> {
    return Promise.resolve(request.schema.parse({
      incidentId: "INC-TEST",
      incidentDetected: true,
      severity: "critical",
      title: "Authentication incident",
      summary: "Synthetic fixture.",
      rootCause: { service: "auth-service", confidence: 1 },
      affectedSystems: ["payment-service"],
      recommendedActions: ["Simulate failover"],
      operationalImpact: { affectedPlayers: 10, estimatedBlockedValue: 100, riskLevel: "high" },
    }));
  }
}

function input(status: "verified" | "insufficient_evidence", finalConfidence: number): CasinoBrainInput {
  const checks = ["service_degradation", "dependency_match", "temporal_ordering", "evidence_minimum"] as const;
  return {
    infrastructureReport: { incidentDetected: true, confidence: 0.9, summary: "Auth degraded.", suspectedRootCauses: [{ service: "auth-service", confidence: 0.9 }], affectedServices: ["payment-service"], severity: "critical" },
    operationsReport: { incidentDetected: true, affectedPlayers: 10, failedTransactions: 2, estimatedBlockedValue: 100, supportLoadIncrease: 0.1, summary: "Impact." },
    riskReport: { riskLevel: "high", financialExposure: 100, criticalSystems: ["auth-service"], recommendedEscalation: true, summary: "Risk." },
    digitalTwinState: { phase: 2, services: [] },
    infrastructureInvestigation: {
      verification: { status, verificationScore: finalConfidence, finalConfidence, checks: checks.map((check) => ({ check, passed: status === "verified", score: status === "verified" ? 1 : 0, explanation: "Fixture.", evidenceIds: [] })) },
      evidence: [],
    },
  };
}
