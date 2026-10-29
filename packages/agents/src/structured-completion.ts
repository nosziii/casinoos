import type { ZodType } from "zod";
import type { AIClient } from "./clients/ai-client.js";

export interface StructuredCompletion<T> {
  agent: string;
  systemPrompt: string;
  payload: unknown;
  schema: ZodType<T>;
  signal?: AbortSignal;
}

export async function completeWithRetry<T>(client: AIClient, input: StructuredCompletion<T>): Promise<T> {
  const request = {
    agent: input.agent,
    systemPrompt: input.systemPrompt,
    userPrompt: JSON.stringify(input.payload),
    schema: input.schema,
    ...(input.signal ? { signal: input.signal } : {}),
  };
  try {
    return await client.complete(request);
  } catch {
    if (input.signal?.aborted) throw input.signal.reason;
    return client.complete({
      ...request,
      systemPrompt: `${request.systemPrompt}\n\nYour previous response failed schema validation. Return only the requested JSON object with the exact field names and JSON types. Do not include markdown, reasoning, comments or additional fields.`,
    });
  }
}
