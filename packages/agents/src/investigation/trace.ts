import { agentTraceEventSchema, type AgentTraceEvent, type AgentTraceStage } from "@casino-ops/shared";
import { randomUUID } from "node:crypto";
import { redactSensitiveValues } from "../tools/redaction.js";

export type AgentTraceHandler = (event: AgentTraceEvent) => void;

export class AgentTraceEmitter {
  readonly #runId = randomUUID();
  #sequence = 0;

  constructor(
    private readonly investigationId: string,
    private readonly now: () => string,
    private readonly handler?: AgentTraceHandler,
  ) {}

  emit(stage: AgentTraceStage, summary: string, status: AgentTraceEvent["status"] = "info", evidenceIds: string[] = [], details: Record<string, unknown> = {}): void {
    if (!this.handler) return;
    this.#sequence += 1;
    this.handler(agentTraceEventSchema.parse({
      id: `${this.investigationId}-${this.#runId}-trace-${this.#sequence}`,
      investigationId: this.investigationId,
      timestamp: this.now(),
      agent: "infrastructure-agent",
      stage,
      status,
      summary,
      evidenceIds,
      details: redactSensitiveValues(details),
    }));
  }
}
