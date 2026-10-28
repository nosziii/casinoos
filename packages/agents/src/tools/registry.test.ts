import type { CasinoEvent, ServiceState } from "@casino-os/shared";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createReadOnlyAgentTools } from "./read-only-tools.js";
import { AgentToolRegistry } from "./registry.js";
import { AgentToolError } from "./types.js";

const services: ServiceState[] = [
  { id: "auth-service", status: "degraded", latencyMs: 2800, errorRate: 0.31, dependencies: [] },
  { id: "payment-service", status: "failed", latencyMs: 4100, errorRate: 0.64, dependencies: ["auth-service"] },
  { id: "cashier-service", status: "degraded", latencyMs: 1900, errorRate: 0.22, dependencies: ["auth-service", "payment-service"] },
];
const events: CasinoEvent[] = [
  event("evt-1", "infrastructure", "auth-service", { apiKey: "must-not-leak" }),
  event("evt-2", "payment", "payment-service", { dependency: "auth-service" }),
];
const source = { getServices: () => structuredClone(services), getEvents: () => structuredClone(events) };

describe("read-only agent tool registry", () => {
  it("registers only the four allow-listed tools", () => {
    expect(createReadOnlyAgentTools(source).list().map(({ name }) => name)).toEqual([
      "getServiceState", "getDependencies", "getDependents", "getRecentEvents",
    ]);
  });

  it("resolves dependencies and dependents from current snapshots", async () => {
    const registry = createReadOnlyAgentTools(source);
    await expect(registry.execute("getDependencies", { serviceId: "cashier-service" })).resolves.toMatchObject({
      output: { services: [{ id: "auth-service" }, { id: "payment-service" }] },
    });
    await expect(registry.execute("getDependents", { serviceId: "auth-service" })).resolves.toMatchObject({
      output: { services: [{ id: "payment-service" }, { id: "cashier-service" }] },
    });
  });

  it("bounds, filters and redacts recent events", async () => {
    const result = await createReadOnlyAgentTools(source).execute("getRecentEvents", { limit: 1, domain: "infrastructure" });
    expect(result.output).toMatchObject({
      totalMatched: 1,
      truncated: false,
      events: [{ id: "evt-1", data: { apiKey: "[REDACTED]" } }],
    });
  });

  it("rejects unknown tools, extra arguments and oversized output", async () => {
    const registry = createReadOnlyAgentTools(source);
    await expect(registry.execute("deleteService", {})).rejects.toMatchObject({ code: "UNKNOWN_TOOL" });
    await expect(registry.execute("getServiceState", { serviceId: "auth-service", mutate: true })).rejects.toMatchObject({ code: "INVALID_TOOL_INPUT" });
    const limited = new AgentToolRegistry({ maxOutputBytes: 10 });
    limited.register({ name: "large", description: "test", inputSchema: z.object({}), outputSchema: z.object({ value: z.string() }), execute: () => ({ value: "too large" }) });
    await expect(limited.execute("large", {})).rejects.toBeInstanceOf(AgentToolError);
  });
});

function event(id: string, domain: CasinoEvent["domain"], source: string, data: Record<string, unknown>): CasinoEvent {
  return { id, timestamp: "2026-10-28T10:00:00.000Z", domain, source, type: "TEST_EVENT", severity: "error", data };
}
