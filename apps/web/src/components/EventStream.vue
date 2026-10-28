<script setup lang="ts">
import type { CasinoEvent } from "@casino-ops/shared";
defineProps<{ events: CasinoEvent[] }>();
const time = (timestamp: string) => new Date(timestamp).toLocaleTimeString("en-GB", { hour12: false });
</script>

<template>
  <section class="panel stream-panel">
    <header><div><span class="section-label">Operational signals</span><h2>Live events</h2><p>Recent changes from connected casino systems.</p></div></header>
    <div class="stream" aria-live="polite">
      <div v-if="!events.length" class="empty">Waiting for simulation events…</div>
      <article v-for="event in [...events].reverse()" :key="event.id" class="event-row">
        <time>{{ time(event.timestamp) }}</time><span class="event-domain">{{ event.domain }}</span>
        <strong>{{ event.type.replaceAll("_", " ") }}</strong><i :class="`severity severity--${event.severity}`" />
      </article>
    </div>
  </section>
</template>
