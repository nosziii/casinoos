import type { CasinoIncident } from "@casino-os/shared";
import { compareMitigations, predictOutage } from "@casino-os/simulator";
import { CasinoBrainQueryService } from "../casino-brain-query.js";
import { MetaClient } from "../clients/meta-client.js";
import { createDecisionSupportTools } from "../tools/decision-support-tools.js";

const incident: CasinoIncident = {
  incidentId: "INC-LIVE-QUERY",
  incidentDetected: true,
  severity: "critical",
  title: "Verified authentication cascade",
  summary: "Synthetic verified incident for live query validation.",
  rootCause: { service: "auth-service", confidence: 0.98 },
  affectedSystems: ["payment-service", "kyc-service", "cashier-service"],
  recommendedActions: ["Compare synthetic mitigations"],
  operationalImpact: { affectedPlayers: 125, estimatedBlockedValue: 6300, riskLevel: "critical" },
};

async function main(): Promise<void> {
  const service = new CasinoBrainQueryService(
    new MetaClient({
      apiKey: required(process.env.META_MODEL_API_KEY, "META_MODEL_API_KEY"),
      baseURL: process.env.META_BASE_URL?.trim() || "https://api.meta.ai/v1",
      model: required(process.env.META_MODEL, "META_MODEL"),
    }),
    createDecisionSupportTools({ predictOutage, compareMitigations }),
  );
  const prediction = await service.query("What happens if the outage continues for 45 minutes?", incident);
  const mitigation = await service.query("Compare mitigation strategies for the next 30 minutes", incident);
  const summary = { prediction: { toolName: prediction.toolName, durationMinutes: prediction.durationMinutes }, mitigation: { toolName: mitigation.toolName, durationMinutes: mitigation.durationMinutes, requiresOperatorApproval: mitigation.requiresOperatorApproval } };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (prediction.toolName !== "predictOutage" || mitigation.toolName !== "compareMitigations") process.exitCode = 1;
}

function required(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`${name} is required for the live query smoke test`);
  return value.trim();
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown query smoke-test failure"}\n`);
  process.exitCode = 1;
});
