import {
  investigationEvidenceSchema,
  rootCauseClaimSchema,
  verificationResultSchema,
  type InvestigationEvidence,
  type RootCauseClaim,
  type VerificationCheck,
  type VerificationResult,
} from "@casino-ops/shared";

const WEIGHTS = { service_degradation: 0.35, dependency_match: 0.3, temporal_ordering: 0.2, evidence_minimum: 0.15 } as const;

export function verifyRootCause(rawClaim: RootCauseClaim, evidence: InvestigationEvidence[]): VerificationResult {
  const claim = rootCauseClaimSchema.parse(rawClaim);
  const validatedEvidence = investigationEvidenceSchema.array().parse(evidence);
  const checks = [
    checkServiceDegradation(claim, validatedEvidence),
    checkDependencies(claim, validatedEvidence),
    checkTemporalOrder(claim, validatedEvidence),
    checkEvidenceMinimum(validatedEvidence),
  ];
  const verificationScore = round(checks.reduce((total, check) => total + WEIGHTS[check.check] * check.score, 0));
  const requiredPassed = checks[0]?.passed === true && checks[1]?.passed === true;
  const minimumPassed = checks[3]?.passed === true;
  const status = !minimumPassed ? "insufficient_evidence" : requiredPassed && verificationScore >= 0.75 ? "verified" : "rejected";
  return verificationResultSchema.parse({
    status,
    verificationScore,
    finalConfidence: round(claim.modelConfidence * verificationScore),
    checks,
  });
}

function checkServiceDegradation(claim: RootCauseClaim, evidence: InvestigationEvidence[]): VerificationCheck {
  const matches = evidence.filter((item) =>
    (item.kind === "service_state" && item.data.service.id === claim.serviceId && item.data.service.status !== "healthy")
    || (item.kind === "event" && item.data.event.source === claim.serviceId && ["error", "critical"].includes(item.data.event.severity)));
  return result("service_degradation", matches.length > 0, matches, matches.length > 0
    ? "Suspected root service has degradation evidence."
    : "No degradation evidence exists for the suspected root service.");
}

function checkDependencies(claim: RootCauseClaim, evidence: InvestigationEvidence[]): VerificationCheck {
  const affected = new Set(claim.affectedServiceIds);
  const matches = evidence.filter((item) => item.kind === "dependency" && (
    (item.data.serviceId === claim.serviceId && item.data.relationship === "depended_on_by" && item.data.relatedServiceIds.some((id) => affected.has(id)))
    || (affected.has(item.data.serviceId) && item.data.relationship === "depends_on" && item.data.relatedServiceIds.includes(claim.serviceId))));
  return result("dependency_match", matches.length > 0, matches, matches.length > 0
    ? "At least one affected service has a confirmed dependency link to the root service."
    : "No dependency evidence connects the root service to an affected service.");
}

function checkTemporalOrder(claim: RootCauseClaim, evidence: InvestigationEvidence[]): VerificationCheck {
  const rootEvents = evidence.filter((item) => item.kind === "event" && item.data.event.source === claim.serviceId);
  const affected = new Set(claim.affectedServiceIds);
  const downstreamEvents = evidence.filter((item) => item.kind === "event" && affected.has(item.data.event.source));
  const ordered = rootEvents.some((root) => downstreamEvents.some((downstream) =>
    root.kind === "event" && downstream.kind === "event"
    && Date.parse(root.data.event.timestamp) <= Date.parse(downstream.data.event.timestamp)));
  return result("temporal_ordering", ordered, [...rootEvents, ...downstreamEvents], ordered
    ? "Root-service failure is not later than downstream impact."
    : "Event evidence does not establish root-before-impact ordering.");
}

function checkEvidenceMinimum(evidence: InvestigationEvidence[]): VerificationCheck {
  const uniqueEvidence = [...new Map(evidence.map((item) => [item.id, item])).values()];
  const kinds = new Set(uniqueEvidence.map(({ kind }) => kind));
  const passed = uniqueEvidence.length >= 3 && kinds.size >= 2;
  return result("evidence_minimum", passed, uniqueEvidence, passed
    ? "At least three evidence items from two evidence kinds are present."
    : "At least three evidence items from two evidence kinds are required.");
}

function result(check: VerificationCheck["check"], passed: boolean, evidence: InvestigationEvidence[], explanation: string): VerificationCheck {
  return { check, passed, score: passed ? 1 : 0, explanation, evidenceIds: [...new Set(evidence.map(({ id }) => id))] };
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
