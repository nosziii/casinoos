import { describe, expect, it } from "vitest";
import { guidedDemoContent } from "./guided-demo-content";

describe("guided demo content", () => {
  it("provides judge-facing copy for every state", () => {
    expect(Object.keys(guidedDemoContent)).toEqual(["ready", "preparing", "investigating", "forecasting", "comparing", "awaiting_approval", "recovering", "completed", "error"]);
    expect(Object.values(guidedDemoContent).every(({ title, description }) => title.length > 0 && description.length > 0)).toBe(true);
  });
});
