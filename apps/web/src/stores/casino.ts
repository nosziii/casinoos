import type { AIRuntimeStatus, AgentAnalysis, AgentTraceEvent, CasinoBrainQueryResponse, CasinoEvent, CasinoIncident, MitigationAction, MitigationComparison, SimulationPrediction } from "@casino-ops/shared";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { SimulationState, SocketMessage } from "../types";

const emptyState: SimulationState = { running: false, scenario: "auth-cascade-failure", scenarioStatus: "idle", phase: 0, services: [], mitigation: null };

export const useCasinoStore = defineStore("casino", () => {
  const state = ref<SimulationState>(emptyState);
  const events = ref<CasinoEvent[]>([]);
  const agentReports = ref<AgentAnalysis[]>([]);
  const agentTraces = ref<AgentTraceEvent[]>([]);
  const incidents = ref<CasinoIncident[]>([]);
  const prediction = ref<SimulationPrediction>();
  const mitigations = ref<MitigationComparison>();
  const queryResponse = ref<CasinoBrainQueryResponse>();
  const connected = ref(false);
  const aiStatus = ref<AIRuntimeStatus>();
  let socket: WebSocket | undefined;

  const latestIncident = computed(() => incidents.value.at(-1));

  async function initialize(): Promise<void> {
    const [stateResponse, eventResponse, agentResponse, incidentResponse, traceResponse, aiResponse] = await Promise.all([
      fetch("/api/simulation/state"), fetch("/api/events"), fetch("/api/agent-reports"), fetch("/api/incidents"), fetch("/api/agent-traces"), fetch("/api/runtime/ai"),
    ]);
    if (![stateResponse, eventResponse, agentResponse, incidentResponse, traceResponse, aiResponse].every((response) => response.ok)) {
      throw new Error("CasinoOps API is unavailable");
    }
    state.value = await stateResponse.json() as SimulationState;
    events.value = await eventResponse.json() as CasinoEvent[];
    agentReports.value = await agentResponse.json() as AgentAnalysis[];
    incidents.value = await incidentResponse.json() as CasinoIncident[];
    agentTraces.value = await traceResponse.json() as AgentTraceEvent[];
    aiStatus.value = await aiResponse.json() as AIRuntimeStatus;
    connect();
  }

  function connect(): void {
    socket?.close();
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    socket = new WebSocket(`${protocol}://${location.host}/ws`);
    socket.addEventListener("open", () => { connected.value = true; });
    socket.addEventListener("close", () => { connected.value = false; });
    socket.addEventListener("message", (message) => handleMessage(JSON.parse(String(message.data)) as SocketMessage));
  }

  function handleMessage(message: SocketMessage): void {
    if (message.type === "casino.event") {
      events.value = [...events.value.slice(-79), message.payload];
      void refreshState();
    } else if (message.type === "agent.analysis") {
      agentReports.value = [...agentReports.value.slice(-29), message.payload];
    } else if (message.type === "agent.trace") {
      agentTraces.value = [...agentTraces.value.slice(-99), message.payload];
    } else if (message.type === "incident.detected") {
      incidents.value = [...incidents.value.slice(-9), message.payload];
    } else if (message.type === "simulation.prediction") {
      prediction.value = message.payload;
    } else if (message.type === "simulation.mitigation") {
      mitigations.value = message.payload;
    } else if (message.type === "ai.status") aiStatus.value = message.payload;
    else if (message.type === "simulation.state") state.value = message.payload;
  }

  async function refreshState(): Promise<void> {
    const response = await fetch("/api/simulation/state");
    if (response.ok) state.value = await response.json() as SimulationState;
  }

  async function runScenario(): Promise<void> {
    events.value = [];
    agentReports.value = [];
    agentTraces.value = [];
    incidents.value = [];
    prediction.value = undefined;
    mitigations.value = undefined;
    queryResponse.value = undefined;
    await post("/api/simulation/scenario/auth-cascade-failure");
    await refreshState();
  }

  async function reset(): Promise<void> {
    await post("/api/simulation/reset");
    events.value = [];
    agentReports.value = [];
    agentTraces.value = [];
    incidents.value = [];
    prediction.value = undefined;
    mitigations.value = undefined;
    queryResponse.value = undefined;
    await refreshState();
  }

  async function predict(durationMinutes: number): Promise<void> {
    queryResponse.value = undefined;
    prediction.value = await post<SimulationPrediction>("/api/simulation/predict", { durationMinutes });
  }

  async function compareMitigations(durationMinutes: number): Promise<void> {
    queryResponse.value = undefined;
    mitigations.value = await post<MitigationComparison>("/api/simulation/mitigations", { durationMinutes });
  }

  async function askCasinoBrain(query: string): Promise<void> {
    const response = await post<CasinoBrainQueryResponse>("/api/casino-brain/query", { query });
    queryResponse.value = response;
    if (response.toolName === "predictOutage") prediction.value = response.result;
    else mitigations.value = response.result;
  }

  async function simulateMitigation(action: MitigationAction): Promise<void> {
    state.value = await post<SimulationState>(`/api/simulation/mitigations/${action}/simulate`);
  }

  async function post<T = void>(url: string, body: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({})) as { error?: string };
      const incidentRequired = problem.error === "NO_ACTIVE_INCIDENT" || problem.error === "NO_VERIFIED_INCIDENT";
      throw new Error(incidentRequired ? "Wait for a verified incident before querying the Digital Twin" : `Request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  return { state, events, agentReports, agentTraces, incidents, prediction, mitigations, queryResponse, connected, aiStatus, latestIncident, initialize, runScenario, reset, predict, compareMitigations, askCasinoBrain, simulateMitigation };
});
