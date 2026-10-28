import type { EventSeverity, MitigationAction, MitigationSimulation, ServiceState } from "@casino-ops/shared";

export interface RecoveryStep {
  type: string;
  severity: EventSeverity;
  state: MitigationSimulation;
}

export function applyRecoveryStep(
  services: Map<string, ServiceState>,
  action: MitigationAction,
  step: 1 | 2,
): RecoveryStep {
  if (step === 1) {
    applyIntermediateState(services, action);
    return {
      type: "MITIGATION_PROGRESS",
      severity: "warning",
      state: { action, status: "running", outcome: "pending", progress: 0.5, summary: "Digital twin is evaluating service recovery." },
    };
  }
  return applyFinalState(services, action);
}

function applyIntermediateState(services: Map<string, ServiceState>, action: MitigationAction): void {
  if (action === "disable_feature" || action === "queue_requests") return;
  setService(services, "auth-service", { status: "degraded", latencyMs: 900, errorRate: 0.14 });
}

function applyFinalState(services: Map<string, ServiceState>, action: MitigationAction): RecoveryStep {
  if (action === "failover_service") {
    recoverAll(services);
    return completed(action, "recovered", "Secondary authentication service restored normal operation.", "AUTH_FAILOVER_COMPLETED", "info");
  }
  if (action === "restart_service") {
    setService(services, "auth-service", { status: "degraded", latencyMs: 420, errorRate: 0.06 });
    degradeDependents(services, 1.3, 0.08);
    return completed(action, "partial", "Restart reduced errors but did not fully restore authentication.", "AUTH_RESTART_PARTIAL", "warning");
  }
  if (action === "disable_feature") {
    setService(services, "payment-service", { status: "degraded", latencyMs: 180, errorRate: 0 });
    return completed(action, "contained", "Deposit failures stopped, with high operational impact from disabled deposits.", "DEPOSITS_DISABLED", "warning");
  }
  if (action === "queue_requests") {
    setService(services, "kyc-service", { status: "degraded", latencyMs: 700, errorRate: 0.03 });
    setService(services, "player-registration", { status: "degraded", latencyMs: 680, errorRate: 0.04 });
    return completed(action, "contained", "Requests are safely queued while authentication remains unavailable.", "REQUEST_QUEUE_ACTIVE", "warning");
  }
  setService(services, "auth-service", { status: "degraded", latencyMs: 650, errorRate: 0.09 });
  degradeDependents(services, 1.5, 0.1);
  return completed(action, "stabilized", "Reduced load stabilized authentication without full recovery.", "AUTH_LOAD_STABILIZED", "warning");
}

function recoverAll(services: Map<string, ServiceState>): void {
  const healthy = new Map([
    ["auth-service", { latencyMs: 95, errorRate: 0.003 }],
    ["payment-service", { latencyMs: 185, errorRate: 0.01 }],
    ["kyc-service", { latencyMs: 245, errorRate: 0.01 }],
    ["cashier-service", { latencyMs: 155, errorRate: 0.005 }],
    ["player-registration", { latencyMs: 215, errorRate: 0.01 }],
  ]);
  for (const [id, metrics] of healthy) setService(services, id, { status: "healthy", ...metrics });
}

function degradeDependents(services: Map<string, ServiceState>, latencyFactor: number, errorRate: number): void {
  for (const id of ["payment-service", "kyc-service", "cashier-service", "player-registration"]) {
    const service = required(services, id);
    setService(services, id, { status: "degraded", latencyMs: Math.round(service.latencyMs * latencyFactor), errorRate });
  }
}

function setService(services: Map<string, ServiceState>, id: string, patch: Pick<ServiceState, "status" | "latencyMs" | "errorRate">): void {
  services.set(id, { ...required(services, id), ...patch });
}

function required(services: Map<string, ServiceState>, id: string): ServiceState {
  const service = services.get(id);
  if (!service) throw new Error(`Unknown service: ${id}`);
  return service;
}

function completed(action: MitigationAction, outcome: MitigationSimulation["outcome"], summary: string, type: string, severity: EventSeverity): RecoveryStep {
  return { type, severity, state: { action, status: "completed", outcome, progress: 1, summary } };
}
