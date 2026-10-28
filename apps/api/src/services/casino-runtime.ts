import {
  CasinoBrain,
  CasinoBrainQueryService,
  createDecisionSupportTools,
  createReadOnlyAgentTools,
  InfrastructureInvestigationLoop,
  OperationsAgent,
  RiskAgent,
  type AgentToolRegistry,
} from "@casino-ops/agents";
import { EventBuffer, EventBus } from "@casino-ops/events";
import type { AgentAnalysis, AgentTraceEvent, CasinoEvent, CasinoIncident } from "@casino-ops/shared";
import { CasinoSimulator, compareMitigations, predictOutage } from "@casino-ops/simulator";
import type { AppConfig } from "../config/env.js";
import { createAgentClients } from "./ai-clients.js";

export interface RuntimeHooks {
  onEvent?: (event: CasinoEvent) => void;
  onAgentAnalysis?: (analysis: AgentAnalysis) => void;
  onIncident?: (incident: CasinoIncident) => void;
  onAgentTrace?: (trace: AgentTraceEvent) => void;
}

export class CasinoRuntime {
  readonly eventBus = new EventBus();
  readonly simulator = new CasinoSimulator(this.eventBus);
  readonly agentReports: AgentAnalysis[] = [];
  readonly incidents: CasinoIncident[] = [];
  readonly agentTraces: AgentTraceEvent[] = [];
  readonly agentTools: AgentToolRegistry;
  readonly decisionTools: AgentToolRegistry;
  readonly #buffer: EventBuffer;
  readonly #infrastructureInvestigator: InfrastructureInvestigationLoop;
  readonly #operationsAgent: OperationsAgent;
  readonly #riskAgent: RiskAgent;
  readonly #brain: CasinoBrain;
  readonly #brainQuery: CasinoBrainQueryService;
  #lastBrainCall = 0;

  constructor(config: AppConfig, hooks: RuntimeHooks = {}) {
    this.agentTools = createReadOnlyAgentTools({
      getServices: () => this.simulator.getState().services,
      getEvents: () => this.simulator.getEvents(),
    });
    this.decisionTools = createDecisionSupportTools({ predictOutage, compareMitigations });
    const clients = createAgentClients(config);
    this.#infrastructureInvestigator = new InfrastructureInvestigationLoop(clients.specialist, this.agentTools, {
      maxTurns: config.MAX_INVESTIGATION_TURNS,
      maxToolCalls: config.MAX_INVESTIGATION_TOOL_CALLS,
      maxDurationMs: config.INVESTIGATION_TIMEOUT_MS,
      onTrace: (trace) => {
        appendBounded(this.agentTraces, trace, 500);
        hooks.onAgentTrace?.(trace);
      },
    });
    this.#operationsAgent = new OperationsAgent(clients.specialist);
    this.#riskAgent = new RiskAgent(clients.specialist);
    this.#brain = new CasinoBrain(clients.brain);
    this.#brainQuery = new CasinoBrainQueryService(clients.brain, this.decisionTools);
    this.#buffer = new EventBuffer({
      maxSize: config.MAX_EVENT_BATCH_SIZE,
      flushIntervalMs: config.AGENT_FLUSH_INTERVAL_MS,
      onFlush: async (events) => this.#analyzeBatch(events, config, hooks),
    });
    this.eventBus.subscribeAll(async (event) => {
      hooks.onEvent?.(event);
      if (event.data.simulationKind === "mitigation") return;
      await this.#buffer.push(event);
    });
    this.#buffer.start();
  }

  async #analyzeBatch(events: CasinoEvent[], config: AppConfig, hooks: RuntimeHooks): Promise<void> {
    if (!config.AI_ENABLED) return;
    try {
      const [investigation, operations, risk] = await Promise.all([
        this.#infrastructureInvestigator.investigate(events),
        this.#operationsAgent.analyze(events),
        this.#riskAgent.analyze(events),
      ]);
      const infrastructure = investigation.report;
      const analyses: AgentAnalysis[] = [
        { agent: "infrastructure-agent", report: infrastructure },
        { agent: "operations-agent", report: operations },
        { agent: "risk-agent", report: risk },
      ];
      for (const analysis of analyses) {
        appendBounded(this.agentReports, analysis, 200);
        hooks.onAgentAnalysis?.(analysis);
      }

      const now = Date.now();
      const correlated = investigation.verification?.status === "verified"
        && infrastructure.incidentDetected
        && infrastructure.affectedServices.length >= 2;
      if (!correlated || now - this.#lastBrainCall < config.CASINO_BRAIN_COOLDOWN_MS) return;
      this.#lastBrainCall = now;
      const state = this.simulator.getState();
      const incident = await this.#brain.analyze({
        infrastructureReport: infrastructure,
        operationsReport: operations,
        riskReport: risk,
        digitalTwinState: { phase: state.phase, services: state.services },
        infrastructureInvestigation: {
          verification: investigation.verification,
          evidence: investigation.context?.evidence ?? [],
        },
      });
      if (incident.incidentDetected) {
        appendBounded(this.incidents, incident, 50);
        hooks.onIncident?.(incident);
      }
    } catch (error) {
      console.error(JSON.stringify({
        type: "agent.failure",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown agent error",
      }));
    }
  }

  async flush(): Promise<void> {
    await this.#buffer.flush();
  }

  queryCasinoBrain(query: string, incident: CasinoIncident) {
    return this.#brainQuery.query(query, incident);
  }

  reset(): void {
    this.simulator.reset();
    this.agentReports.length = 0;
    this.incidents.length = 0;
    this.agentTraces.length = 0;
    this.#lastBrainCall = 0;
  }

  async close(): Promise<void> {
    this.simulator.stop();
    await this.#buffer.stop();
  }
}

function appendBounded<T>(items: T[], item: T, maxItems: number): void {
  items.push(item);
  if (items.length > maxItems) items.splice(0, items.length - maxItems);
}
