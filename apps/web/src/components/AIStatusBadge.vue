<script setup lang="ts">
import type { AIRuntimeStatus } from "@casino-ops/shared";
import { computed } from "vue";

const props = defineProps<{ status?: AIRuntimeStatus }>();
const label = computed(() => props.status?.effectiveMode === "live" ? "LIVE AI" : props.status?.effectiveMode === "fallback" ? "AI FALLBACK" : "DETERMINISTIC");
const reasonLabels: Record<NonNullable<AIRuntimeStatus["lastFailure"]>["reason"], string> = {
  authentication: "authentication rejected",
  rate_limit: "rate limit reached",
  timeout: "request timed out",
  network: "network connection failed",
  invalid_response: "response validation failed",
  provider_error: "provider error",
  unknown: "unknown provider error",
};
const agentLabels: Record<string, string> = {
  "infrastructure-agent": "infrastructure analysis",
  "infrastructure-investigator": "evidence investigation",
  "operations-agent": "operations analysis",
  "risk-agent": "risk analysis",
  "casino-brain": "Casino Brain correlation",
  "casino-brain-query": "Casino Brain query",
};
</script>

<template>
  <details class="ai-status" :class="`ai-status--${status?.effectiveMode ?? 'loading'}`" data-testid="ai-mode" data-tour="ai-status">
    <summary><i />{{ status ? label : 'AI STATUS' }}</summary>
    <div v-if="status" class="ai-status__details">
      <strong>{{ label }}</strong>
      <template v-if="status.effectiveMode === 'live'">
        <span>Specialists</span><b>{{ status.specialists.model }}</b><small>via {{ status.specialists.provider }}</small>
        <span>Casino Brain</span><b>{{ status.brain.model }}</b><small>via {{ status.brain.provider }}</small>
      </template>
      <p v-else-if="status.effectiveMode === 'fallback'">{{ status.lastFailure ? `${status.lastFailure.provider === 'baseten' ? 'Baseten' : 'Meta Model API'} ${agentLabels[status.lastFailure.agent] ?? status.lastFailure.agent}: ${reasonLabels[status.lastFailure.reason]}. ` : '' }}CasinoOps continued with deterministic responses using the same validated schemas.</p>
      <p v-else>Reliable public demo responses using the same schemas validated against live models.</p>
    </div>
  </details>
</template>
