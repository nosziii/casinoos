import { BasetenClient, MetaClient, MockAIClient, RateLimitedAIClient, type AIClient, type ModelCallLog } from "@casino-os/agents";
import type { AppConfig } from "../config/env.js";

export interface AgentClients {
  specialist: AIClient;
  brain: AIClient;
}

export function createAgentClients(config: AppConfig): AgentClients {
  if (config.AI_MODE === "mock") {
    const mock = new MockAIClient();
    return {
      specialist: new RateLimitedAIClient(mock, config.MAX_AGENT_CALLS_PER_MINUTE),
      brain: new RateLimitedAIClient(mock, config.MAX_AGENT_CALLS_PER_MINUTE),
    };
  }

  const logger = (provider: string) => (entry: ModelCallLog): void => {
    console.info(JSON.stringify({ type: "model.call", provider, ...entry }));
  };
  return {
    specialist: new RateLimitedAIClient(new BasetenClient({
      apiKey: config.BASETEN_API_KEY,
      baseURL: config.BASETEN_BASE_URL,
      model: config.BASETEN_MODEL,
      logger: logger("baseten"),
    }), config.MAX_AGENT_CALLS_PER_MINUTE),
    brain: new RateLimitedAIClient(new MetaClient({
      apiKey: config.META_MODEL_API_KEY,
      baseURL: config.META_BASE_URL,
      model: config.META_MODEL,
      logger: logger("meta"),
    }), config.MAX_AGENT_CALLS_PER_MINUTE),
  };
}
