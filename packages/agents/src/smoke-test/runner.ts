import type { AIClient } from "../clients/ai-client.js";
import { InfrastructureAgent } from "../infrastructure-agent.js";
import type {
  InfrastructureSmokeExpectation,
  InfrastructureSmokeFixture,
  SmokeCaseResult,
  SmokeSuiteResult,
} from "./types.js";

export interface RunSmokeSuiteOptions {
  client: AIClient;
  provider: string;
  model: string;
  fixtures: InfrastructureSmokeFixture[];
}

export async function runInfrastructureSmokeSuite(options: RunSmokeSuiteOptions): Promise<SmokeSuiteResult> {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const agent = new InfrastructureAgent(options.client);
  const cases: SmokeCaseResult[] = [];

  for (const fixture of options.fixtures) {
    cases.push(await runCase(agent, fixture));
  }

  return {
    provider: options.provider,
    model: options.model,
    startedAt,
    durationMs: Math.round(performance.now() - started),
    passed: cases.every((result) => result.passed),
    cases,
  };
}

async function runCase(agent: InfrastructureAgent, fixture: InfrastructureSmokeFixture): Promise<SmokeCaseResult> {
  const started = performance.now();
  try {
    const report = await agent.analyze(fixture.events);
    const { checks, failures } = verifyReport(report, fixture.expected);
    return {
      fixtureId: fixture.id,
      passed: failures.length === 0,
      durationMs: Math.round(performance.now() - started),
      checks,
      failures,
      report,
    };
  } catch (error) {
    return {
      fixtureId: fixture.id,
      passed: false,
      durationMs: Math.round(performance.now() - started),
      checks: [],
      failures: ["Agent execution completed without an exception"],
      error: error instanceof Error ? error.message : "Unknown smoke-test error",
    };
  }
}

function verifyReport(
  report: Awaited<ReturnType<InfrastructureAgent["analyze"]>>,
  expected: InfrastructureSmokeExpectation,
): Pick<SmokeCaseResult, "checks" | "failures"> {
  const checks: string[] = [];
  const failures: string[] = [];
  check(
    report.incidentDetected === expected.incidentDetected,
    `incidentDetected is ${expected.incidentDetected}`,
    checks,
    failures,
  );

  const rootCauses = report.suspectedRootCauses.map(({ service }) => service.toLowerCase());
  if (expected.rootCause) {
    check(rootCauses.includes(expected.rootCause.toLowerCase()), `root cause contains ${expected.rootCause}`, checks, failures);
  }
  if (expected.forbiddenRootCause) {
    check(!rootCauses.includes(expected.forbiddenRootCause.toLowerCase()), `root cause excludes ${expected.forbiddenRootCause}`, checks, failures);
  }
  return { checks, failures };
}

function check(condition: boolean, description: string, checks: string[], failures: string[]): void {
  (condition ? checks : failures).push(description);
}
