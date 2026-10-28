import { infrastructureReportSchema, type CasinoEvent, type InfrastructureReport } from "@casino-os/shared";
import type { AIClient } from "./clients/ai-client.js";
import { completeWithRetry } from "./structured-completion.js";

const SYSTEM_PROMPT = `You are the CasinoOS Infrastructure Agent.
Analyze only the supplied synthetic operational events. Correlate dependency, latency and timeout failures.
Return a JSON object matching this exact shape: incidentDetected boolean, confidence number 0..1,
summary string, suspectedRootCauses array of {service, confidence}, affectedServices string array,
severity one of low, medium, high, critical. Do not invent events or actions.`;

export class InfrastructureAgent {
  readonly #client: AIClient;

  constructor(client: AIClient) {
    this.#client = client;
  }

  async analyze(events: CasinoEvent[]): Promise<InfrastructureReport> {
    if (events.length === 0) throw new Error("InfrastructureAgent requires at least one event");
    return completeWithRetry(this.#client, {
      agent: "infrastructure-agent",
      systemPrompt: SYSTEM_PROMPT,
      payload: { events },
      schema: infrastructureReportSchema,
    });
  }
}

