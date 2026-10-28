import { casinoIncidentSchema, type CasinoIncident, type InfrastructureReport, type OperationsReport, type RiskReport, type ServiceState } from "@casino-os/shared";
import type { AIClient } from "./clients/ai-client.js";
import { completeWithRetry } from "./structured-completion.js";

export interface CasinoBrainInput {
  infrastructureReport: InfrastructureReport;
  operationsReport: OperationsReport;
  riskReport: RiskReport;
  digitalTwinState: { phase: number; services: ServiceState[] };
}

const SYSTEM_PROMPT = `You are Casino Brain, the central reasoning layer of a synthetic casino digital twin.
Correlate the three validated specialist reports with deterministic digital-twin state. Do not invent facts.
Return strict JSON matching the requested incident schema. Recommendations are simulations only and must
never claim that a real infrastructure action was performed.`;

export class CasinoBrain {
  constructor(private readonly client: AIClient) {}

  analyze(input: CasinoBrainInput): Promise<CasinoIncident> {
    return completeWithRetry(this.client, {
      agent: "casino-brain",
      systemPrompt: SYSTEM_PROMPT,
      payload: input,
      schema: casinoIncidentSchema,
    });
  }
}

