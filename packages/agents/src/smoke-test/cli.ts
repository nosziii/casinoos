import { BasetenClient } from "../clients/baseten-client.js";
import { MockAIClient } from "../clients/mock-client.js";
import type { AIClient } from "../clients/ai-client.js";
import { infrastructureSmokeFixtures } from "./fixtures.js";
import { runInfrastructureSmokeSuite } from "./runner.js";

type Provider = "mock" | "baseten";

interface ProviderConfig {
  client: AIClient;
  provider: Provider;
  model: string;
}

async function main(): Promise<void> {
  const config = createProviderConfig(process.env);
  const result = await runInfrastructureSmokeSuite({
    ...config,
    fixtures: infrastructureSmokeFixtures,
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.passed) process.exitCode = 1;
}

function createProviderConfig(environment: NodeJS.ProcessEnv): ProviderConfig {
  const provider = readProvider(environment.AI_TEST_PROVIDER);
  if (provider === "mock") {
    return { client: new MockAIClient(), provider, model: "deterministic-mock" };
  }

  const apiKey = requireValue(environment.BASETEN_API_KEY, "BASETEN_API_KEY");
  const baseURL = environment.BASETEN_BASE_URL?.trim() || "https://inference.baseten.co/v1";
  const model = environment.BASETEN_MODEL?.trim() || "meta-models/muse-spark-open-1026";
  return { client: new BasetenClient({ apiKey, baseURL, model }), provider, model };
}

function readProvider(value: string | undefined): Provider {
  const provider = value?.trim().toLowerCase() || "mock";
  if (provider === "mock" || provider === "baseten") return provider;
  throw new Error(`Unsupported AI_TEST_PROVIDER: ${provider}`);
}

function requireValue(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`${name} is required for the selected smoke-test provider`);
  return value.trim();
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown smoke-test failure";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
