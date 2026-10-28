import { mitigationActionSchema } from "@casino-os/shared";
import { compareMitigations, predictOutage } from "@casino-os/simulator";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { CasinoRuntime } from "../services/casino-runtime.js";

const predictionRequestSchema = z.object({
  durationMinutes: z.number().int().min(1).max(120),
}).strict();

export function registerDigitalTwinRoutes(
  app: FastifyInstance,
  runtime: CasinoRuntime,
  broadcast: (type: string, payload: unknown) => void,
): void {
  app.post("/simulation/predict", async (request, reply) => {
    const input = predictionRequestSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send(invalidRequest(input.error));
    if (runtime.incidents.length === 0) return reply.code(409).send({ error: "NO_ACTIVE_INCIDENT" });
    const prediction = predictOutage(input.data.durationMinutes);
    broadcast("simulation.prediction", prediction);
    return prediction;
  });

  app.post("/simulation/mitigations", async (request, reply) => {
    const input = predictionRequestSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send(invalidRequest(input.error));
    if (runtime.incidents.length === 0) return reply.code(409).send({ error: "NO_ACTIVE_INCIDENT" });
    const comparison = compareMitigations(input.data.durationMinutes);
    broadcast("simulation.mitigation", comparison);
    return comparison;
  });

  app.post<{ Params: { action: string } }>("/simulation/mitigations/:action/simulate", async (request, reply) => {
    const action = mitigationActionSchema.safeParse(request.params.action);
    if (!action.success) return reply.code(400).send({ error: "INVALID_MITIGATION_ACTION" });
    if (runtime.incidents.length === 0) return reply.code(409).send({ error: "NO_ACTIVE_INCIDENT" });
    try {
      await runtime.simulator.simulateMitigation(action.data);
      const state = runtime.simulator.getState();
      broadcast("simulation.state", state);
      return state;
    } catch (error) {
      return reply.code(409).send({
        error: "MITIGATION_NOT_AVAILABLE",
        message: error instanceof Error ? error.message : "Mitigation simulation failed",
      });
    }
  });
}

function invalidRequest(error: z.ZodError): { error: string; issues: Array<{ path: PropertyKey[]; message: string }> } {
  return {
    error: "INVALID_REQUEST",
    issues: error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
  };
}
