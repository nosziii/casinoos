import type { AIRuntimeStatus, AgentAnalysis, AgentTraceEvent, CasinoBrainQueryResponse, CasinoEvent, CasinoIncident, MitigationAction, MitigationComparison, SimulationPrediction } from "@casino-ops/shared";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { SimulationState, SocketMessage } from "../types";

const emptyState: SimulationState = { running: false, scenario: "auth-cascade-failure", scenarioStatus: "idle", phase: 0, services: [], mitigation: null };
const RECONNECT_MAX_DELAY_MS = 10_000;
const RECOVERY_POLL_INTERVAL_MS = 500;
const RECOVERY_TIMEOUT_MS = 20_000;

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
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let reconnectAttempt = 0;
  let recoveryRun = 0;
  let visibilityHookAttached = false;

  const latestIncident = computed(() => incidents.value.at(-1));

  async function initialize(): Promise<void> {
    await loadSnapshot();
    connect();
    if (!visibilityHookAttached) {
      document.addEventListener("visibilitychange", reconnectWhenVisible);
      visibilityHookAttached = true;
    }
  }

  async function loadSnapshot(): Promise<void> {
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
  }

  function connect(): void {
    if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const current = new WebSocket(`${protocol}://${location.host}/ws`);
    socket = current;
    current.addEventListener("open", () => {
      if (socket !== current) return;
      connected.value = true;
      reconnectAttempt = 0;
      void loadSnapshot().catch(() => undefined);
    });
    current.addEventListener("close", () => {
      if (socket !== current) return;
      connected.value = false;
      socket = undefined;
      scheduleReconnect();
    });
    current.addEventListener("error", () => current.close());
    current.addEventListener("message", (message) => handleMessage(JSON.parse(String(message.data)) as SocketMessage));
  }

  function scheduleReconnect(): void {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    const delay = Math.min(1_000 * 2 ** reconnectAttempt, RECONNECT_MAX_DELAY_MS);
    reconnectAttempt += 1;
    reconnectTimer = setTimeout(connect, delay);
  }

  function reconnectWhenVisible(): void {
    if (document.visibilityState === "visible" && !connected.value) connect();
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

  async function refreshState(): Promise<SimulationState | undefined> {
    const response = await fetch("/api/simulation/state");
    if (!response.ok) return undefined;
    const nextState = await response.json() as SimulationState;
    state.value = nextState;
    return nextState;
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
    recoveryRun += 1;
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
    const run = ++recoveryRun;
    state.value = await post<SimulationState>(`/api/simulation/mitigations/${action}/simulate`);
    await waitForRecovery(run);
  }

  async function waitForRecovery(run: number): Promise<void> {
    const deadline = Date.now() + RECOVERY_TIMEOUT_MS;
    while (run === recoveryRun && Date.now() < deadline) {
      if (state.value.mitigation?.status === "completed") return;
      await delay(RECOVERY_POLL_INTERVAL_MS);
      try {
        const current = await refreshState();
        if (current?.mitigation?.status === "completed") return;
      } catch {
        // A reconnect or the next polling attempt can still recover transient network failures.
      }
    }
    if (run === recoveryRun) throw new Error("Recovery status update timed out. Retry the demo connection.");
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

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}
