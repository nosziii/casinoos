import { describe, expect, it } from "vitest";
import type { AgentTraceEvent } from "@casino-ops/shared";
import { latestInvestigationTraces, summarizeInvestigation } from "./agent-trace";

const trace = (run: string, sequence: number, stage: AgentTraceEvent["stage"], overrides: Partial<AgentTraceEvent> = {}): AgentTraceEvent => ({
  id: `${run}-trace-${sequence}`,
  investigationId: "inv-auth-service",
  timestamp: "2026-10-28T12:00:00.000Z",
  agent: "infrastructure-agent",
  stage,
  status: "info",
  summary: "Investigate auth-service as the suspected root service.",
  evidenceIds: [],
  details: {},
  ...overrides,
});

describe("agent trace presentation", () => {
  it("keeps only the latest investigation run", () => {
    const traces = [trace("run-a", 1, "plan"), trace("run-a", 2, "report"), trace("run-b", 1, "plan")];
    expect(latestInvestigationTraces(traces).map(({ id }) => id)).toEqual(["run-b-trace-1"]);
  });

  it("builds a verified judge-facing summary", () => {
    const traces = [
      trace("run-a", 1, "plan"),
      trace("run-a", 2, "observation", {
        status: "success",
        evidenceIds: ["ev-1", "ev-2"],
        details: { evidence: [{ id: "ev-1", kind: "service_state", summary: "Authentication is failed." }, { id: "ev-2", kind: "dependency", summary: "Payments depends on Authentication." }] },
      }),
      trace("run-a", 3, "verification", {
        status: "success",
        evidenceIds: ["ev-1", "ev-2"],
        details: { finalConfidence: 0.98, checks: [{ check: "service_degradation", passed: true }] },
      }),
    ];
    expect(summarizeInvestigation(traces)).toMatchObject({
      status: "verified",
      evidenceCount: 2,
      confidencePercent: 98,
      checks: [{ check: "service_degradation", passed: true }],
      evidence: [{ id: "ev-1", kind: "service_state", summary: "Authentication is failed." }, { id: "ev-2", kind: "dependency", summary: "Payments depends on Authentication." }],
    });
  });
});
