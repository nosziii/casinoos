import { casinoBrainQueryRequestSchema } from "@casino-os/shared";
import type { FastifyInstance } from "fastify";
import type { CasinoRuntime } from "../services/casino-runtime.js";

export function registerCasinoBrainQueryRoute(app: FastifyInstance, runtime: CasinoRuntime): void {
  app.post("/casino-brain/query", async (request, reply) => {
    const input = casinoBrainQueryRequestSchema.safeParse(request.body);
    if (!input.success) {
      return reply.code(400).send({
        error: "INVALID_REQUEST",
        issues: input.error.issues.map(({ path, message }) => ({ path, message })),
      });
    }
    const incident = runtime.incidents.at(-1);
    if (!incident?.incidentDetected) return reply.code(409).send({ error: "NO_VERIFIED_INCIDENT" });
    try {
      return await runtime.queryCasinoBrain(input.data.query, incident);
    } catch {
      return reply.code(502).send({ error: "CASINO_BRAIN_QUERY_FAILED" });
    }
  });
}
