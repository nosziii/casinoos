import { riskReportSchema, type CasinoEvent, type RiskReport } from "@casino-ops/shared";
import type { AIClient } from "./clients/ai-client.js";
import { completeWithRetry } from "./structured-completion.js";

const SYSTEM_PROMPT = `You are the CasinoOps Risk Agent. Analyze only the supplied synthetic events.
Assess financial exposure, compliance impact, critical dependencies and escalation need.

Return only one JSON object. Do not use markdown, commentary, null values or additional fields.
The object must match this exact shape and these exact JSON types:
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "financialExposure": 0,
  "criticalSystems": ["service-id"],
  "recommendedEscalation": true,
  "summary": "Concise non-empty risk summary"
}

Rules:
- financialExposure must be a non-negative JSON number, never a currency string.
- criticalSystems must contain only exact source or dependency service IDs present in the events.
- recommendedEscalation must be a JSON boolean.
- Use blockedValueEur from event data when available; do not invent financial values.
- If no financial exposure is present, return 0.`;

export class RiskAgent {
  constructor(private readonly client: AIClient) {}

  analyze(events: CasinoEvent[]): Promise<RiskReport> {
    if (events.length === 0) throw new Error("RiskAgent requires at least one event");
    return completeWithRetry(this.client, {
      agent: "risk-agent",
      systemPrompt: SYSTEM_PROMPT,
      payload: { events },
      schema: riskReportSchema,
    });
  }
}
