import type { AIClient, CompletionRequest } from "./ai-client.js";

export class RateLimitedAIClient implements AIClient {
  readonly #client: AIClient;
  readonly #maxCallsPerMinute: number;
  readonly #calls: number[] = [];

  constructor(client: AIClient, maxCallsPerMinute: number) {
    if (!Number.isInteger(maxCallsPerMinute) || maxCallsPerMinute < 1) {
      throw new Error("maxCallsPerMinute must be a positive integer");
    }
    this.#client = client;
    this.#maxCallsPerMinute = maxCallsPerMinute;
  }

  async complete<T>(request: CompletionRequest<T>): Promise<T> {
    const cutoff = Date.now() - 60_000;
    while (this.#calls[0] !== undefined && this.#calls[0] < cutoff) this.#calls.shift();
    if (this.#calls.length >= this.#maxCallsPerMinute) {
      throw new Error("AI call rate limit exceeded");
    }
    this.#calls.push(Date.now());
    return this.#client.complete(request);
  }
}

