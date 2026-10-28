import type { CasinoBrainInput } from "../casino-brain.js";
import type { CasinoIncident } from "@casino-os/shared";

export interface BrainSmokeExpectation {
  incidentDetected: boolean;
  rootCause?: string;
  forbiddenRootCause?: string;
}

export interface BrainSmokeFixture {
  id: string;
  description: string;
  input: CasinoBrainInput;
  expected: BrainSmokeExpectation;
}

export interface BrainSmokeCaseResult {
  fixtureId: string;
  passed: boolean;
  durationMs: number;
  checks: string[];
  failures: string[];
  incident?: CasinoIncident;
  error?: string;
}

export interface BrainSmokeSuiteResult {
  provider: string;
  model: string;
  startedAt: string;
  durationMs: number;
  passed: boolean;
  cases: BrainSmokeCaseResult[];
}
