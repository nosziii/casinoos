<script setup lang="ts">
import type { AIRuntimeStatus } from "@casino-ops/shared";

defineProps<{ status?: AIRuntimeStatus; busy: boolean }>();
defineEmits<{ retry: [] }>();
</script>

<template>
  <aside v-if="status?.effectiveMode === 'fallback'" class="provider-notice" role="status" data-testid="provider-fallback">
    <div><strong>Live AI temporarily unavailable</strong><p>The digital twin continued in transparent deterministic fallback mode. Reset the demo to retry the live providers.</p></div>
    <button class="button button--ghost" :disabled="busy" @click="$emit('retry')">Reset and retry live AI</button>
  </aside>
</template>
