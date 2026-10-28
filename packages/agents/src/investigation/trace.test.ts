import { describe, expect, it } from "vitest";
import type { AgentTraceEvent } from "@casino-ops/shared";
import { AgentTraceEmitter } from "./trace.js";

describe("AgentTraceEmitter", () => {
  it("creates unique event IDs for repeated investigation runs", () => {
    const events: AgentTraceEvent[] = [];
    const capture = (event: AgentTraceEvent) => events.push(event);
    const now = () => "2026-10-28T12:00:00.000Z";

    new AgentTraceEmitter("inv-auth-service", now, capture).emit("plan", "First run");
    new AgentTraceEmitter("inv-auth-service", now, capture).emit("plan", "Second run");

    expect(events).toHaveLength(2);
    expect(events[0]?.id).not.toBe(events[1]?.id);
    expect(events.every((event) => event.investigationId === "inv-auth-service")).toBe(true);
  });
});
