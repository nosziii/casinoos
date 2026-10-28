import { EventBus } from "@casino-ops/events";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CasinoSimulator } from "./casino-simulator.js";

describe("CasinoSimulator", () => {
  afterEach(() => vi.useRealTimers());

  it("deterministically produces the first milestone cascade", async () => {
    const simulator = new CasinoSimulator(new EventBus());
    await simulator.advance();
    await simulator.advance();
    const types = simulator.getEvents().map((event) => event.type);

    expect(types).toEqual([
      "AUTH_LATENCY_HIGH",
      "AUTH_LATENCY_CRITICAL",
      "PAYMENT_AUTH_TIMEOUT",
      "KYC_TOKEN_VALIDATION_FAILED",
      "CASHIER_AUTH_TIMEOUT",
      "REGISTRATION_AUTH_FAILED",
    ]);
    expect(simulator.getState().services.find((service) => service.id === "auth-service")?.status).toBe("failed");
  });

  it("simulates failover recovery without performing external actions", async () => {
    vi.useFakeTimers();
    const simulator = new CasinoSimulator(new EventBus());
    await simulator.advance();
    await simulator.advance();
    await simulator.advance();

    await simulator.simulateMitigation("failover_service", 100);
    expect(simulator.getState()).toMatchObject({ scenarioStatus: "recovering", mitigation: { progress: 0 } });
    await vi.advanceTimersByTimeAsync(250);

    const state = simulator.getState();
    expect(state).toMatchObject({
      running: false,
      scenarioStatus: "recovered",
      mitigation: { status: "completed", outcome: "recovered", progress: 1 },
    });
    expect(state.services.every((service) => service.status === "healthy")).toBe(true);
    expect(simulator.getEvents().at(-1)?.type).toBe("AUTH_FAILOVER_COMPLETED");
  });
});
