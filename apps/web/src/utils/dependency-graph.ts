import type { ServiceState } from "@casino-ops/shared";

export interface DependencyGraphNode {
  id: string;
  label: string;
  status: ServiceState["status"];
  x: number;
  y: number;
  rootCause: boolean;
}

export interface DependencyGraphEdge {
  id: string;
  source: DependencyGraphNode;
  target: DependencyGraphNode;
  status: ServiceState["status"];
}

const positions: Record<string, Pick<DependencyGraphNode, "label" | "x" | "y">> = {
  "auth-service": { label: "Authentication", x: 395, y: 20 },
  "payment-service": { label: "Payments", x: 80, y: 165 },
  "kyc-service": { label: "KYC", x: 395, y: 165 },
  "customer-support": { label: "Customer Support", x: 710, y: 165 },
  "cashier-service": { label: "Cashier", x: 230, y: 310 },
  "player-registration": { label: "Player Registration", x: 560, y: 310 },
};

const statusRank: Record<ServiceState["status"], number> = { healthy: 0, degraded: 1, failed: 2 };

export function buildDependencyGraph(services: ServiceState[], rootCause?: string): { nodes: DependencyGraphNode[]; edges: DependencyGraphEdge[] } {
  const serviceById = new Map(services.map((service) => [service.id, service]));
  const nodes = services.flatMap((service) => {
    const position = positions[service.id];
    return position ? [{ id: service.id, status: service.status, rootCause: service.id === rootCause, ...position }] : [];
  });
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edges = services.flatMap((service) => service.dependencies.flatMap((dependencyId) => {
    const source = nodeById.get(dependencyId);
    const target = nodeById.get(service.id);
    if (!source || !target || !serviceById.has(dependencyId)) return [];
    const status = statusRank[source.status] > statusRank[target.status] ? source.status : target.status;
    return [{ id: `${dependencyId}:${service.id}`, source, target, status }];
  }));
  return { nodes, edges };
}
