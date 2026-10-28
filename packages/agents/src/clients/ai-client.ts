import type { ZodType } from "zod";

export interface CompletionRequest<T> {
  agent: string;
  systemPrompt: string;
  userPrompt: string;
  schema: ZodType<T>;
}

export interface AIClient {
  complete<T>(request: CompletionRequest<T>): Promise<T>;
}

