import {
  mitigationComparisonSchema,
  simulationPredictionSchema,
  type MitigationComparison,
  type SimulationPrediction,
} from "@casino-ops/shared";
import { z } from "zod";
import { AgentToolRegistry, type AgentToolRegistryOptions } from "./registry.js";

export interface DecisionSupportSource {
  predictOutage(durationMinutes: number): SimulationPrediction;
  compareMitigations(durationMinutes: number): MitigationComparison;
}

const durationInputSchema = z.object({ durationMinutes: z.number().int().min(1).max(120) }).strict();

export function createDecisionSupportTools(
  source: DecisionSupportSource,
  options: AgentToolRegistryOptions = {},
): AgentToolRegistry {
  const registry = new AgentToolRegistry(options);
  registry.register({
    name: "predictOutage",
    description: "Read deterministic outage impact. Input: {durationMinutes: integer 1..120}.",
    inputSchema: durationInputSchema,
    outputSchema: simulationPredictionSchema,
    execute: ({ durationMinutes }) => source.predictOutage(durationMinutes),
  });
  registry.register({
    name: "compareMitigations",
    description: "Read deterministic mitigation ranking. Input: {durationMinutes: integer 1..120}.",
    inputSchema: durationInputSchema,
    outputSchema: mitigationComparisonSchema,
    execute: ({ durationMinutes }) => source.compareMitigations(durationMinutes),
  });
  return registry;
}
