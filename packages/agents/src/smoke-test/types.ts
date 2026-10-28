import type { CasinoEvent, InfrastructureReport } from "@casino-os/shared";

export interface InfrastructureSmokeExpectation {
  incidentDetected: boolean;
  rootCause?: string;
  forbiddenRootCause?: string;
}

export interface InfrastructureSmokeFixture {
  id: string;
  description: string;
  events: CasinoEvent[];
  expected: InfrastructureSmokeExpectation;
}

export interface SmokeCaseResult {
  fixtureId: string;
  passed: boolean;
  durationMs: number;
  checks: string[];
  failures: string[];
  report?: InfrastructureReport;
  error?: string;
}

export interface SmokeSuiteResult {
  provider: string;
  model: string;
  startedAt: string;
  durationMs: number;
  passed: boolean;
  cases: SmokeCaseResult[];
}
