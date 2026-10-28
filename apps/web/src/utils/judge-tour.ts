export interface JudgeTourStep {
  target: string;
  title: string;
  description: string;
}

export const judgeTourSteps: JudgeTourStep[] = [
  {
    target: "[data-tour='guided-status']",
    title: "The incident runs automatically",
    description: "CasinoOps starts from a healthy baseline, triggers the authentication cascade and waits for a verified investigation. Follow the highlighted panels as the story develops.",
  },
  {
    target: "[data-tour='casino-brain']",
    title: "Casino Brain verifies the root cause",
    description: "This is the operational conclusion: confidence, affected systems and independent evidence are shown together instead of relying on an unsupported model answer.",
  },
  {
    target: "[data-tour='investigation']",
    title: "Evidence, not a black box",
    description: "The hypothesis is checked against service degradation, dependencies, event order and evidence minimums. The technical trace remains available for deeper inspection.",
  },
  {
    target: "[data-tour='impact']",
    title: "See what happens next",
    description: "The deterministic Digital Twin predicts operational impact and compares recovery strategies without changing any production system.",
  },
  {
    target: "[data-tour='approval']",
    title: "Your approval is required",
    description: "CasinoOps recommends a strategy, but it cannot execute recovery by itself. Select the highlighted approval button to continue the simulation.",
  },
  {
    target: "[data-tour='recovery']",
    title: "Recovery stays inside the twin",
    description: "The selected strategy is simulated safely and the six operational systems return to a healthy state. No production action has been performed.",
  },
];
