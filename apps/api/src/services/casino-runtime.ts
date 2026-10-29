import {
  CasinoBrain,
  CasinoBrainQueryService,
  createDecisionSupportTools,
  createReadOnlyAgentTools,
  InfrastructureInvestigationLoop,
  OperationsAgent,
  RiskAgent,
  type AgentToolRegistry,
  type FallbackEvent,
} from "@casino-ops/agents";
import { EventBuffer, EventBus } from "@casino-ops/events";
import { aiRuntimeStatusSchema, type AIRuntimeStatus, type AgentAnalysis, type AgentTraceEvent, type CasinoEvent, type CasinoIncident } from "@casino-ops/shared";
import { CasinoSimulator, compareMitigations, predictOutage } from "@casino-ops/simulator";
import type { AppConfig } from "../config/env.js";
import { createAgentClients } from "./ai-clients.js";

export interface RuntimeHooks {
  onEvent?: (event: CasinoEvent) => void;
  onAgentAnalysis?: (analysis: AgentAnalysis) => void;
  onIncident?: (incident: CasinoIncident) => void;
  onAgentTrace?: (trace: AgentTraceEvent) => void;
  onAIStatus?: (status: AIRuntimeStatus) => void;
}

export class CasinoRuntime {
  readonly eventBus = new EventBus();
  readonly simulator = new CasinoSimulator(this.eventBus);
  readonly agentReports: AgentAnalysis[] = [];
  readonly incidents: CasinoIncident[] = [];
  readonly agentTraces: AgentTraceEvent[] = [];
  readonly agentTools: AgentToolRegistry;
  readonly decisionTools: AgentToolRegistry;
  aiStatus: AIRuntimeStatus;
  readonly #buffer: EventBuffer;
  readonly #infrastructureInvestigator: InfrastructureInvestigationLoop;
  readonly #operationsAgent: OperationsAgent;
  readonly #riskAgent: RiskAgent;
  readonly #brain: CasinoBrain;
  readonly #brainQuery: CasinoBrainQueryService;
  readonly #config: AppConfig;
  readonly #hooks: RuntimeHooks;
  #lastBrainCall = 0;
  #generation = 0;
  #activeAnalysisGeneration = 0;

  constructor(config: AppConfig, hooks: RuntimeHooks = {}) {
    this.#config = config;
    this.#hooks = hooks;
    this.aiStatus = initialAIStatus(config);
    this.agentTools = createReadOnlyAgentTools({
      getServices: () => this.simulator.getState().services,
      getEvents: () => this.simulator.getEvents(),
    });
    this.decisionTools = createDecisionSupportTools({ predictOutage, compareMitigations });
    const clients = createAgentClients(config, (event) => this.#activateFallback(event));
    this.#infrastructureInvestigator = new InfrastructureInvestigationLoop(clients.specialist, this.agentTools, {
      maxTurns: config.MAX_INVESTIGATION_TURNS,
      maxToolCalls: config.MAX_INVESTIGATION_TOOL_CALLS,
      maxDurationMs: config.INVESTIGATION_TIMEOUT_MS,
      onTrace: (trace) => {
        if (this.#activeAnalysisGeneration !== this.#generation) return;
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
      onFlush: async (events) => {
        const generation = this.#generation;
        this.#activeAnalysisGeneration = generation;
        await this.#analyzeBatch(events, config, hooks, generation);
      },
    });
    this.eventBus.subscribeAll(async (event) => {
      hooks.onEvent?.(event);
      if (event.data.simulationKind === "mitigation") return;
      await this.#buffer.push(event);
    });
    this.#buffer.start();
  }

  async #analyzeBatch(events: CasinoEvent[], config: AppConfig, hooks: RuntimeHooks, generation: number): Promise<void> {
    if (!config.AI_ENABLED) return;
    if (this.simulator.getState().phase < 3) return;
    try {
      const scenarioEvents = this.simulator.getEvents();
      const evidenceEvents = scenarioEvents.length > 0 ? scenarioEvents : events;
      const [investigation, operations, risk] = await Promise.all([
        this.#infrastructureInvestigator.investigate(evidenceEvents),
        this.#operationsAgent.analyze(evidenceEvents),
        this.#riskAgent.analyze(evidenceEvents),
      ]);
      if (generation !== this.#generation) return;
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
      if (generation !== this.#generation) return;
      if (incident.incidentDetected) {
        const current = this.incidents.at(-1);
        if (current && current.rootCause.confidence >= incident.rootCause.confidence) return;
        this.incidents.splice(0, this.incidents.length, incident);
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
    this.#generation += 1;
    this.#activeAnalysisGeneration = -1;
    this.#buffer.clear();
    this.simulator.reset();
    this.agentReports.length = 0;
    this.incidents.length = 0;
    this.agentTraces.length = 0;
    this.#lastBrainCall = 0;
    this.aiStatus = initialAIStatus(this.#config);
    this.#hooks.onAIStatus?.(this.aiStatus);
  }

  async close(): Promise<void> {
    this.simulator.stop();
    await this.#buffer.stop();
  }

  #activateFallback({ provider, agent, reason }: FallbackEvent): void {
    if (this.aiStatus.effectiveMode === "fallback") return;
    this.aiStatus = aiRuntimeStatusSchema.parse({
      ...this.aiStatus,
      effectiveMode: "fallback",
      lastFailure: { provider, agent, reason, occurredAt: new Date().toISOString() },
    });
    this.#hooks.onAIStatus?.(this.aiStatus);
  }
}

function initialAIStatus(config: AppConfig): AIRuntimeStatus {
  return aiRuntimeStatusSchema.parse({
    configuredMode: config.AI_MODE,
    effectiveMode: config.AI_MODE,
    fallbackEnabled: config.AI_FALLBACK_ENABLED,
    specialists: { provider: config.AI_MODE === "live" ? "Baseten" : "Deterministic", model: config.AI_MODE === "live" ? config.BASETEN_MODEL : "Validated mock schemas" },
    brain: { provider: config.AI_MODE === "live" ? "Meta Model API" : "Deterministic", model: config.AI_MODE === "live" ? config.META_MODEL : "Validated mock schemas" },
  });
}

function appendBounded<T>(items: T[], item: T, maxItems: number): void {
  items.push(item);
  if (items.length > maxItems) items.splice(0, items.length - maxItems);
}
