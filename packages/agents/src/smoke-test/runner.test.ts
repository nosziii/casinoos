import { describe, expect, it } from "vitest";
import { MockAIClient } from "../clients/mock-client.js";
import { infrastructureSmokeFixtures } from "./fixtures.js";
import { runInfrastructureSmokeSuite } from "./runner.js";

describe("Infrastructure AI smoke suite", () => {
  it("passes auth, independent payment and healthy fixtures", async () => {
    const result = await runInfrastructureSmokeSuite({
      client: new MockAIClient(),
      provider: "mock",
      model: "deterministic-mock",
      fixtures: infrastructureSmokeFixtures,
    });

    expect(result.passed).toBe(true);
    expect(result.cases).toHaveLength(3);
    expect(result.cases.every(({ passed }) => passed)).toBe(true);
  });
});
