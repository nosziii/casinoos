import { BasetenClient, FallbackAIClient, MetaClient, MockAIClient, RateLimitedAIClient, type AIClient, type FallbackEvent, type ModelCallLog } from "@casino-ops/agents";
import type { AppConfig } from "../config/env.js";

export interface AgentClients {
  specialist: AIClient;
  brain: AIClient;
}

export function createAgentClients(config: AppConfig, onFallback: (event: FallbackEvent) => void = () => undefined): AgentClients {
  if (config.AI_MODE === "mock") {
    const mock = new MockAIClient();
    return { specialist: mock, brain: mock };
  }

  const logger = (provider: string) => (entry: ModelCallLog): void => {
    console.info(JSON.stringify({ type: "model.call", provider, ...entry }));
  };
  const mock = new MockAIClient();
  const specialist = new BasetenClient({
    apiKey: config.BASETEN_API_KEY,
    baseURL: config.BASETEN_BASE_URL,
    model: config.BASETEN_MODEL,
    logger: logger("baseten"),
  });
  const brain = new MetaClient({
    apiKey: config.META_MODEL_API_KEY,
    baseURL: config.META_BASE_URL,
    model: config.META_MODEL,
    logger: logger("meta"),
  });
  return {
    specialist: withOptionalFallback(new RateLimitedAIClient(specialist, config.MAX_AGENT_CALLS_PER_MINUTE), mock, "baseten", config.AI_FALLBACK_ENABLED, onFallback),
    brain: withOptionalFallback(new RateLimitedAIClient(brain, config.MAX_AGENT_CALLS_PER_MINUTE), mock, "meta", config.AI_FALLBACK_ENABLED, onFallback),
  };
}

function withOptionalFallback(primary: AIClient, fallback: AIClient, provider: FallbackEvent["provider"], enabled: boolean, onFallback: (event: FallbackEvent) => void): AIClient {
  return enabled ? new FallbackAIClient(primary, fallback, provider, onFallback) : primary;
}
