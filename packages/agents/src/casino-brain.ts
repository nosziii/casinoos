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
Return only one JSON object with every field in this exact shape:
{
  "incidentId": "stable synthetic incident identifier",
  "incidentDetected": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "title": "non-empty string",
  "summary": "non-empty evidence-based string",
  "rootCause": { "service": "non-empty string", "confidence": number from 0 to 1 },
  "affectedSystems": ["service name"],
  "recommendedActions": ["at least one synthetic or monitoring action"],
  "operationalImpact": {
    "affectedPlayers": non-negative integer,
    "estimatedBlockedValue": non-negative number,
    "riskLevel": "low" | "medium" | "high" | "critical"
  }
}
Copy validated impact values from the specialist reports. If no incident is detected, use service "unknown"
with confidence 0, empty affectedSystems, and a monitoring recommendation. Recommendations are simulations
only and must never claim that a real infrastructure action was performed.`;

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
