import { describe, expect, it } from "vitest";
import { compareMitigations } from "./mitigation-engine.js";
import { predictOutage } from "./prediction-engine.js";

describe("digital twin analysis engines", () => {
  it("reproduces the deterministic 30-minute forecast", () => {
    expect(predictOutage(30)).toMatchObject({
      affectedPlayers: 214,
      failedDeposits: 73,
      queuedWithdrawals: 31,
      estimatedBlockedValue: 18420,
      kycQueueCriticalInMinutes: 14,
    });
  });

  it("ranks failover above more disruptive strategies", () => {
    const comparison = compareMitigations(30);
    expect(comparison.recommendedAction).toBe("failover_service");
    expect(comparison.strategies[0]).toMatchObject({ estimatedRecovery: 0.91, risk: "low", recommended: true });
  });

  it("rejects excessive prediction horizons", () => {
    expect(() => predictOutage(121)).toThrow(/between 1 and 120/);
  });
});
