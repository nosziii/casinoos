import type { ZodType } from "zod";
import type { AIClient } from "./clients/ai-client.js";

export interface StructuredCompletion<T> {
  agent: string;
  systemPrompt: string;
  payload: unknown;
  schema: ZodType<T>;
}

export async function completeWithRetry<T>(client: AIClient, input: StructuredCompletion<T>): Promise<T> {
  const request = {
    agent: input.agent,
    systemPrompt: input.systemPrompt,
    userPrompt: JSON.stringify(input.payload),
    schema: input.schema,
  };
  try {
    return await client.complete(request);
  } catch {
    return client.complete(request);
  }
}

