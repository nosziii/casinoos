import { z } from "zod";
import { mitigationComparisonSchema } from "./mitigation.js";
import { simulationPredictionSchema } from "./simulation-prediction.js";

export const casinoBrainQueryRequestSchema = z.object({
  query: z.string().trim().min(3).max(500),
}).strict();

export const casinoBrainQueryResponseSchema = z.discriminatedUnion("toolName", [
  z.object({
    incidentId: z.string().min(1),
    query: z.string().min(1),
    toolName: z.literal("predictOutage"),
    durationMinutes: z.number().int().min(1).max(120),
    answer: z.string().min(1),
    result: simulationPredictionSchema,
    requiresOperatorApproval: z.literal(false),
  }).strict(),
  z.object({
    incidentId: z.string().min(1),
    query: z.string().min(1),
    toolName: z.literal("compareMitigations"),
    durationMinutes: z.number().int().min(1).max(120),
    answer: z.string().min(1),
    result: mitigationComparisonSchema,
    requiresOperatorApproval: z.literal(true),
  }).strict(),
]);

export type CasinoBrainQueryRequest = z.infer<typeof casinoBrainQueryRequestSchema>;
export type CasinoBrainQueryResponse = z.infer<typeof casinoBrainQueryResponseSchema>;
