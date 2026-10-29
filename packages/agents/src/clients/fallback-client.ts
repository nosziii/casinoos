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
      const reason = classifyFallback(error);
      if (reason === "invalid_response") {
        try {
          return await this.primary.complete({
            ...request,
            systemPrompt: `${request.systemPrompt}\nYour previous response failed strict application validation. Return exactly one complete JSON object matching the requested shape. Do not include markdown, commentary, omitted fields or additional properties.`,
          });
        } catch (retryError) {
          return this.completeWithFallback(request, classifyFallback(retryError));
        }
      }
      return this.completeWithFallback(request, reason);
    }
  }

  private completeWithFallback<T>(request: CompletionRequest<T>, reason: FallbackEvent["reason"]): Promise<T> {
    this.onFallback({ provider: this.provider, agent: request.agent, reason });
    return this.fallback.complete({
      agent: request.agent,
      systemPrompt: request.systemPrompt,
      userPrompt: request.userPrompt,
      schema: request.schema,
    });
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
