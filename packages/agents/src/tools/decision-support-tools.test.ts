import { compareMitigations, predictOutage } from "@casino-ops/simulator";
import { describe, expect, it } from "vitest";
import { createDecisionSupportTools } from "./decision-support-tools.js";

describe("Casino Brain decision-support tools", () => {
  const registry = createDecisionSupportTools({ predictOutage, compareMitigations });

  it("exposes only deterministic read-only decision tools", () => {
    expect(registry.list().map(({ name }) => name)).toEqual(["predictOutage", "compareMitigations"]);
  });

  it("returns validated deterministic prediction and mitigation output", async () => {
    await expect(registry.execute("predictOutage", { durationMinutes: 30 })).resolves.toMatchObject({
      output: { durationMinutes: 30, affectedPlayers: 214 },
    });
    await expect(registry.execute("compareMitigations", { durationMinutes: 30 })).resolves.toMatchObject({
      output: { recommendedAction: "failover_service" },
    });
  });

  it("cannot execute mitigation or accept an unsafe horizon", async () => {
    await expect(registry.execute("simulateMitigation", { action: "failover_service" })).rejects.toMatchObject({ code: "UNKNOWN_TOOL" });
    await expect(registry.execute("predictOutage", { durationMinutes: 121 })).rejects.toMatchObject({ code: "INVALID_TOOL_INPUT" });
  });
});
