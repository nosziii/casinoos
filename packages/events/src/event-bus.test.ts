import { describe, expect, it, vi } from "vitest";
import { EventBus } from "./event-bus.js";

describe("EventBus", () => {
  it("delivers an event to domain and global subscribers", async () => {
    const bus = new EventBus();
    const domainHandler = vi.fn();
    const allHandler = vi.fn();
    bus.subscribe("infrastructure", domainHandler);
    bus.subscribeAll(allHandler);

    const event = {
      id: "evt-1",
      timestamp: "2026-10-27T10:31:02.000Z",
      domain: "infrastructure" as const,
      source: "auth-service",
      type: "AUTH_LATENCY_HIGH",
      severity: "warning" as const,
      data: { latencyMs: 800 },
    };
    await bus.publish(event);

    expect(domainHandler).toHaveBeenCalledWith(event);
    expect(allHandler).toHaveBeenCalledWith(event);
  });
});

