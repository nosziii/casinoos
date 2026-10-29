<script setup lang="ts">
import type { AIRuntimeStatus } from "@casino-ops/shared";
import { computed } from "vue";

const props = defineProps<{ status?: AIRuntimeStatus; busy: boolean }>();
defineEmits<{ retry: [] }>();
const reason = computed(() => {
  const failure = props.status?.lastFailure;
  if (!failure) return "A live provider request failed.";
  const provider = failure.provider === "baseten" ? "Baseten" : "Meta Model API";
  const agents: Record<string, string> = {
    "infrastructure-agent": "infrastructure analysis",
    "infrastructure-investigator": "evidence investigation",
    "operations-agent": "operations analysis",
    "risk-agent": "risk analysis",
    "casino-brain": "Casino Brain correlation",
    "casino-brain-query": "Casino Brain query",
  };
  const labels: Record<typeof failure.reason, string> = {
    authentication: "rejected authentication",
    rate_limit: "reached its rate limit",
    timeout: "timed out",
    network: "could not be reached",
    invalid_response: "returned a response that failed validation",
    provider_error: "returned a provider error",
    unknown: "returned an unknown error",
  };
  return `${provider} ${agents[failure.agent] ?? failure.agent} ${labels[failure.reason]}.`;
});
</script>

<template>
  <aside v-if="status?.effectiveMode === 'fallback'" class="provider-notice" role="status" data-testid="provider-fallback">
    <div><strong>Live AI temporarily unavailable</strong><p>{{ reason }} The digital twin continued in transparent deterministic fallback mode. Reset the demo to retry the live providers.</p></div>
    <button class="button button--ghost" :disabled="busy" @click="$emit('retry')">Reset and retry live AI</button>
  </aside>
</template>
