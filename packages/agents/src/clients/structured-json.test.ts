import { describe, expect, it } from "vitest";
import { parseStructuredJSON } from "./structured-json.js";

describe("parseStructuredJSON", () => {
  it("parses a plain JSON response", () => {
    expect(parseStructuredJSON('{"incidentDetected":true}')).toEqual({ incidentDetected: true });
  });

  it("extracts JSON from a markdown code fence", () => {
    expect(parseStructuredJSON('```json\n{"incidentDetected":true}\n```')).toEqual({ incidentDetected: true });
  });

  it("extracts the final JSON object after provider reasoning text", () => {
    expect(parseStructuredJSON('Analysis complete.\n{"incidentDetected":true}')).toEqual({ incidentDetected: true });
  });

  it("rejects content without a JSON object", () => {
    expect(() => parseStructuredJSON("No structured answer")).toThrow(SyntaxError);
  });
});
