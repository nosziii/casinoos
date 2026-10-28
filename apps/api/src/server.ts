import "dotenv/config";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import { loadConfig } from "./config/env.js";
import { registerDigitalTwinRoutes } from "./routes/digital-twin.js";
import { registerCasinoBrainQueryRoute } from "./routes/casino-brain-query.js";
import { CasinoRuntime } from "./services/casino-runtime.js";

const config = loadConfig();
const app = Fastify({ logger: { redact: ["req.headers.authorization", "*.apiKey"] } });
await app.register(websocket);

const sockets = new Set<{ send(data: string): void; readyState: number }>();
const broadcast = (type: string, payload: unknown): void => {
  const message = JSON.stringify({ type, payload });
  for (const socket of sockets) if (socket.readyState === 1) socket.send(message);
};
const runtime = new CasinoRuntime(config, {
  onEvent: (event) => broadcast("casino.event", event),
  onAgentAnalysis: (analysis) => broadcast("agent.analysis", analysis),
  onIncident: (incident) => broadcast("incident.detected", incident),
});

app.get("/health", async () => ({ status: "ok", aiMode: config.AI_MODE }));
app.get("/simulation/state", async () => runtime.simulator.getState());
app.get("/events", async () => runtime.simulator.getEvents());
app.get("/agent-reports", async () => runtime.agentReports);
app.get("/incidents", async () => runtime.incidents);
registerDigitalTwinRoutes(app, runtime, broadcast);
registerCasinoBrainQueryRoute(app, runtime);
app.post("/simulation/start", async () => {
  runtime.simulator.start();
  return runtime.simulator.getState();
});
app.post("/simulation/stop", async () => {
  runtime.simulator.stop();
  return runtime.simulator.getState();
});
app.post("/simulation/reset", async () => {
  runtime.reset();
  return runtime.simulator.getState();
});
app.post<{ Params: { scenario: string } }>("/simulation/scenario/:scenario", async (request, reply) => {
  if (request.params.scenario !== "auth-cascade-failure") return reply.code(404).send({ error: "Unknown scenario" });
  runtime.reset();
  runtime.simulator.start();
  return runtime.simulator.getState();
});
app.get("/ws", { websocket: true }, (socket) => {
  sockets.add(socket);
  socket.send(JSON.stringify({ type: "simulation.state", payload: runtime.simulator.getState() }));
  socket.on("close", () => sockets.delete(socket));
});

app.addHook("onClose", async () => runtime.close());

try {
  await app.listen({ port: config.PORT, host: config.HOST });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
