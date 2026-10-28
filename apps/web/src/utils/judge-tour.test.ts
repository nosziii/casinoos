import { describe, expect, it } from "vitest";
import { judgeTourSteps } from "./judge-tour";

describe("judge tour", () => {
  it("defines a unique target and readable explanation for every demo stage", () => {
    expect(judgeTourSteps).toHaveLength(6);
    expect(new Set(judgeTourSteps.map(({ target }) => target)).size).toBe(judgeTourSteps.length);
    expect(judgeTourSteps.every(({ title, description }) => title.length >= 10 && description.length >= 40)).toBe(true);
  });
});
