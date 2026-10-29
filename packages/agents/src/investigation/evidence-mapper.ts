import { casinoEventSchema, serviceStateSchema, type EvidenceProvenance, type InvestigationEvidence } from "@casino-ops/shared";
import { z } from "zod";
import type { AgentToolResult } from "../tools/types.js";
import { EvidenceStore } from "./evidence-store.js";

const serviceResult = z.object({ found: z.boolean(), service: serviceStateSchema.nullable() });
const relatedResult = z.object({ serviceId: z.string(), services: z.array(serviceStateSchema) });
const eventsResult = z.object({ events: z.array(casinoEventSchema), totalMatched: z.number(), truncated: z.boolean() });

export function mapToolResultToEvidence(
  result: AgentToolResult,
  provenance: EvidenceProvenance,
  store: EvidenceStore,
): InvestigationEvidence[] {
  if (result.toolName === "getServiceState") {
    const output = serviceResult.parse(result.output);
    return output.service ? [store.add({
      kind: "service_state",
      summary: `${displayName(output.service.id)} is ${output.service.status}: ${output.service.latencyMs} ms latency and ${Math.round(output.service.errorRate * 100)}% errors.`,
      data: { service: output.service },
    }, provenance)] : [];
  }
  if (result.toolName === "getDependencies" || result.toolName === "getDependents") {
    const output = relatedResult.parse(result.output);
    return [store.add({
      kind: "dependency",
      summary: output.services.length
        ? `${displayName(output.serviceId)} is connected to ${output.services.map(({ id }) => displayName(id)).join(", ")}.`
        : `${displayName(output.serviceId)} has no services in this dependency direction.`,
      data: {
        serviceId: output.serviceId,
        relationship: result.toolName === "getDependencies" ? "depends_on" : "depended_on_by",
        relatedServiceIds: output.services.map(({ id }) => id),
      },
    }, provenance)];
  }
  const output = eventsResult.parse(result.output);
  return output.events.map((event) => store.add({ kind: "event", summary: `${displayName(event.source)} reported ${displayName(event.type)} at ${new Date(event.timestamp).toLocaleTimeString("en-GB")}.`, data: { event } }, provenance));
}

function displayName(value: string): string {
  return value.toLowerCase().split(/[-_]/).map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(" ");
}
