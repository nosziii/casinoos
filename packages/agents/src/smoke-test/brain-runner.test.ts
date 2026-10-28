import { describe, expect, it } from "vitest";
import { MockAIClient } from "../clients/mock-client.js";
import { brainSmokeFixtures } from "./brain-fixtures.js";
import { runBrainSmokeSuite } from "./brain-runner.js";

describe("Casino Brain AI smoke suite", () => {
  it("passes auth, independent payment and healthy fixtures", async () => {
    const result = await runBrainSmokeSuite({
      client: new MockAIClient(),
      provider: "mock",
      model: "deterministic-mock",
      fixtures: brainSmokeFixtures,
    });

    expect(result.passed).toBe(true);
    expect(result.cases).toHaveLength(3);
  });
});
