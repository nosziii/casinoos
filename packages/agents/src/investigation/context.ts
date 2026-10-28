import {
  investigationContextSchema,
  type InvestigationContext,
} from "@casino-os/shared";

export interface CreateInvestigationInput {
  id: string;
  rootCauseService: string;
  statement: string;
  timestamp: string;
}

export function createInvestigationContext(input: CreateInvestigationInput): InvestigationContext {
  return investigationContextSchema.parse({
    id: input.id,
    hypothesis: { rootCauseService: input.rootCauseService, statement: input.statement },
    checklist: [
      { id: "confirm-degradation", description: "Confirm degradation of the suspected root service", status: "pending" },
      { id: "confirm-dependencies", description: "Confirm dependency links to affected services", status: "pending" },
      { id: "confirm-timeline", description: "Confirm root-cause events precede downstream impact", status: "pending" },
      { id: "verify-evidence", description: "Run deterministic evidence verification", status: "pending" },
    ],
    evidence: [],
    toolCalls: [],
    turn: 0,
    status: "planned",
    createdAt: input.timestamp,
    updatedAt: input.timestamp,
  });
}
