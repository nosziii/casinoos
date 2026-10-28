import type { MitigationAction, MitigationComparison } from "@casino-ops/shared";
import { ref, watch, type Ref } from "vue";

export type DemoMode = "landing" | "guided" | "explore";
export type GuidedDemoStage = "ready" | "preparing" | "investigating" | "forecasting" | "comparing" | "awaiting_approval" | "recovering" | "completed" | "error";

interface GuidedDemoOperations {
  reset: () => Promise<void>;
  runScenario: () => Promise<void>;
  predict: (minutes: number) => Promise<void>;
  compareMitigations: (minutes: number) => Promise<void>;
  simulateMitigation: (action: MitigationAction) => Promise<void>;
}

interface GuidedDemoSignals {
  verified: Ref<boolean>;
  comparison: Ref<MitigationComparison | undefined>;
  recoveryComplete: Ref<boolean>;
}

export function useGuidedDemo(operations: GuidedDemoOperations, signals: GuidedDemoSignals) {
  const mode = ref<DemoMode>("landing");
  const stage = ref<GuidedDemoStage>("ready");
  const busy = ref(false);
  const error = ref("");

  async function startGuided(): Promise<void> {
    mode.value = "guided";
    stage.value = "preparing";
    await execute(async () => {
      await operations.reset();
      await operations.runScenario();
      stage.value = "investigating";
    });
  }

  function enterExplore(): void {
    mode.value = "explore";
    stage.value = "ready";
    error.value = "";
  }

  async function returnToLanding(): Promise<void> {
    await execute(async () => {
      await operations.reset();
      mode.value = "landing";
      stage.value = "ready";
    });
  }

  async function approveRecovery(): Promise<void> {
    if (mode.value !== "guided" || stage.value !== "awaiting_approval") return;
    const action = signals.comparison.value?.recommendedAction;
    if (!action) return fail("No verified mitigation recommendation is available.");
    stage.value = "recovering";
    await execute(() => operations.simulateMitigation(action));
  }

  async function advanceAfterVerification(): Promise<void> {
    if (mode.value !== "guided" || stage.value !== "investigating" || !signals.verified.value) return;
    stage.value = "forecasting";
    await execute(async () => {
      await operations.predict(30);
      stage.value = "comparing";
      await operations.compareMitigations(30);
      stage.value = "awaiting_approval";
    });
  }

  async function execute(operation: () => Promise<void>): Promise<void> {
    if (busy.value) return;
    busy.value = true;
    error.value = "";
    try {
      await operation();
    } catch (cause) {
      fail(cause instanceof Error ? cause.message : "Guided demo action failed.");
    } finally {
      busy.value = false;
    }
  }

  function fail(message: string): void {
    error.value = message;
    stage.value = "error";
  }

  watch([signals.verified, busy], ([verified, isBusy]) => {
    if (verified && !isBusy) void advanceAfterVerification();
  });
  watch(signals.recoveryComplete, (complete) => {
    if (complete && mode.value === "guided" && stage.value === "recovering") stage.value = "completed";
  });

  return { mode, stage, busy, error, startGuided, enterExplore, returnToLanding, approveRecovery };
}
