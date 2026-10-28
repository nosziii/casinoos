import type { CasinoEvent, ServiceState } from "@casino-os/shared";
import { describe, expect, it } from "vitest";
import { createInvestigationContext } from "./context.js";
import { EvidenceStore } from "./evidence-store.js";
import { verifyRootCause } from "./verifier.js";

const capturedAt = "2026-10-28T10:00:30.000Z";
const provenance = (toolName: "getServiceState" | "getDependents" | "getRecentEvents") => ({ toolName, toolInput: {}, capturedAt });

describe("investigation evidence and verification", () => {
  it("creates a deterministic investigation checklist", () => {
    const context = createInvestigationContext({ id: "inv-1", rootCauseService: "auth-service", statement: "Auth degradation caused downstream failures.", timestamp: capturedAt });
    expect(context.status).toBe("planned");
    expect(context.checklist).toHaveLength(4);
  });

  it("creates stable immutable evidence IDs and redacts secrets", () => {
    const store = new EvidenceStore();
    const draft = serviceEvidence({ id: "auth-service", status: "degraded", latencyMs: 2800, errorRate: 0.3, dependencies: [] });
    const first = store.add(draft, provenance("getServiceState"));
    const second = store.add(draft, provenance("getServiceState"));
    expect(first.id).toBe(second.id);
    expect(Object.isFrozen(first)).toBe(true);
    expect(store.list()).toHaveLength(1);
  });

  it("verifies a root cause supported by degradation, dependency and ordered events", () => {
    const evidence = authEvidence();
    const result = verifyRootCause({ serviceId: "auth-service", affectedServiceIds: ["payment-service"], modelConfidence: 0.9 }, evidence);
    expect(result.status).toBe("verified");
    expect(result.verificationScore).toBe(1);
    expect(result.finalConfidence).toBe(0.9);
  });

  it("returns insufficient evidence instead of accepting an unsupported claim", () => {
    const store = new EvidenceStore();
    const evidence = [store.add(serviceEvidence({ id: "auth-service", status: "degraded", latencyMs: 2000, errorRate: 0.2, dependencies: [] }), provenance("getServiceState"))];
    const result = verifyRootCause({ serviceId: "auth-service", affectedServiceIds: ["payment-service"], modelConfidence: 0.99 }, evidence);
    expect(result.status).toBe("insufficient_evidence");
    expect(result.finalConfidence).toBeLessThan(0.99);
  });

  it("does not count duplicate evidence IDs toward the minimum", () => {
    const evidence = authEvidence();
    const duplicated = [evidence[0]!, evidence[0]!, evidence[0]!];
    const result = verifyRootCause({ serviceId: "auth-service", affectedServiceIds: ["payment-service"], modelConfidence: 0.9 }, duplicated);
    expect(result.status).toBe("insufficient_evidence");
  });

  it("rejects a well-populated but contradicted root-cause claim", () => {
    const result = verifyRootCause({ serviceId: "payment-provider", affectedServiceIds: ["payment-service"], modelConfidence: 0.95 }, authEvidence());
    expect(result.status).toBe("rejected");
  });
});

function authEvidence() {
  const store = new EvidenceStore();
  return [
    store.add(serviceEvidence({ id: "auth-service", status: "degraded", latencyMs: 2800, errorRate: 0.3, dependencies: [] }), provenance("getServiceState")),
    store.add({ kind: "dependency", summary: "Payment depends on auth.", data: { serviceId: "auth-service", relationship: "depended_on_by", relatedServiceIds: ["payment-service"] } }, provenance("getDependents")),
    store.add(eventEvidence(event("root", "auth-service", "2026-10-28T10:00:00.000Z")), provenance("getRecentEvents")),
    store.add(eventEvidence(event("impact", "payment-service", "2026-10-28T10:00:10.000Z")), provenance("getRecentEvents")),
  ];
}

function serviceEvidence(service: ServiceState) {
  return { kind: "service_state" as const, summary: `${service.id} state`, data: { service } };
}

function eventEvidence(value: CasinoEvent) {
  return { kind: "event" as const, summary: `${value.source} failure`, data: { event: value } };
}

function event(id: string, source: string, timestamp: string): CasinoEvent {
  return { id, timestamp, domain: source === "auth-service" ? "infrastructure" : "payment", source, type: "SERVICE_FAILED", severity: "critical", data: {} };
}
