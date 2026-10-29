import {
  investigationContextSchema,
  type CasinoEvent,
  type InfrastructureReport,
  type InvestigationContext,
  type VerificationResult,
  type AgentTraceEvent,
} from "@casino-ops/shared";
import type { AIClient } from "../clients/ai-client.js";
import type { AgentToolRegistry } from "../tools/registry.js";
import { completeWithRetry } from "../structured-completion.js";
import { InfrastructureAgent } from "../infrastructure-agent.js";
import { investigationActionSchema } from "./action.js";
import { createInvestigationContext } from "./context.js";
import { mapToolResultToEvidence } from "./evidence-mapper.js";
import { EvidenceStore } from "./evidence-store.js";
import { verifyRootCause } from "./verifier.js";
import { AgentTraceEmitter } from "./trace.js";

const ACTION_PROMPT = `You investigate a synthetic casino incident using only the allow-listed read-only tools.
Return exactly one JSON action. Use {"action":"call_tool","rationale":"...","toolName":"...","input":{...}}
or {"action":"finish","rationale":"..."}. Gather service state, dependency and event evidence before finishing.
Tool inputs are exact: getServiceState, getDependencies and getDependents require {"serviceId":"service-name"}.
getRecentEvents accepts {"limit":1..50} with optional "source" and "domain". Do not add other input fields.
Use this investigation policy: first getServiceState for the suspected root service, then getDependents for that
same root service, then getRecentEvents with limit 20, then finish. Do not request service state for affected
services and do not repeat a successful tool call. Only deviate to correct a failed tool call.
Never request mutation, mitigation, shell, network, credential or real-infrastructure access.`;

export interface InvestigationLoopOptions {
  maxTurns?: number;
  maxToolCalls?: number;
  maxDurationMs?: number;
  now?: () => string;
  onTrace?: (event: AgentTraceEvent) => void;
}

export interface InfrastructureInvestigationResult {
  report: InfrastructureReport;
  context: InvestigationContext | null;
  verification: VerificationResult | null;
  termination: "no_incident" | "finished" | "turn_limit" | "tool_limit" | "timeout";
}

export class InfrastructureInvestigationLoop {
  readonly #analyzer: InfrastructureAgent;

  constructor(
    private readonly client: AIClient,
    private readonly tools: AgentToolRegistry,
    private readonly options: InvestigationLoopOptions = {},
  ) {
    this.#analyzer = new InfrastructureAgent(client);
  }

