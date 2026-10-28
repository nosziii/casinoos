import { EventBus } from "@casino-os/events";
import type { CasinoEvent, MitigationAction, MitigationSimulation, ServiceState } from "@casino-os/shared";
import { applyRecoveryStep } from "./mitigation-recovery.js";
import { createHealthyServices } from "./service-catalog.js";
import { applyAuthCascadePhase, AUTH_CASCADE_SCENARIO, createAuthCascadeEvents } from "./scenarios/auth-cascade-failure.js";

export interface SimulationState {
  running: boolean;
  scenario: string;
  scenarioStatus: "idle" | "running" | "stopped" | "incident" | "recovering" | "recovered" | "stabilized";
  phase: number;
  services: ServiceState[];
  mitigation: MitigationSimulation | null;
}

export class CasinoSimulator {
  readonly #eventBus: EventBus;
  #services = createHealthyServices();
  #events: CasinoEvent[] = [];
  #running = false;
  #scenarioStatus: SimulationState["scenarioStatus"] = "idle";
  #mitigation: MitigationSimulation | null = null;
  #mitigationStep = 0;
  #phase = 0;
  #sequence = 1;
  #timer: ReturnType<typeof setInterval> | undefined;
  #mitigationTimer: ReturnType<typeof setInterval> | undefined;
  #clock = new Date("2026-10-27T10:31:00.000Z");

  constructor(eventBus: EventBus) {
    this.#eventBus = eventBus;
  }

  start(intervalMs = 3000): void {
    if (this.#running) return;
    this.#running = true;
    this.#scenarioStatus = "running";
    this.#timer = setInterval(() => void this.advance(), intervalMs);
    this.#timer.unref();
  }

  stop(): void {
    if (this.#timer) clearInterval(this.#timer);
    if (this.#mitigationTimer) clearInterval(this.#mitigationTimer);
    this.#timer = undefined;
    this.#mitigationTimer = undefined;
    this.#running = false;
    if (this.#mitigation?.status === "running") {
      this.#mitigation = { ...this.#mitigation, status: "completed", outcome: "partial", summary: "Mitigation simulation was stopped by the operator." };
      this.#scenarioStatus = "stabilized";
    } else if (this.#scenarioStatus === "running") {
      this.#scenarioStatus = "stopped";
    }
  }

  reset(): void {
    this.stop();
    this.#services = createHealthyServices();
    this.#events = [];
    this.#phase = 0;
    this.#scenarioStatus = "idle";
    this.#mitigation = null;
    this.#mitigationStep = 0;
    this.#sequence = 1;
    this.#clock = new Date("2026-10-27T10:31:00.000Z");
  }

  async advance(): Promise<CasinoEvent[]> {
    if (this.#phase >= 3) {
      this.stop();
      return [];
    }
    this.#phase += 1;
    applyAuthCascadePhase(this.#services, this.#phase);
    if (this.#phase === 3) this.#scenarioStatus = "incident";
    const events = createAuthCascadeEvents(this.#phase, this.#clock, this.#sequence);
    this.#sequence += events.length;
    this.#clock = new Date(this.#clock.getTime() + 10_000);
    this.#events.push(...events);
    for (const event of events) await this.#eventBus.publish(event);
    if (this.#phase === 3) this.#stopScenarioTimer();
    return events;
  }

  async simulateMitigation(action: MitigationAction, intervalMs = 1200): Promise<MitigationSimulation> {
    if (this.#phase < 3) throw new Error("An active cascade incident is required");
    if (this.#mitigation?.status === "running") throw new Error("A mitigation simulation is already running");
    this.stop();
    this.#services = createHealthyServices();
    applyAuthCascadePhase(this.#services, 3);
    this.#running = true;
    this.#scenarioStatus = "recovering";
    this.#mitigationStep = 0;
    this.#mitigation = { action, status: "running", outcome: "pending", progress: 0, summary: "Mitigation simulation started in the digital twin." };
    await this.#publishMitigationEvent("MITIGATION_SIMULATION_STARTED", "info");
    this.#mitigationTimer = setInterval(() => void this.#advanceMitigation(), intervalMs);
    this.#mitigationTimer.unref();
    return structuredClone(this.#mitigation);
  }

  getState(): SimulationState {
    return {
      running: this.#running,
      scenario: AUTH_CASCADE_SCENARIO,
      scenarioStatus: this.#scenarioStatus,
      phase: this.#phase,
      services: structuredClone([...this.#services.values()]),
      mitigation: structuredClone(this.#mitigation),
    };
  }

  getEvents(): CasinoEvent[] {
    return structuredClone(this.#events);
  }

  async #advanceMitigation(): Promise<void> {
    const action = this.#mitigation?.action;
    if (!action) return;
    this.#mitigationStep += 1;
    const step = applyRecoveryStep(this.#services, action, this.#mitigationStep === 1 ? 1 : 2);
    this.#mitigation = step.state;
    if (step.state.status === "completed") {
      if (this.#mitigationTimer) clearInterval(this.#mitigationTimer);
      this.#mitigationTimer = undefined;
      this.#running = false;
      this.#scenarioStatus = step.state.outcome === "recovered" ? "recovered" : "stabilized";
    }
    await this.#publishMitigationEvent(step.type, step.severity);
  }

  async #publishMitigationEvent(type: string, severity: CasinoEvent["severity"]): Promise<void> {
    if (!this.#mitigation) return;
    const event: CasinoEvent = {
      id: `evt_${String(this.#sequence).padStart(5, "0")}`,
      timestamp: this.#clock.toISOString(),
      domain: "infrastructure",
      source: "digital-twin",
      type,
      severity,
      data: { simulationKind: "mitigation", ...this.#mitigation },
    };
    this.#sequence += 1;
    this.#clock = new Date(this.#clock.getTime() + 1000);
    this.#events.push(event);
    await this.#eventBus.publish(event);
  }

  #stopScenarioTimer(): void {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = undefined;
    this.#running = false;
  }
}
