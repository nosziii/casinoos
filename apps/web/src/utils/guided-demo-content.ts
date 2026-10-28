import type { GuidedDemoStage } from "../composables/use-guided-demo";

export interface GuidedDemoContent {
  title: string;
  description: string;
}

export const guidedDemoContent: Record<GuidedDemoStage, GuidedDemoContent> = {
  ready: { title: "Ready for a guided investigation", description: "CasinoOps will walk through a deterministic authentication cascade from healthy baseline to simulated recovery." },
  preparing: { title: "Preparing a healthy casino", description: "Clearing previous demo state and restoring all six services to their healthy baseline." },
  investigating: { title: "AI agents are investigating", description: "Watch failures propagate while the Infrastructure Agent collects evidence and verifies the shared root cause." },
  forecasting: { title: "Predicting 30-minute impact", description: "The verified incident is passed to the deterministic Digital Twin impact model." },
  comparing: { title: "Comparing recovery strategies", description: "CasinoOps ranks synthetic mitigation options by recovery, risk, time and operational impact." },
  awaiting_approval: { title: "Operator approval required", description: "The safest recovery is ready. No action runs until you explicitly approve a Digital Twin simulation." },
  recovering: { title: "Simulating recovery", description: "The selected strategy is running only inside the Digital Twin. No production system is connected." },
  completed: { title: "Incident recovered", description: "All guided demo stages are complete and the deterministic recovery result is visible below." },
  error: { title: "Guided demo paused", description: "The current step could not complete. Reset the demo and try again." },
};