  async investigate(events: CasinoEvent[]): Promise<InfrastructureInvestigationResult> {
    const maxTurns = this.options.maxTurns ?? 4;
    const maxToolCalls = this.options.maxToolCalls ?? 6;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error("Investigation time limit exceeded")), this.options.maxDurationMs ?? 25_000);
    timer.unref();
    try {
      const report = await this.#analyzer.analyze(events, controller.signal);
      const rootCause = report.suspectedRootCauses[0];
      if (!report.incidentDetected || !rootCause) return { report, context: null, verification: null, termination: "no_incident" };
      return await this.#runLoop(report, rootCause, maxTurns, maxToolCalls, controller.signal);
    } catch (error) {
      if (controller.signal.aborted) return this.#timeoutResult(events);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async #runLoop(report: InfrastructureReport, rootCause: { service: string; confidence: number }, maxTurns: number, maxToolCalls: number, signal: AbortSignal): Promise<InfrastructureInvestigationResult> {
    const now = this.options.now ?? (() => new Date().toISOString());
    let context = createInvestigationContext({ id: `inv-${eventsKey(report)}`, rootCauseService: rootCause.service, statement: report.summary, timestamp: now() });
    const trace = new AgentTraceEmitter(context.id, now, this.options.onTrace);
    trace.emit("plan", `Investigate ${rootCause.service} as the suspected root service.`, "info", [], {
      affectedServices: report.affectedServices,
      checklist: context.checklist.map(({ description }) => description),
    });
    const store = new EvidenceStore();
    let termination: InfrastructureInvestigationResult["termination"] = "turn_limit";
    for (let turn = 1; turn <= maxTurns; turn += 1) {
      const action = await completeWithRetry(this.client, {
        agent: "infrastructure-investigator",
        systemPrompt: ACTION_PROMPT,
        payload: { hypothesis: context.hypothesis, affectedServices: report.affectedServices, availableTools: this.tools.list(), evidence: store.list(), toolCalls: context.toolCalls },
        schema: investigationActionSchema,
        signal,
      });
      context = updateContext(context, { turn, status: "investigating", updatedAt: now() });
      if (action.action === "finish") { termination = "finished"; break; }
      if (context.toolCalls.length >= maxToolCalls) { termination = "tool_limit"; break; }
      trace.emit("tool_call", `Call read-only tool ${action.toolName}.`, "info", [], { toolName: action.toolName });
      try {
        const result = await this.tools.execute(action.toolName, action.input);
        const evidence = mapToolResultToEvidence(result, { toolName: action.toolName, toolInput: action.input, capturedAt: now() }, store);
        context = recordToolCall(context, turn, action.toolName, action.input, "succeeded", evidence.map(({ id }) => id), now());
        context = updateContext(context, { evidence: store.list() });
        trace.emit("observation", `${action.toolName} returned ${evidence.length} evidence item(s).`, "success", evidence.map(({ id }) => id), {
          toolName: action.toolName,
          input: action.input,
          evidence: evidence.map(({ id, kind, summary }) => ({ id, kind, summary })),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown tool execution error";
        context = recordToolCall(context, turn, action.toolName, action.input, "failed", [], now(), message);
        trace.emit("observation", `${action.toolName} was rejected by tool validation.`, "error", [], { toolName: action.toolName });
      }
    }
    const verification = verifyRootCause({ serviceId: rootCause.service, affectedServiceIds: report.affectedServices, modelConfidence: rootCause.confidence }, store.list());
    trace.emit("verification", `Verification completed with status ${verification.status}.`, verification.status === "verified" ? "success" : "error", store.list().map(({ id }) => id), { verificationScore: verification.verificationScore, finalConfidence: verification.finalConfidence, checks: verification.checks });
    context = finalizeContext(context, verification, now());
    trace.emit("report", `Infrastructure report finalized with ${termination} termination.`, verification.status === "verified" ? "success" : "error", [], { termination, confidence: verification.finalConfidence });
    return { report: { ...report, confidence: verification.finalConfidence }, context, verification, termination };
  }

  #timeoutResult(events: CasinoEvent[]): InfrastructureInvestigationResult {
    return {
      report: { incidentDetected: false, confidence: 0, summary: `Investigation timed out for ${events.length} events.`, suspectedRootCauses: [], affectedServices: [], severity: "low" },
      context: null, verification: null, termination: "timeout",
    };
  }
}

function recordToolCall(
  context: InvestigationContext,
  turn: number,
  toolName: "getServiceState" | "getDependencies" | "getDependents" | "getRecentEvents",
  input: Record<string, unknown>,
  status: "succeeded" | "failed",
  evidenceIds: string[],
  updatedAt: string,
  error?: string,
): InvestigationContext {
  return updateContext(context, {
    evidence: context.evidence,
    toolCalls: [...context.toolCalls, {
      id: `call-${turn}`,
      toolName,
      input,
      status,
      evidenceIds,
      ...(error ? { error } : {}),
    }],
    updatedAt,
  });
}

function updateContext(context: InvestigationContext, update: Partial<InvestigationContext>): InvestigationContext {
  return investigationContextSchema.parse({ ...context, ...update });
}

function finalizeContext(context: InvestigationContext, verification: VerificationResult, timestamp: string): InvestigationContext {
  const status = verification.status === "verified"
    ? "completed"
    : verification.status === "insufficient_evidence" ? "insufficient_evidence" : "failed";
  const checklist = context.checklist.map((item) => ({ ...item, status: item.id === "verify-evidence" || verification.status === "verified" ? "completed" as const : item.status }));
  return updateContext(context, { evidence: context.evidence, checklist, status, updatedAt: timestamp });
}

function eventsKey(report: InfrastructureReport): string {
  return report.suspectedRootCauses[0]?.service.replace(/[^a-z0-9-]/gi, "-") ?? "unknown";
}
