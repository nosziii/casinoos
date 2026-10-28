import { riskReportSchema, type CasinoEvent, type RiskReport } from "@casino-os/shared";
import type { AIClient } from "./clients/ai-client.js";
import { completeWithRetry } from "./structured-completion.js";

const SYSTEM_PROMPT = `You are the CasinoOS Risk Agent. Analyze only the supplied synthetic events.
Assess financial exposure, compliance impact, critical dependencies and escalation need.
Return strict JSON with riskLevel, financialExposure, criticalSystems, recommendedEscalation and summary.`;

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

