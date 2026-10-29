import type { AgentTraceEvent } from "@casino-ops/shared";

export interface TraceCheck {
  check: string;
  passed: boolean;
  explanation?: string;
}

export interface TraceEvidence {
  id: string;
  kind: "service_state" | "dependency" | "event";
  summary: string;
}

export interface InvestigationSummary {
  status: "ready" | "investigating" | "verified" | "rejected";
  hypothesis: string;
  evidenceCount: number;
  checks: TraceCheck[];
  confidencePercent: number | null;
  evidence: TraceEvidence[];
  traces: AgentTraceEvent[];
}

const runKey = (trace: AgentTraceEvent): string => trace.id.replace(/-trace-\d+$/, "");

export function latestInvestigationTraces(traces: AgentTraceEvent[]): AgentTraceEvent[] {
  const latest = traces.at(-1);
  if (!latest) return [];
  const latestRun = runKey(latest);
  return traces.filter((trace) => runKey(trace) === latestRun);
}

export function summarizeInvestigation(traces: AgentTraceEvent[]): InvestigationSummary {
  const current = latestInvestigationTraces(traces);
  const plan = current.find((trace) => trace.stage === "plan");
  const reversed = [...current].reverse();
  const verification = reversed.find((trace) => trace.stage === "verification");
  const report = reversed.find((trace) => trace.stage === "report");
  const evidenceIds = new Set(current.flatMap((trace) => trace.evidenceIds));
  const checks = readChecks(verification?.details.checks);
  const confidence = readNumber(verification?.details.finalConfidence);
  const evidence = readEvidence(current);

  return {
    status: verification?.status === "success" ? "verified" : report || verification ? "rejected" : current.length ? "investigating" : "ready",
    hypothesis: plan?.summary ?? "Awaiting an incident investigation.",
    evidenceCount: evidenceIds.size,
    checks,
    confidencePercent: confidence === null ? null : Math.round(confidence * 100),
    evidence,
    traces: current,
  };
}

function readChecks(value: unknown): TraceCheck[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is TraceCheck => typeof item === "object" && item !== null
    && "check" in item && typeof item.check === "string"
    && "passed" in item && typeof item.passed === "boolean");
}

function readEvidence(traces: AgentTraceEvent[]): TraceEvidence[] {
  const evidence = traces.flatMap((trace) => Array.isArray(trace.details.evidence) ? trace.details.evidence : [])
    .filter((item): item is TraceEvidence => typeof item === "object" && item !== null
      && "id" in item && typeof item.id === "string"
      && "kind" in item && ["service_state", "dependency", "event"].includes(String(item.kind))
      && "summary" in item && typeof item.summary === "string");
  return [...new Map(evidence.map((item) => [item.id, item])).values()];
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
