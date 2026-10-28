import type { InfrastructureReport } from "../schemas/infrastructure-report.js";
import type { OperationsReport } from "../schemas/operations-report.js";
import type { RiskReport } from "../schemas/risk-report.js";

export type SpecialistAgentName = "infrastructure-agent" | "operations-agent" | "risk-agent";

export type AgentAnalysis =
  | { agent: "infrastructure-agent"; report: InfrastructureReport }
  | { agent: "operations-agent"; report: OperationsReport }
  | { agent: "risk-agent"; report: RiskReport };

