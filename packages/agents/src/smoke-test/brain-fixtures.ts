import type { CasinoBrainInput } from "../casino-brain.js";
import type { BrainSmokeFixture } from "./brain-types.js";

function input(
  rootCause: { service: string; confidence: number } | undefined,
  impact: { players: number; transactions: number; blockedValue: number },
  riskLevel: "low" | "high" | "critical",
): CasinoBrainInput {
  const incidentDetected = rootCause !== undefined;
  const affectedServices = rootCause?.service === "auth-service"
    ? ["payment-service", "kyc-service", "cashier-service"]
    : rootCause ? ["payment-service"] : [];
  return {
    infrastructureReport: {
      incidentDetected,
      confidence: rootCause?.confidence ?? 0.99,
      summary: incidentDetected ? `Validated degradation of ${rootCause.service}.` : "No infrastructure incident detected.",
      suspectedRootCauses: rootCause ? [rootCause] : [],
      affectedServices,
      severity: riskLevel,
    },
    operationsReport: {
      incidentDetected,
      affectedPlayers: impact.players,
      failedTransactions: impact.transactions,
      estimatedBlockedValue: impact.blockedValue,
      supportLoadIncrease: incidentDetected ? 0.35 : 0,
      summary: incidentDetected ? "Validated synthetic operational impact." : "No operational impact detected.",
    },
    riskReport: {
      riskLevel,
      financialExposure: impact.blockedValue,
      criticalSystems: rootCause ? [rootCause.service] : [],
      recommendedEscalation: riskLevel === "high" || riskLevel === "critical",
      summary: incidentDetected ? "Validated synthetic continuity risk." : "Risk is within normal tolerance.",
    },
    digitalTwinState: { phase: incidentDetected ? 2 : 0, services: [] },
  };
}

export const brainSmokeFixtures: BrainSmokeFixture[] = [
  {
    id: "correlate-auth-cascade",
    description: "Correlates consistent specialist evidence for an authentication cascade.",
    input: input({ service: "auth-service", confidence: 0.98 }, { players: 125, transactions: 18, blockedValue: 6300 }, "critical"),
    expected: { incidentDetected: true, rootCause: "auth-service" },
  },
  {
    id: "correlate-payment-provider",
    description: "Keeps an independent payment-provider incident separate from authentication.",
    input: input({ service: "payment-provider", confidence: 0.95 }, { players: 42, transactions: 18, blockedValue: 4100 }, "high"),
    expected: { incidentDetected: true, rootCause: "payment-provider", forbiddenRootCause: "auth-service" },
  },
  {
    id: "correlate-healthy-baseline",
    description: "Does not invent an incident when all specialist reports are healthy.",
    input: input(undefined, { players: 0, transactions: 0, blockedValue: 0 }, "low"),
    expected: { incidentDetected: false },
  },
];
