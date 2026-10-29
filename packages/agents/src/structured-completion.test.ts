import { z } from "zod";
import { describe, expect, it } from "vitest";
import type { AIClient, CompletionRequest } from "./clients/ai-client.js";
import { completeWithRetry } from "./structured-completion.js";

describe("completeWithRetry", () => {
  it("adds an explicit schema-repair instruction to the retry", async () => {
    const prompts: string[] = [];
    const client: AIClient = {
      async complete<T>(request: CompletionRequest<T>): Promise<T> {
        prompts.push(request.systemPrompt);
        if (prompts.length === 1) throw new Error("Invalid structured response");
        return request.schema.parse({ result: "repaired" });
      },
    };

    const result = await completeWithRetry(client, {
      agent: "test-agent",
      systemPrompt: "Return JSON.",
      payload: { input: true },
      schema: z.object({ result: z.string() }),
    });

    expect(result).toEqual({ result: "repaired" });
    expect(prompts).toHaveLength(2);
    expect(prompts[1]).toContain("previous response failed schema validation");
    expect(prompts[1]).toContain("exact field names and JSON types");
  });
});
