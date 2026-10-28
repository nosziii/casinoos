import {
  casinoDomainSchema,
  casinoEventSchema,
  serviceStateSchema,
  type CasinoEvent,
  type ServiceState,
} from "@casino-os/shared";
import { z } from "zod";
import { AgentToolRegistry, type AgentToolRegistryOptions } from "./registry.js";

export interface AgentToolDataSource {
  getServices(): ServiceState[];
  getEvents(): CasinoEvent[];
}

const serviceInputSchema = z.object({ serviceId: z.string().min(1).max(100) }).strict();
const serviceResultSchema = z.object({ found: z.boolean(), service: serviceStateSchema.nullable() });
const relatedServicesResultSchema = z.object({ serviceId: z.string(), services: z.array(serviceStateSchema) });
const recentEventsInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  source: z.string().min(1).max(100).optional(),
  domain: casinoDomainSchema.optional(),
}).strict();
const recentEventsResultSchema = z.object({
  events: z.array(casinoEventSchema),
  totalMatched: z.number().int().nonnegative(),
  truncated: z.boolean(),
});

export function createReadOnlyAgentTools(
  source: AgentToolDataSource,
  options: AgentToolRegistryOptions = {},
): AgentToolRegistry {
  const registry = new AgentToolRegistry(options);
  registry.register({
    name: "getServiceState",
    description: "Read one synthetic casino service. Input: {serviceId: string}.",
    inputSchema: serviceInputSchema,
    outputSchema: serviceResultSchema,
    execute: ({ serviceId }) => {
      const service = source.getServices().find(({ id }) => id === serviceId);
      return { found: service !== undefined, service: service ?? null };
    },
  });
  registry.register({
    name: "getDependencies",
    description: "Read direct dependencies. Input: {serviceId: string}.",
    inputSchema: serviceInputSchema,
    outputSchema: relatedServicesResultSchema,
    execute: ({ serviceId }) => {
      const services = source.getServices();
      const dependencyIds = new Set(services.find(({ id }) => id === serviceId)?.dependencies ?? []);
      return { serviceId, services: services.filter(({ id }) => dependencyIds.has(id)) };
    },
  });
  registry.register({
    name: "getDependents",
    description: "Read direct dependents. Input: {serviceId: string}.",
    inputSchema: serviceInputSchema,
    outputSchema: relatedServicesResultSchema,
    execute: ({ serviceId }) => ({
      serviceId,
      services: source.getServices().filter(({ dependencies }) => dependencies.includes(serviceId)),
    }),
  });
  registry.register({
    name: "getRecentEvents",
    description: "Read newest-first events. Input: {limit: 1..50, source?: string, domain?: casino domain}.",
    inputSchema: recentEventsInputSchema,
    outputSchema: recentEventsResultSchema,
    execute: ({ limit, source: eventSource, domain }) => {
      const matched = source.getEvents().filter((event) =>
        (eventSource === undefined || event.source === eventSource)
        && (domain === undefined || event.domain === domain));
      return { events: matched.slice(-limit).reverse(), totalMatched: matched.length, truncated: matched.length > limit };
    },
  });
  return registry;
}
