import { describe, expect, it } from "vitest";
import { loadConfig } from "../config/env.js";
import { CasinoRuntime } from "./casino-runtime.js";

describe("CasinoRuntime live fallback", () => {
  it("completes a verified incident transparently when providers are unavailable", async () => {
    const statuses: string[] = [];
    const runtime = new CasinoRuntime(loadConfig({
      AI_MODE: "live",
      AI_ENABLED: "true",
      AI_FALLBACK_ENABLED: "true",
      BASETEN_API_KEY: "test-baseten-key",
      BASETEN_BASE_URL: "http://127.0.0.1:1/v1",
      BASETEN_MODEL: "meta-models/muse-spark-open-1026",
      META_MODEL_API_KEY: "test-meta-key",
      META_BASE_URL: "http://127.0.0.1:1/v1",
      META_MODEL: "muse-wonder-1.0",
      AGENT_FLUSH_INTERVAL_MS: "60000",
      CASINO_BRAIN_COOLDOWN_MS: "0",
    }), { onAIStatus: ({ effectiveMode }) => statuses.push(effectiveMode) });

    try {
      await runtime.simulator.advance();
      await runtime.simulator.advance();
      await runtime.simulator.advance();
      await runtime.flush();

      expect(runtime.aiStatus.effectiveMode).toBe("fallback");
      expect(runtime.aiStatus.lastFailure?.provider).toBe("baseten");
      expect(statuses).toContain("fallback");
      expect(runtime.incidents.at(-1)?.rootCause.service).toBe("auth-service");
      expect(runtime.agentTraces.some(({ stage, status }) => stage === "verification" && status === "success")).toBe(true);
    } finally {
      await runtime.close();
    }
  });
});
