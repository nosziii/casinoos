<script setup lang="ts">
import type { CasinoEvent } from "@casino-ops/shared";
defineProps<{ events: CasinoEvent[] }>();
const time = (timestamp: string) => new Date(timestamp).toLocaleTimeString("en-GB", { hour12: false });
</script>

<template>
  <section class="panel stream-panel">
    <header><span class="eyebrow">REAL-TIME TELEMETRY</span><h2>Live event stream</h2></header>
    <div class="stream" aria-live="polite">
      <div v-if="!events.length" class="empty">Waiting for simulation events…</div>
      <article v-for="event in [...events].reverse()" :key="event.id" class="event-row">
        <time>{{ time(event.timestamp) }}</time><span class="event-domain">{{ event.domain }}</span>
        <strong>{{ event.type.replaceAll("_", " ") }}</strong><i :class="`severity severity--${event.severity}`" />
      </article>
    </div>
  </section>
</template>

