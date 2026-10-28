import { BasetenClient } from "../clients/baseten-client.js";
import { InfrastructureInvestigationLoop } from "../investigation/loop.js";
import { createReadOnlyAgentTools } from "../tools/read-only-tools.js";
import { infrastructureSmokeFixtures } from "./fixtures.js";

async function main(): Promise<void> {
  const apiKey = required(process.env.BASETEN_API_KEY, "BASETEN_API_KEY");
  const model = required(process.env.BASETEN_MODEL, "BASETEN_MODEL");
  const events = infrastructureSmokeFixtures[0]!.events;
  const services = [
    { id: "auth-service", status: "degraded" as const, latencyMs: 4200, errorRate: 0.35, dependencies: [] },
    { id: "payment-service", status: "failed" as const, latencyMs: 3500, errorRate: 0.4, dependencies: ["auth-service"] },
    { id: "kyc-service", status: "degraded" as const, latencyMs: 2400, errorRate: 0.2, dependencies: ["auth-service"] },
    { id: "cashier-service", status: "degraded" as const, latencyMs: 2100, errorRate: 0.18, dependencies: ["auth-service", "payment-service"] },
  ];
  const tools = createReadOnlyAgentTools({ getServices: () => structuredClone(services), getEvents: () => structuredClone(events) });
  const result = await new InfrastructureInvestigationLoop(
    new BasetenClient({ apiKey, model, baseURL: process.env.BASETEN_BASE_URL?.trim() || "https://inference.baseten.co/v1" }),
    tools,
    { maxTurns: 4, maxToolCalls: 6, maxDurationMs: 25_000 },
  ).investigate(events);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.verification?.status !== "verified") process.exitCode = 1;
}

function required(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`${name} is required for the live investigation smoke test`);
  return value.trim();
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown investigation smoke-test failure"}\n`);
  process.exitCode = 1;
});
