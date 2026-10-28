import type { MitigationComparison } from "@casino-ops/shared";
import { nextTick, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { useGuidedDemo } from "./use-guided-demo";

const flush = async () => {
  for (let index = 0; index < 6; index += 1) await Promise.resolve();
  await nextTick();
};

describe("useGuidedDemo", () => {
  it("automates analysis and pauses for explicit recovery approval", async () => {
    const verified = ref(false);
    const recoveryComplete = ref(false);
    const comparison = ref({ recommendedAction: "failover_service" } as MitigationComparison);
    const operations = {
      reset: vi.fn(async () => undefined),
      runScenario: vi.fn(async () => undefined),
      predict: vi.fn(async () => undefined),
      compareMitigations: vi.fn(async () => undefined),
      simulateMitigation: vi.fn(async () => undefined),
    };
    const demo = useGuidedDemo(operations, { verified, comparison, recoveryComplete });

    await demo.startGuided();
    expect(demo.stage.value).toBe("investigating");
    verified.value = true;
    await flush();

    expect(operations.predict).toHaveBeenCalledWith(30);
    expect(operations.compareMitigations).toHaveBeenCalledWith(30);
    expect(operations.simulateMitigation).not.toHaveBeenCalled();
    expect(demo.stage.value).toBe("awaiting_approval");

    await demo.approveRecovery();
    expect(operations.simulateMitigation).toHaveBeenCalledWith("failover_service");
    recoveryComplete.value = true;
    await nextTick();
    expect(demo.stage.value).toBe("completed");
  });
});
