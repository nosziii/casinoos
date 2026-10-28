import { mitigationComparisonSchema, type MitigationAction, type MitigationComparison } from "@casino-os/shared";
import { predictOutage } from "./prediction-engine.js";

interface StrategyDefinition {
  action: MitigationAction;
  title: string;
  estimatedRecovery: number;
  risk: "low" | "medium" | "high";
  operationalImpact: "low" | "medium" | "high";
  recoveryTimeMinutes: number;
  blockedValueFactor: number;
}

const STRATEGIES: readonly StrategyDefinition[] = [
  { action: "restart_service", title: "Restart authentication service", estimatedRecovery: 0.48, risk: "medium", operationalImpact: "medium", recoveryTimeMinutes: 12, blockedValueFactor: 0.55 },
  { action: "failover_service", title: "Fail over to secondary authentication service", estimatedRecovery: 0.91, risk: "low", operationalImpact: "low", recoveryTimeMinutes: 4, blockedValueFactor: 0.18 },
  { action: "disable_feature", title: "Disable deposits temporarily", estimatedRecovery: 0.99, risk: "low", operationalImpact: "high", recoveryTimeMinutes: 1, blockedValueFactor: 0.08 },
  { action: "queue_requests", title: "Queue authentication-dependent requests", estimatedRecovery: 0.76, risk: "medium", operationalImpact: "low", recoveryTimeMinutes: 3, blockedValueFactor: 0.32 },
  { action: "reduce_load", title: "Reduce non-critical authentication load", estimatedRecovery: 0.67, risk: "medium", operationalImpact: "medium", recoveryTimeMinutes: 8, blockedValueFactor: 0.44 },
];

export function compareMitigations(durationMinutes: number): MitigationComparison {
  const baseline = predictOutage(durationMinutes);
  const ranked = STRATEGIES.map((strategy) => ({
    ...strategy,
    projectedBlockedValue: Math.round(baseline.estimatedBlockedValue * strategy.blockedValueFactor),
    score: score(strategy),
  })).sort((left, right) => right.score - left.score);
  const recommendedAction = ranked[0]?.action;
  if (!recommendedAction) throw new Error("No mitigation strategies configured");
  return mitigationComparisonSchema.parse({
    durationMinutes,
    baseline,
    recommendedAction,
    strategies: ranked.map((strategy) => ({ ...strategy, recommended: strategy.action === recommendedAction })),
  });
}

function score(strategy: StrategyDefinition): number {
  const riskPenalty = { low: 5, medium: 15, high: 30 }[strategy.risk];
  const impactPenalty = { low: 5, medium: 15, high: 35 }[strategy.operationalImpact];
  return Math.round(strategy.estimatedRecovery * 100 - riskPenalty - impactPenalty - strategy.recoveryTimeMinutes);
}

