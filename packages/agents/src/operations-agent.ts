import { operationsReportSchema, type CasinoEvent, type OperationsReport } from "@casino-ops/shared";
import type { AIClient } from "./clients/ai-client.js";
import { completeWithRetry } from "./structured-completion.js";

const SYSTEM_PROMPT = `You are the CasinoOps Operations Agent. Analyze only the supplied synthetic events.
Estimate player impact, failed transactions, blocked value, failed registrations and support load.
Return strict JSON with incidentDetected, affectedPlayers, failedTransactions, estimatedBlockedValue,
supportLoadIncrease and summary. Never invent infrastructure actions.`;

export class OperationsAgent {
  constructor(private readonly client: AIClient) {}

  analyze(events: CasinoEvent[]): Promise<OperationsReport> {
    if (events.length === 0) throw new Error("OperationsAgent requires at least one event");
    return completeWithRetry(this.client, {
      agent: "operations-agent",
      systemPrompt: SYSTEM_PROMPT,
      payload: { events },
      schema: operationsReportSchema,
    });
  }
}

