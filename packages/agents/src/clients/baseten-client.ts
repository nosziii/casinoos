import OpenAI from "openai";
import type { AIClient, CompletionRequest } from "./ai-client.js";
import { parseStructuredJSON } from "./structured-json.js";

export interface BasetenClientOptions {
  apiKey: string;
  baseURL: string;
  model: string;
  timeoutMs?: number;
  logger?: (entry: ModelCallLog) => void;
}

export interface ModelCallLog {
  model: string;
  agent: string;
  timestamp: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export class BasetenClient implements AIClient {
  readonly #openai: OpenAI;
  readonly #options: BasetenClientOptions;

  constructor(options: BasetenClientOptions) {
    if (!options.apiKey) throw new Error("BASETEN_API_KEY is required in live mode");
    this.#options = options;
    this.#openai = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseURL,
      timeout: options.timeoutMs ?? 30_000,
      maxRetries: 0,
    });
  }

  async complete<T>(request: CompletionRequest<T>): Promise<T> {
    const startedAt = performance.now();
    try {
      const response = await this.#openai.chat.completions.create({
        model: this.#options.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userPrompt },
        ],
      }, { signal: request.signal });
      const content = response.choices[0]?.message.content;
      if (!content) throw new Error("Model returned no content");
      const result = request.schema.parse(parseStructuredJSON(content));
      this.#log(request.agent, startedAt, true, response.usage?.prompt_tokens, response.usage?.completion_tokens);
      return result;
    } catch (error) {
      this.#log(request.agent, startedAt, false, undefined, undefined, safeError(error));
      throw error;
    }
  }

  #log(agent: string, startedAt: number, success: boolean, inputTokens?: number, outputTokens?: number, error?: string): void {
    this.#options.logger?.({
      model: this.#options.model,
      agent,
      timestamp: new Date().toISOString(),
      ...(inputTokens === undefined ? {} : { inputTokens }),
      ...(outputTokens === undefined ? {} : { outputTokens }),
      latencyMs: Math.round(performance.now() - startedAt),
      success,
      ...(error === undefined ? {} : { error }),
    });
  }
}

function safeError(error: unknown): string {
  if (error && typeof error === "object" && "status" in error && typeof error.status === "number") {
    return `Provider request failed with status ${error.status}`;
  }
  if (error instanceof Error && error.name === "AbortError") return "Model request aborted";
  return "Model request failed";
}
