export interface DemoJourneySignals {
  scenarioStarted: boolean;
  investigationStarted: boolean;
  rootCauseVerified: boolean;
  forecastReady: boolean;
  mitigationsReady: boolean;
  recoveryComplete: boolean;
}

export interface DemoJourneyStep {
  label: string;
  complete: boolean;
}

export function buildDemoJourney(signals: DemoJourneySignals): DemoJourneyStep[] {
  return [
    { label: "Healthy baseline", complete: signals.scenarioStarted },
    { label: "Incident triggered", complete: signals.scenarioStarted },
    { label: "Incident investigation", complete: signals.investigationStarted },
    { label: "Root cause verified", complete: signals.rootCauseVerified },
    { label: "Impact forecast", complete: signals.forecastReady },
    { label: "Mitigations compared", complete: signals.mitigationsReady },
    { label: "Recovery simulated", complete: signals.recoveryComplete },
  ];
}
