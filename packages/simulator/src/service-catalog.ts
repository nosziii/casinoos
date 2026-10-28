import type { ServiceState } from "@casino-ops/shared";

export function createHealthyServices(): Map<string, ServiceState> {
  const services: ServiceState[] = [
    { id: "auth-service", status: "healthy", latencyMs: 80, errorRate: 0.001, dependencies: [] },
    { id: "payment-service", status: "healthy", latencyMs: 180, errorRate: 0.01, dependencies: ["auth-service"] },
    { id: "kyc-service", status: "healthy", latencyMs: 240, errorRate: 0.01, dependencies: ["auth-service"] },
    { id: "cashier-service", status: "healthy", latencyMs: 150, errorRate: 0.005, dependencies: ["auth-service", "payment-service"] },
    { id: "player-registration", status: "healthy", latencyMs: 210, errorRate: 0.01, dependencies: ["auth-service", "kyc-service"] },
    { id: "customer-support", status: "healthy", latencyMs: 120, errorRate: 0.002, dependencies: [] },
  ];
  return new Map(services.map((service) => [service.id, service]));
}

