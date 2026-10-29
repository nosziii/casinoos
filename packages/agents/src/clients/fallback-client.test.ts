import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import type { AIClient, CompletionRequest } from "./ai-client";
import { FallbackAIClient } from "./fallback-client";
import { RateLimitedAIClient } from "./rate-limited-client";

const request: CompletionRequest<{ answer: string }> = {
  agent: "test-agent",
  systemPrompt: "test",
  userPrompt: "{}",
  schema: z.object({ answer: z.string() }),
};

describe("FallbackAIClient", () => {
  it("uses the primary client without announcing fallback on success", async () => {
    const onFallback = vi.fn();
    const client = new FallbackAIClient(fixed({ answer: "live" }), fixed({ answer: "mock" }), "baseten", onFallback);

    await expect(client.complete(request)).resolves.toEqual({ answer: "live" });
    expect(onFallback).not.toHaveBeenCalled();
  });

  it("announces and returns the deterministic result after provider failure", async () => {
    const onFallback = vi.fn();
    const client = new FallbackAIClient(failing(), fixed({ answer: "mock" }), "meta", onFallback);

    await expect(client.complete(request)).resolves.toEqual({ answer: "mock" });
    expect(onFallback).toHaveBeenCalledWith({ provider: "meta", agent: "test-agent", reason: "unknown" });
  });

  it("recovers deterministically after a provider timeout abort", async () => {
    const onFallback = vi.fn();
    const client = new FallbackAIClient(failing(new Error("Request timed out")), fixed({ answer: "mock" }), "baseten", onFallback);

    await expect(client.complete(request)).resolves.toEqual({ answer: "mock" });
    expect(onFallback).toHaveBeenCalledWith({ provider: "baseten", agent: "test-agent", reason: "timeout" });
  });

  it("keeps fallback available after the live provider rate limit is exhausted", async () => {
    const onFallback = vi.fn();
    const live = new RateLimitedAIClient(failing(), 1);
    const client = new FallbackAIClient(live, fixed({ answer: "mock" }), "baseten", onFallback);

    await expect(client.complete(request)).resolves.toEqual({ answer: "mock" });
    await expect(client.complete(request)).resolves.toEqual({ answer: "mock" });
    expect(onFallback).toHaveBeenCalledTimes(2);
    expect(onFallback).toHaveBeenLastCalledWith({ provider: "baseten", agent: "test-agent", reason: "rate_limit" });
  });
});

function fixed<T>(value: T): AIClient {
  return { complete: async () => value } as AIClient;
}

function failing(error = new Error("provider unavailable")): AIClient {
  return { complete: async () => { throw error; } };
}
