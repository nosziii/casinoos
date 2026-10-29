import type { AIClient, CompletionRequest } from "./ai-client.js";

export interface FallbackEvent {
  provider: "baseten" | "meta";
  agent: string;
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
    } catch {
      this.onFallback({ provider: this.provider, agent: request.agent });
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
