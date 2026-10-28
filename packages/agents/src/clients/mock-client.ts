import {
  casinoIncidentSchema,
  infrastructureReportSchema,
  operationsReportSchema,
  riskReportSchema,
} from "@casino-os/shared";
import type { AIClient, CompletionRequest } from "./ai-client.js";

interface MockEvent {
  source?: string;
  type?: string;
  severity?: string;
  data?: Record<string, unknown>;
}

export class MockAIClient implements AIClient {
  async complete<T>(request: CompletionRequest<T>): Promise<T> {
    const payload = JSON.parse(request.userPrompt) as Record<string, unknown>;
    const result = request.agent === "infrastructure-agent"
      ? infrastructure(payload)
      : request.agent === "operations-agent"
        ? operations(payload)
        : request.agent === "risk-agent"
          ? risk(payload)
          : request.agent === "casino-brain"
            ? casinoBrain(payload)
            : undefined;
    if (!result) throw new Error(`Unsupported mock agent: ${request.agent}`);
    return request.schema.parse(result);
  }
}

function infrastructure(payload: Record<string, unknown>): unknown {
  const events = getEvents(payload);
  const authFailure = events.some(isAuthRelated);
  const paymentProviderFailure = events.some(isPaymentProviderRelated);
  const incidentDetected = authFailure || paymentProviderFailure;
  const rootCause = authFailure ? "auth-service" : paymentProviderFailure ? "payment-provider" : undefined;
  const affectedServices = unique(events
    .filter((event) => event.source && event.source !== rootCause && (
      authFailure ? isAuthRelated(event) : isPaymentProviderRelated(event)
    ))
    .map((event) => event.source as string));
  return infrastructureReportSchema.parse({
    incidentDetected,
    confidence: authFailure ? 0.94 : paymentProviderFailure ? 0.9 : 0.2,
    summary: authFailure
      ? "Correlated authentication failures affect services sharing auth-service."
      : paymentProviderFailure
        ? "Payment failures correlate with degradation of the external payment provider."
        : "No correlated infrastructure incident detected.",
    suspectedRootCauses: rootCause ? [{ service: rootCause, confidence: authFailure ? 0.94 : 0.9 }] : [],
    affectedServices,
    severity: authFailure && affectedServices.length >= 3 ? "critical" : incidentDetected ? "high" : "low",
  });
}

function operations(payload: Record<string, unknown>): unknown {
  const events = getEvents(payload);
  const affectedPlayers = sumData(events, "affectedPlayers") + events.filter(isAuthRelated).length * 5;
  const failedTransactions = sumData(events, "failedTransactions") + events.filter((event) => event.type?.includes("TIMEOUT")).length;
  const blockedValue = sumData(events, "blockedValueEur") || failedTransactions * 350;
  const supportIncrease = Math.max(0, ...events.map((event) => numberData(event, "increaseRatio")));
  const detected = affectedPlayers > 0 || failedTransactions > 0 || supportIncrease > 0;
  return operationsReportSchema.parse({
    incidentDetected: detected,
    affectedPlayers,
    failedTransactions,
    estimatedBlockedValue: blockedValue,
    supportLoadIncrease: supportIncrease,
    summary: detected ? "Authentication failures are disrupting player journeys and transactions." : "No material operational impact detected.",
  });
}

function risk(payload: Record<string, unknown>): unknown {
  const events = getEvents(payload);
  const criticalSystems = unique(events
    .filter((event) => event.severity === "critical" || isAuthRelated(event))
    .map((event) => event.source)
    .filter((source): source is string => Boolean(source)));
  const critical = criticalSystems.length >= 3;
  const high = criticalSystems.length > 0;
  return riskReportSchema.parse({
    riskLevel: critical ? "critical" : high ? "high" : "low",
    financialExposure: sumData(events, "blockedValueEur") || (high ? criticalSystems.length * 3100 : 0),
    criticalSystems,
    recommendedEscalation: high,
    summary: high ? "Shared authentication dependency creates elevated business-continuity risk." : "Risk remains within normal operating tolerance.",
  });
}

function casinoBrain(payload: Record<string, unknown>): unknown {
  const infrastructureReport = payload.infrastructureReport as {
    affectedServices: string[]; suspectedRootCauses: Array<{ service: string; confidence: number }>;
  };
  const operationsReport = payload.operationsReport as { affectedPlayers: number; estimatedBlockedValue: number };
  const riskReport = payload.riskReport as { riskLevel: "low" | "medium" | "high" | "critical" };
  const rootCause = infrastructureReport.suspectedRootCauses[0] ?? { service: "unknown", confidence: 0 };
  const incidentDetected = rootCause.service !== "unknown";
  const isAuthIncident = rootCause.service === "auth-service";
  return casinoIncidentSchema.parse({
    incidentId: "INC-001",
    incidentDetected,
    severity: riskReport.riskLevel,
    title: incidentDetected ? `${displayName(rootCause.service)} Incident` : "No Active Incident",
    summary: incidentDetected
      ? `Specialist reports correlate the operational impact with ${rootCause.service}.`
      : "Specialist reports and digital-twin state show no active incident.",
    rootCause,
    affectedSystems: infrastructureReport.affectedServices,
    recommendedActions: incidentDetected
      ? [
          `Simulate mitigation for ${rootCause.service} in the digital twin`,
          isAuthIncident ? "Queue new KYC requests in the digital twin" : "Monitor synthetic payment recovery",
          "Notify synthetic casino operations",
        ]
      : ["Continue synthetic monitoring"],
    operationalImpact: {
      affectedPlayers: operationsReport.affectedPlayers,
      estimatedBlockedValue: operationsReport.estimatedBlockedValue,
      riskLevel: riskReport.riskLevel,
    },
  });
}

function displayName(service: string): string {
  return service.split("-").map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(" ");
}

function getEvents(payload: Record<string, unknown>): MockEvent[] {
  return Array.isArray(payload.events) ? payload.events as MockEvent[] : [];
}

function numberData(event: MockEvent, key: string): number {
  const value = event.data?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isAuthRelated(event: MockEvent): boolean {
  const failure = isFailureEvent(event);
  return failure && (
    event.source === "auth-service"
    || Boolean(event.type?.includes("AUTH"))
    || event.data?.dependency === "auth-service"
  );
}

function isPaymentProviderRelated(event: MockEvent): boolean {
  const failure = isFailureEvent(event);
  return failure && (
    event.source === "payment-provider"
    || Boolean(event.type?.includes("PAYMENT_PROVIDER"))
    || event.data?.dependency === "payment-provider"
  );
}

function isFailureEvent(event: MockEvent): boolean {
  return event.severity === "error" || event.severity === "critical" || Boolean(
    event.type && /(FAILED|FAILURE|TIMEOUT|CRITICAL|DEGRADED|LATENCY_HIGH)/.test(event.type),
  );
}

function sumData(events: MockEvent[], key: string): number {
  return events.reduce((total, event) => total + numberData(event, key), 0);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
