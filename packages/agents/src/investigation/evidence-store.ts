import { createHash } from "node:crypto";
import {
  investigationEvidenceSchema,
  type EvidenceProvenance,
  type InvestigationEvidence,
} from "@casino-os/shared";
import { redactSensitiveValues } from "../tools/redaction.js";

type EvidenceDraft = InvestigationEvidence extends infer T
  ? T extends InvestigationEvidence ? Omit<T, "id" | "provenance"> : never
  : never;

export class EvidenceStore {
  readonly #items = new Map<string, InvestigationEvidence>();

  add(draft: EvidenceDraft, provenance: EvidenceProvenance): InvestigationEvidence {
    const redactedDraft = redactSensitiveValues(draft);
    const payload = { ...redactedDraft as EvidenceDraft, provenance };
    const id = `ev_${createHash("sha256").update(canonicalJson(payload)).digest("hex").slice(0, 16)}`;
    const evidence = investigationEvidenceSchema.parse({ id, ...payload });
    this.#items.set(id, structuredClone(evidence));
    return immutableClone(evidence);
  }

  list(): InvestigationEvidence[] {
    return [...this.#items.values()].map(immutableClone);
  }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${canonicalJson(nested)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function immutableClone<T>(value: T): T {
  return deepFreeze(structuredClone(value));
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value)) deepFreeze(nested);
  return value;
}
