import { describe, expect, it } from "vitest";
import { buildDemoJourney, type DemoJourneySignals } from "./demo-journey";

const signals = (overrides: Partial<DemoJourneySignals> = {}): DemoJourneySignals => ({
  scenarioStarted: false,
  investigationStarted: false,
  rootCauseVerified: false,
  forecastReady: false,
  mitigationsReady: false,
  recoveryComplete: false,
  ...overrides,
});

describe("demo journey", () => {
  it("starts at the healthy baseline", () => {
    expect(buildDemoJourney(signals()).findIndex(({ complete }) => !complete)).toBe(0);
  });

  it("marks the full deterministic journey complete", () => {
    expect(buildDemoJourney(signals({ scenarioStarted: true, investigationStarted: true, rootCauseVerified: true, forecastReady: true, mitigationsReady: true, recoveryComplete: true })).every(({ complete }) => complete)).toBe(true);
  });
});
