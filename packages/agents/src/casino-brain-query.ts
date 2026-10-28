import {
  casinoBrainQueryResponseSchema,
  mitigationComparisonSchema,
  simulationPredictionSchema,
  type CasinoBrainQueryResponse,
  type CasinoIncident,
} from "@casino-os/shared";
import { z } from "zod";
import type { AIClient } from "./clients/ai-client.js";
import { completeWithRetry } from "./structured-completion.js";
import type { AgentToolRegistry } from "./tools/registry.js";

const queryPlanSchema = z.object({
  toolName: z.enum(["predictOutage", "compareMitigations"]),
  durationMinutes: z.number().int().min(1).max(120),
  rationale: z.string().min(1).max(500),
}).strict();

const SYSTEM_PROMPT = `You plan one read-only CasinoOS decision-support query for a verified synthetic incident.
Return only JSON: {"toolName":"predictOutage"|"compareMitigations","durationMinutes":1..120,"rationale":"..."}.
Use predictOutage for impact, forecast, player, transaction or financial questions. Use compareMitigations for
strategy, recovery, recommendation or mitigation comparisons. Extract an explicit duration; otherwise use 30.
Never request execution, simulation, mutation, credentials, shell, network or real-infrastructure access.`;

export class CasinoBrainQueryService {
  constructor(private readonly client: AIClient, private readonly tools: AgentToolRegistry) {}

  async query(query: string, incident: CasinoIncident): Promise<CasinoBrainQueryResponse> {
    if (!incident.incidentDetected) throw new Error("A verified active incident is required");
    const plan = await completeWithRetry(this.client, {
      agent: "casino-brain-query-planner",
      systemPrompt: SYSTEM_PROMPT,
      payload: { query, incident },
      schema: queryPlanSchema,
    });
    const execution = await this.tools.execute(plan.toolName, { durationMinutes: plan.durationMinutes });
    if (plan.toolName === "predictOutage") {
      const result = simulationPredictionSchema.parse(execution.output);
      return casinoBrainQueryResponseSchema.parse({
        incidentId: incident.incidentId,
        query,
        toolName: plan.toolName,
        durationMinutes: plan.durationMinutes,
        answer: `${plan.durationMinutes} minutes of continued outage is projected to affect ${result.affectedPlayers} players and block approximately €${result.estimatedBlockedValue}.`,
        result,
        requiresOperatorApproval: false,
      });
    }
    const result = mitigationComparisonSchema.parse(execution.output);
    return casinoBrainQueryResponseSchema.parse({
      incidentId: incident.incidentId,
      query,
      toolName: plan.toolName,
      durationMinutes: plan.durationMinutes,
      answer: `The highest-ranked synthetic strategy is ${result.recommendedAction}. Applying it still requires explicit operator approval.`,
      result,
      requiresOperatorApproval: true,
    });
  }
}
