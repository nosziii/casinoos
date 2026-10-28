import type { AgentAnalysis, AgentTraceEvent, CasinoEvent, CasinoIncident, MitigationComparison, MitigationSimulation, ServiceState, SimulationPrediction } from "@casino-ops/shared";

export interface SimulationState {
  running: boolean;
  scenario: string;
  scenarioStatus: "idle" | "running" | "stopped" | "incident" | "recovering" | "recovered" | "stabilized";
  phase: number;
  services: ServiceState[];
  mitigation: MitigationSimulation | null;
}

export type SocketMessage =
  | { type: "casino.event"; payload: CasinoEvent }
  | { type: "agent.analysis"; payload: AgentAnalysis }
  | { type: "agent.trace"; payload: AgentTraceEvent }
  | { type: "incident.detected"; payload: CasinoIncident }
  | { type: "simulation.prediction"; payload: SimulationPrediction }
  | { type: "simulation.mitigation"; payload: MitigationComparison }
  | { type: "simulation.state"; payload: SimulationState };
