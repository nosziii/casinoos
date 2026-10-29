<script setup lang="ts">
import type { CasinoIncident, ServiceState } from "@casino-ops/shared";
import { computed } from "vue";
const props = defineProps<{ incident?: CasinoIncident; services: ServiceState[]; evidenceCount: number }>();
const title = (id: string) => id.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const healthyCount = computed(() => props.services.filter(({ status }) => status === "healthy").length);
const analysisPending = computed(() => !props.incident && props.services.some(({ status }) => status !== "healthy"));
</script>

<template>
  <section class="panel brain-panel" data-tour="casino-brain" :class="{ 'brain-panel--active': incident, 'brain-panel--pending': analysisPending }" aria-live="polite">
    <header><div><span class="section-label">Casino Brain</span><h2>{{ incident ? 'Critical incident' : analysisPending ? 'Incident analysis' : 'Monitoring operations' }}</h2></div><span class="brain-state" :class="{ 'brain-state--analyzing': analysisPending }">{{ incident ? 'VERIFIED' : analysisPending ? 'ANALYZING' : 'LIVE' }}</span></header>
    <template v-if="incident">
      <h1>{{ incident.title }}</h1>
      <p>{{ incident.summary }}</p>
      <div class="brain-metrics"><div><strong data-testid="incident-confidence">{{ Math.round(incident.rootCause.confidence * 100) }}%</strong><span>confidence</span></div><div><strong>{{ incident.affectedSystems.length }}</strong><span>systems affected</span></div><div><strong>{{ evidenceCount }}</strong><span>evidence signals</span></div></div>
      <div class="root-cause"><span>Root cause</span><strong>{{ title(incident.rootCause.service) }}</strong><p>Multiple downstream failures share the same degraded authentication dependency.</p></div>
      <a class="text-action" href="#investigation">View investigation</a>
    </template>
    <div v-else-if="analysisPending" class="brain-empty"><h1>Correlating incident evidence…</h1><p>The cascade is visible. Specialist agents are validating the shared dependency, operational impact and risk before Casino Brain publishes a verified conclusion.</p><div class="brain-metrics"><div><strong>{{ healthyCount }}/{{ services.length || 6 }}</strong><span>systems healthy</span></div><div><strong>{{ evidenceCount }}</strong><span>evidence signals</span></div><div><strong>Live</strong><span>analysis in progress</span></div></div></div>
    <div v-else class="brain-empty"><h1>No correlated incidents detected.</h1><p>CasinoOps is monitoring dependencies, service health and operational signals across six critical systems.</p><div class="brain-metrics"><div><strong>{{ healthyCount }}/{{ services.length || 6 }}</strong><span>systems healthy</span></div><div><strong>0</strong><span>active incidents</span></div><div><strong>Live</strong><span>continuous analysis</span></div></div></div>
  </section>
</template>
