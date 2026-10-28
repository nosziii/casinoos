import { MetaClient } from "../clients/meta-client.js";
import { brainSmokeFixtures } from "./brain-fixtures.js";
import { runBrainSmokeSuite } from "./brain-runner.js";

async function main(): Promise<void> {
  const apiKey = requireValue(process.env.META_MODEL_API_KEY, "META_MODEL_API_KEY");
  const model = requireValue(process.env.META_MODEL, "META_MODEL");
  const baseURL = process.env.META_BASE_URL?.trim() || "https://api.meta.ai/v1";
  const result = await runBrainSmokeSuite({
    client: new MetaClient({ apiKey, baseURL, model }),
    provider: "meta",
    model,
    fixtures: brainSmokeFixtures,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.passed) process.exitCode = 1;
}

function requireValue(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`${name} is required for the Meta smoke test`);
  return value.trim();
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown Meta smoke-test failure"}\n`);
  process.exitCode = 1;
});
