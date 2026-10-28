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
    return output.service ? [store.add({ kind: "service_state", summary: `Current state of ${output.service.id}.`, data: { service: output.service } }, provenance)] : [];
  }
  if (result.toolName === "getDependencies" || result.toolName === "getDependents") {
    const output = relatedResult.parse(result.output);
    return [store.add({
      kind: "dependency",
      summary: `${result.toolName} relationship for ${output.serviceId}.`,
      data: {
        serviceId: output.serviceId,
        relationship: result.toolName === "getDependencies" ? "depends_on" : "depended_on_by",
        relatedServiceIds: output.services.map(({ id }) => id),
      },
    }, provenance)];
  }
  const output = eventsResult.parse(result.output);
  return output.events.map((event) => store.add({ kind: "event", summary: `${event.type} from ${event.source}.`, data: { event } }, provenance));
}
