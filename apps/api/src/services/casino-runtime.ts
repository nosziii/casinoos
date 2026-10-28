import {
  CasinoBrain,
  createReadOnlyAgentTools,
  InfrastructureAgent,
  OperationsAgent,
  RiskAgent,
  type AgentToolRegistry,
} from "@casino-os/agents";
import { EventBuffer, EventBus } from "@casino-os/events";
import type { AgentAnalysis, CasinoEvent, CasinoIncident } from "@casino-os/shared";
import { CasinoSimulator } from "@casino-os/simulator";
import type { AppConfig } from "../config/env.js";
import { createAgentClients } from "./ai-clients.js";

export interface RuntimeHooks {
  onEvent?: (event: CasinoEvent) => void;
  onAgentAnalysis?: (analysis: AgentAnalysis) => void;
  onIncident?: (incident: CasinoIncident) => void;
}

export class CasinoRuntime {
  readonly eventBus = new EventBus();
  readonly simulator = new CasinoSimulator(this.eventBus);
  readonly agentReports: AgentAnalysis[] = [];
  readonly incidents: CasinoIncident[] = [];
  readonly agentTools: AgentToolRegistry;
  readonly #buffer: EventBuffer;
  readonly #infrastructureAgent: InfrastructureAgent;
  readonly #operationsAgent: OperationsAgent;
  readonly #riskAgent: RiskAgent;
  readonly #brain: CasinoBrain;
  #lastBrainCall = 0;

  constructor(config: AppConfig, hooks: RuntimeHooks = {}) {
    this.agentTools = createReadOnlyAgentTools({
      getServices: () => this.simulator.getState().services,
      getEvents: () => this.simulator.getEvents(),
    });
    const clients = createAgentClients(config);
    this.#infrastructureAgent = new InfrastructureAgent(clients.specialist);
    this.#operationsAgent = new OperationsAgent(clients.specialist);
    this.#riskAgent = new RiskAgent(clients.specialist);
    this.#brain = new CasinoBrain(clients.brain);
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
      const [infrastructure, operations, risk] = await Promise.all([
        this.#infrastructureAgent.analyze(events),
        this.#operationsAgent.analyze(events),
        this.#riskAgent.analyze(events),
      ]);
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
      const correlated = infrastructure.incidentDetected && infrastructure.affectedServices.length >= 2;
      if (!correlated || now - this.#lastBrainCall < config.CASINO_BRAIN_COOLDOWN_MS) return;
      this.#lastBrainCall = now;
      const state = this.simulator.getState();
      const incident = await this.#brain.analyze({
        infrastructureReport: infrastructure,
        operationsReport: operations,
        riskReport: risk,
        digitalTwinState: { phase: state.phase, services: state.services },
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

  reset(): void {
    this.simulator.reset();
    this.agentReports.length = 0;
    this.incidents.length = 0;
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
