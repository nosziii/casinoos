<script setup lang="ts">
import type { CasinoIncident, ServiceState } from "@casino-ops/shared";
import { computed } from "vue";
const props = defineProps<{ incident?: CasinoIncident; services: ServiceState[]; evidenceCount: number }>();
const title = (id: string) => id.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const healthyCount = computed(() => props.services.filter(({ status }) => status === "healthy").length);
</script>

<template>
  <section class="panel brain-panel" :class="{ 'brain-panel--active': incident }">
    <header><div><span class="section-label">Casino Brain</span><h2>{{ incident ? 'Critical incident' : 'Monitoring operations' }}</h2></div><span class="brain-state">{{ incident ? 'VERIFIED' : 'LIVE' }}</span></header>
    <template v-if="incident">
      <h1>{{ incident.title }}</h1>
      <p>{{ incident.summary }}</p>
      <div class="brain-metrics"><div><strong data-testid="incident-confidence">{{ Math.round(incident.rootCause.confidence * 100) }}%</strong><span>confidence</span></div><div><strong>{{ incident.affectedSystems.length }}</strong><span>systems affected</span></div><div><strong>{{ evidenceCount }}</strong><span>evidence signals</span></div></div>
      <div class="root-cause"><span>Root cause</span><strong>{{ title(incident.rootCause.service) }}</strong><p>Multiple downstream failures share the same degraded authentication dependency.</p></div>
      <a class="text-action" href="#investigation">View investigation</a>
    </template>
    <div v-else class="brain-empty"><h1>No correlated incidents detected.</h1><p>CasinoOps is monitoring dependencies, service health and operational signals across six critical systems.</p><div class="brain-metrics"><div><strong>{{ healthyCount }}/{{ services.length || 6 }}</strong><span>systems healthy</span></div><div><strong>0</strong><span>active incidents</span></div><div><strong>Live</strong><span>continuous analysis</span></div></div></div>
  </section>
</template>
