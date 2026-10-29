import { describe, expect, it } from "vitest";
import { buildDependencyGraph } from "./dependency-graph";

describe("buildDependencyGraph", () => {
  const services = [
    { id: "auth-service", status: "failed" as const, latencyMs: 1_900, errorRate: 0.81, dependencies: [] },
    { id: "payment-service", status: "degraded" as const, latencyMs: 900, errorRate: 0.34, dependencies: ["auth-service"] },
    { id: "kyc-service", status: "healthy" as const, latencyMs: 240, errorRate: 0.01, dependencies: ["auth-service"] },
  ];

  it("maps service dependencies and marks the verified root cause", () => {
    const graph = buildDependencyGraph(services, "auth-service");

    expect(graph.nodes).toHaveLength(3);
    expect(graph.nodes.find(({ id }) => id === "auth-service")?.rootCause).toBe(true);
    expect(graph.edges.map(({ id }) => id)).toEqual(["auth-service:payment-service", "auth-service:kyc-service"]);
  });

  it("shows the most severe endpoint state on a dependency", () => {
    const graph = buildDependencyGraph(services);

    expect(graph.edges.every(({ status }) => status === "failed")).toBe(true);
  });

  it("clears the verified root-cause marker after the service recovers", () => {
    const recovered = services.map((service) => ({ ...service, status: "healthy" as const }));
    const graph = buildDependencyGraph(recovered, "auth-service");

    expect(graph.nodes.find(({ id }) => id === "auth-service")?.rootCause).toBe(false);
  });
});
