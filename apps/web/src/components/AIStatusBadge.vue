<script setup lang="ts">
import type { AIRuntimeStatus } from "@casino-ops/shared";
import { computed } from "vue";

const props = defineProps<{ status?: AIRuntimeStatus }>();
const label = computed(() => props.status?.effectiveMode === "live" ? "LIVE AI" : props.status?.effectiveMode === "fallback" ? "AI FALLBACK" : "DETERMINISTIC");
</script>

<template>
  <details class="ai-status" :class="`ai-status--${status?.effectiveMode ?? 'loading'}`" data-testid="ai-mode">
    <summary><i />{{ status ? label : 'AI STATUS' }}</summary>
    <div v-if="status" class="ai-status__details">
      <strong>{{ label }}</strong>
      <template v-if="status.effectiveMode === 'live'">
        <span>Specialists</span><b>{{ status.specialists.model }}</b><small>via {{ status.specialists.provider }}</small>
        <span>Casino Brain</span><b>{{ status.brain.model }}</b><small>via {{ status.brain.provider }}</small>
      </template>
      <p v-else-if="status.effectiveMode === 'fallback'">A live provider failed during this run. CasinoOps continued with deterministic responses using the same validated schemas.</p>
      <p v-else>Reliable public demo responses using the same schemas validated against live models.</p>
    </div>
  </details>
</template>
