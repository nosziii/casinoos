import { CasinoBrain } from "../casino-brain.js";
import type { AIClient } from "../clients/ai-client.js";
import type { BrainSmokeCaseResult, BrainSmokeFixture, BrainSmokeSuiteResult } from "./brain-types.js";

export interface RunBrainSmokeSuiteOptions {
  client: AIClient;
  provider: string;
  model: string;
  fixtures: BrainSmokeFixture[];
}

export async function runBrainSmokeSuite(options: RunBrainSmokeSuiteOptions): Promise<BrainSmokeSuiteResult> {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const brain = new CasinoBrain(options.client);
  const cases: BrainSmokeCaseResult[] = [];

  for (const fixture of options.fixtures) cases.push(await runCase(brain, fixture));

  return {
    provider: options.provider,
    model: options.model,
    startedAt,
    durationMs: Math.round(performance.now() - started),
    passed: cases.every(({ passed }) => passed),
    cases,
  };
}

async function runCase(brain: CasinoBrain, fixture: BrainSmokeFixture): Promise<BrainSmokeCaseResult> {
  const started = performance.now();
  try {
    const incident = await brain.analyze(fixture.input);
    const checks: string[] = [];
    const failures: string[] = [];
    check(incident.incidentDetected === fixture.expected.incidentDetected, `incidentDetected is ${fixture.expected.incidentDetected}`, checks, failures);
    if (fixture.expected.rootCause) {
      check(incident.rootCause.service.toLowerCase() === fixture.expected.rootCause, `root cause is ${fixture.expected.rootCause}`, checks, failures);
    }
    if (fixture.expected.forbiddenRootCause) {
      check(incident.rootCause.service.toLowerCase() !== fixture.expected.forbiddenRootCause, `root cause excludes ${fixture.expected.forbiddenRootCause}`, checks, failures);
    }
    return { fixtureId: fixture.id, passed: failures.length === 0, durationMs: Math.round(performance.now() - started), checks, failures, incident };
  } catch (error) {
    return {
      fixtureId: fixture.id,
      passed: false,
      durationMs: Math.round(performance.now() - started),
      checks: [],
      failures: ["Casino Brain execution completed without an exception"],
      error: error instanceof Error ? error.message : "Unknown smoke-test error",
    };
  }
}

function check(condition: boolean, description: string, checks: string[], failures: string[]): void {
  (condition ? checks : failures).push(description);
}
