export interface JudgeTourStep {
  target: string;
  title: string;
  description: string;
  requiresIncident?: boolean;
  action?: "approve";
}

export const judgeTourSteps: JudgeTourStep[] = [
  {
    target: "[data-tour='ai-status']",
    title: "Know which AI mode is active",
    description: "LIVE AI means the configured model providers are answering. If a provider fails, CasinoOps visibly switches to AI FALLBACK instead of silently presenting deterministic output as live AI.",
  },
  {
    target: "[data-tour='guided-status']",
    title: "The incident runs automatically",
    description: "CasinoOps starts from a healthy baseline, triggers the authentication cascade and waits for a verified investigation. Follow the highlighted panels as the story develops.",
  },
  {
    target: "[data-tour='demo-progress']",
    title: "Follow the complete incident story",
    description: "This journey bar shows the seven operational stages from the healthy baseline through verified investigation, impact forecasting, operator approval and simulated recovery.",
  },
  {
    target: "[data-tour='system-health']",
    title: "Watch service health change",
    description: "Six critical casino services expose latency, errors and health. The authentication failure propagates only to systems that depend on it.",
  },
  {
    target: "[data-tour='casino-brain']",
    title: "Casino Brain verifies the root cause",
    description: "This is the operational conclusion: confidence, affected systems and independent evidence are shown together instead of relying on an unsupported model answer.",
    requiresIncident: true,
  },
  {
    target: "[data-tour='dependencies']",
    title: "See the failure propagate",
    description: "The dependency map explains why one authentication failure affects payments, KYC, cashier and player registration while independent customer support remains available.",
    requiresIncident: true,
  },
  {
    target: "[data-tour='investigation']",
    title: "Evidence, not a black box",
    description: "The hypothesis is checked against service degradation, dependencies, event order and evidence minimums. The technical trace remains available for deeper inspection.",
    requiresIncident: true,
  },
  {
    target: "[data-tour='impact']",
    title: "See what happens next",
    description: "The deterministic Digital Twin predicts operational impact and compares recovery strategies without changing any production system.",
    requiresIncident: true,
  },
  {
    target: "[data-tour='approval']",
    title: "Your approval is required",
    description: "CasinoOps recommends a strategy, but it cannot execute recovery by itself. Select the highlighted approval button to continue the simulation.",
    requiresIncident: true,
    action: "approve",
  },
  {
    target: "[data-tour='recovery']",
    title: "Recovery stays inside the twin",
    description: "The selected strategy is simulated safely and the six operational systems return to a healthy state. No production action has been performed.",
  },
];
