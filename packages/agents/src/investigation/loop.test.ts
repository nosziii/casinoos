import type { AgentTraceEvent } from "@casino-ops/shared";
import type { CompletionRequest, AIClient } from "../clients/ai-client.js";
import { describe, expect, it } from "vitest";
import { MockAIClient } from "../clients/mock-client.js";
import { infrastructureSmokeFixtures } from "../smoke-test/fixtures.js";
import { createReadOnlyAgentTools } from "../tools/read-only-tools.js";
import { InfrastructureInvestigationLoop } from "./loop.js";

const authEvents = infrastructureSmokeFixtures[0]!.events;
const services = [
  { id: "auth-service", status: "degraded" as const, latencyMs: 4200, errorRate: 0.35, dependencies: [] },
  { id: "payment-service", status: "failed" as const, latencyMs: 3500, errorRate: 0.4, dependencies: ["auth-service"] },
  { id: "kyc-service", status: "degraded" as const, latencyMs: 2400, errorRate: 0.2, dependencies: ["auth-service"] },
  { id: "cashier-service", status: "degraded" as const, latencyMs: 2100, errorRate: 0.18, dependencies: ["auth-service", "payment-service"] },
];
const fixedNow = () => "2026-10-28T10:01:00.000Z";

describe("InfrastructureInvestigationLoop", () => {
  it("runs plan, tool observation, verification and report with the mock protocol", async () => {
    const tools = createReadOnlyAgentTools({ getServices: () => structuredClone(services), getEvents: () => structuredClone(authEvents) });
    const traces: AgentTraceEvent[] = [];
    const result = await new InfrastructureInvestigationLoop(new MockAIClient(), tools, { now: fixedNow, onTrace: (trace) => traces.push(trace) }).investigate(authEvents);

    expect(result.termination).toBe("finished");
    expect(result.verification?.status).toBe("verified");
    expect(result.context?.toolCalls).toHaveLength(3);
    expect(result.context?.turn).toBe(4);
    expect(result.report.confidence).toBe(result.verification?.finalConfidence);
    expect(traces.map(({ stage }) => stage)).toEqual([
      "plan", "tool_call", "observation", "tool_call", "observation", "tool_call", "observation", "verification", "report",
    ]);
    expect(JSON.stringify(traces)).not.toContain("rationale");
  });

  it("returns no_incident without tool calls for a healthy baseline", async () => {
    const healthyEvents = infrastructureSmokeFixtures[2]!.events;
    const tools = createReadOnlyAgentTools({ getServices: () => [], getEvents: () => healthyEvents });
    const result = await new InfrastructureInvestigationLoop(new MockAIClient(), tools, { now: fixedNow }).investigate(healthyEvents);
    expect(result.termination).toBe("no_incident");
    expect(result.context).toBeNull();
  });

  it("returns insufficient evidence when read-only sources cannot support the claim", async () => {
    const tools = createReadOnlyAgentTools({ getServices: () => [], getEvents: () => [] });
    const result = await new InfrastructureInvestigationLoop(new MockAIClient(), tools, { now: fixedNow }).investigate(authEvents);
    expect(result.verification?.status).toBe("insufficient_evidence");
    expect(result.context?.status).toBe("insufficient_evidence");
  });

  it("enforces the maximum turn count", async () => {
    const tools = createReadOnlyAgentTools({ getServices: () => structuredClone(services), getEvents: () => structuredClone(authEvents) });
    const result = await new InfrastructureInvestigationLoop(new MockAIClient(), tools, { maxTurns: 1, now: fixedNow }).investigate(authEvents);
    expect(result.termination).toBe("turn_limit");
    expect(result.context?.turn).toBe(1);
  });

  it("enforces the maximum tool-call count", async () => {
    const tools = createReadOnlyAgentTools({ getServices: () => structuredClone(services), getEvents: () => structuredClone(authEvents) });
    const result = await new InfrastructureInvestigationLoop(new MockAIClient(), tools, { maxToolCalls: 1, now: fixedNow }).investigate(authEvents);
    expect(result.termination).toBe("tool_limit");
    expect(result.context?.toolCalls).toHaveLength(1);
  });

  it("aborts an AI request when the total duration expires", async () => {
    const tools = createReadOnlyAgentTools({ getServices: () => [], getEvents: () => [] });
    const result = await new InfrastructureInvestigationLoop(new AbortAwareClient(), tools, { maxDurationMs: 5 }).investigate(authEvents);
    expect(result.termination).toBe("timeout");
  });
});

class AbortAwareClient implements AIClient {
  complete<T>(request: CompletionRequest<T>): Promise<T> {
    return new Promise<T>((_resolve, reject) => {
      request.signal?.addEventListener("abort", () => reject(request.signal?.reason), { once: true });
    });
  }
}
