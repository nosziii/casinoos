import type { AIClient, CompletionRequest } from "./ai-client.js";

export interface FallbackEvent {
  provider: "baseten" | "meta";
  agent: string;
  reason: "authentication" | "rate_limit" | "timeout" | "network" | "invalid_response" | "provider_error" | "unknown";
}

export class FallbackAIClient implements AIClient {
  constructor(
    private readonly primary: AIClient,
    private readonly fallback: AIClient,
    private readonly provider: FallbackEvent["provider"],
    private readonly onFallback: (event: FallbackEvent) => void,
  ) {}

  async complete<T>(request: CompletionRequest<T>): Promise<T> {
    try {
      return await this.primary.complete(request);
    } catch (error) {
      this.onFallback({ provider: this.provider, agent: request.agent, reason: classifyFallback(error) });
      const fallbackRequest: CompletionRequest<T> = {
        agent: request.agent,
        systemPrompt: request.systemPrompt,
        userPrompt: request.userPrompt,
        schema: request.schema,
      };
      return this.fallback.complete(fallbackRequest);
    }
  }
}

function classifyFallback(error: unknown): FallbackEvent["reason"] {
  const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : undefined;
  const name = error instanceof Error ? error.name.toLowerCase() : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (status === 401 || status === 403) return "authentication";
  if (status === 429 || message.includes("rate limit")) return "rate_limit";
  if (name.includes("abort") || name.includes("timeout") || message.includes("timeout") || message.includes("timed out")) return "timeout";
  if (name.includes("connection") || message.includes("connection") || message.includes("fetch failed")) return "network";
  if (name.includes("zod") || name.includes("syntax") || message.includes("json") || message.includes("no content")) return "invalid_response";
  if (status !== undefined) return "provider_error";
  return "unknown";
}
