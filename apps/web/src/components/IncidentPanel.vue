<script setup lang="ts">
import type { CasinoIncident } from "@casino-os/shared";
defineProps<{ incident?: CasinoIncident }>();
const title = (id: string) => id.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
</script>

<template>
  <section class="panel brain-panel" :class="{ 'brain-panel--active': incident }">
    <header><span class="eyebrow">CASINO BRAIN</span><span class="brain-state">{{ incident ? 'CORRELATED INCIDENT' : 'MONITORING' }}</span></header>
    <template v-if="incident">
      <h1>{{ incident.title }}</h1>
      <p>{{ incident.summary }}</p>
      <div class="confidence"><span>Root-cause confidence</span><strong>{{ Math.round(incident.rootCause.confidence * 100) }}%</strong><div><i :style="{ width: `${incident.rootCause.confidence * 100}%` }" /></div></div>
      <div class="brain-details"><div><small>PROBABLE ROOT CAUSE</small><strong>{{ title(incident.rootCause.service) }}</strong></div><div><small>AFFECTED SYSTEMS</small><span class="tags"><b v-for="service in incident.affectedSystems" :key="service">{{ title(service) }}</b></span></div></div>
    </template>
    <div v-else class="brain-empty"><div class="radar" /><h1>All systems operational</h1><p>Start the cascade scenario to observe multi-system correlation.</p></div>
  </section>
</template>
