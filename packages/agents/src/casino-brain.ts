import {
  casinoIncidentSchema,
  type CasinoIncident,
  type InfrastructureReport,
  type InvestigationEvidence,
  type OperationsReport,
  type RiskReport,
  type ServiceState,
  type VerificationResult,
} from "@casino-ops/shared";
import type { AIClient } from "./clients/ai-client.js";
import { completeWithRetry } from "./structured-completion.js";

export interface CasinoBrainInput {
  infrastructureReport: InfrastructureReport;
  operationsReport: OperationsReport;
  riskReport: RiskReport;
  digitalTwinState: { phase: number; services: ServiceState[] };
  infrastructureInvestigation: {
    verification: VerificationResult | null;
    evidence: InvestigationEvidence[];
  };
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
only and must never claim that a real infrastructure action was performed. Treat a root cause as confirmed only
when infrastructureInvestigation.verification.status is "verified". Never exceed its finalConfidence and cite only
facts present in the supplied evidence and specialist reports.`;

export class CasinoBrain {
  constructor(private readonly client: AIClient) {}

  async analyze(input: CasinoBrainInput): Promise<CasinoIncident> {
    const incident = await completeWithRetry(this.client, {
      agent: "casino-brain",
      systemPrompt: SYSTEM_PROMPT,
      payload: input,
      schema: casinoIncidentSchema,
    });
    const verification = input.infrastructureInvestigation.verification;
    if (verification?.status !== "verified") {
      return casinoIncidentSchema.parse({
        ...incident,
        incidentDetected: false,
        severity: "low",
        title: "No verified incident",
        rootCause: { service: "unknown", confidence: 0 },
        affectedSystems: [],
        recommendedActions: ["Continue synthetic monitoring and evidence collection"],
      });
    }
    const verifiedRoot = input.infrastructureReport.suspectedRootCauses[0]?.service;
    if (!verifiedRoot || incident.rootCause.service !== verifiedRoot) {
      throw new Error("Casino Brain root cause conflicts with verified infrastructure evidence");
    }
    return casinoIncidentSchema.parse({
      ...incident,
      rootCause: { ...incident.rootCause, confidence: Math.min(incident.rootCause.confidence, verification.finalConfidence) },
    });
  }
}
