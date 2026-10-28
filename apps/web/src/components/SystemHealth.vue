<script setup lang="ts">
import type { ServiceState } from "@casino-os/shared";
import StatusPill from "./StatusPill.vue";

defineProps<{ services: ServiceState[] }>();
const tone = (status: ServiceState["status"]) => status === "healthy" ? "ok" : status === "degraded" ? "warn" : "danger";
const title = (id: string) => id.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
</script>

<template>
  <section class="panel health-panel">
    <header><span class="eyebrow">DIGITAL TWIN</span><h2>System health</h2></header>
    <div class="service-grid">
      <article v-for="service in services" :key="service.id" class="service" :class="`service--${service.status}`">
        <div><strong>{{ title(service.id) }}</strong><small>{{ service.latencyMs }} ms · {{ Math.round(service.errorRate * 100) }}% errors</small></div>
        <StatusPill :label="service.status" :tone="tone(service.status)" />
      </article>
    </div>
  </section>
</template>

