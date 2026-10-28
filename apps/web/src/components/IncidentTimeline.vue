<script setup lang="ts">
import type { CasinoEvent } from "@casino-ops/shared";
import { computed } from "vue";

const props = defineProps<{ events: CasinoEvent[] }>();
const timeline = computed(() => props.events.filter((event) => event.severity !== "info" || event.type.includes("MITIGATION") || event.type.includes("COMPLETED")).slice(-16));
const time = (timestamp: string) => new Date(timestamp).toLocaleTimeString("en-GB", { hour12: false });
const label = (type: string) => type.replaceAll("_", " ");
</script>

<template>
  <section class="panel timeline-panel">
    <header><div><span class="section-label">Sequence of events</span><h2>Incident timeline</h2></div></header>
    <div v-if="!timeline.length" class="empty">Timeline events appear when the scenario starts.</div>
    <div v-else class="timeline-track">
      <article v-for="event in timeline" :key="event.id" :class="`timeline-item timeline-item--${event.severity}`">
        <time>{{ time(event.timestamp) }}</time><i /><div><small>{{ event.source }}</small><strong>{{ label(event.type) }}</strong></div>
      </article>
    </div>
  </section>
</template>
