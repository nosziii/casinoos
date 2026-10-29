<script setup lang="ts">
import type { ServiceState } from "@casino-ops/shared";
import StatusPill from "./StatusPill.vue";

defineProps<{ services: ServiceState[] }>();
const tone = (status: ServiceState["status"]) => status === "healthy" ? "ok" : status === "degraded" ? "warn" : "danger";
const names: Record<string, string> = { "auth-service": "Authentication", "payment-service": "Payments", "kyc-service": "KYC", "cashier-service": "Cashier", "player-registration": "Player Registration", "customer-support": "Customer Support" };
const title = (id: string) => names[id] ?? id.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
</script>

<template>
  <section class="panel health-panel" data-tour="system-health">
    <header><div><span class="section-label">Live operations</span><h2>System health</h2><p>Real-time status across critical casino operations.</p></div></header>
    <div class="service-grid">
      <article v-for="service in services" :key="service.id" class="service" :class="`service--${service.status}`">
        <div><strong>{{ title(service.id) }}</strong><small>{{ service.latencyMs }} ms · {{ Math.round(service.errorRate * 100) }}% errors</small></div>
        <StatusPill :label="service.status" :tone="tone(service.status)" />
      </article>
    </div>
  </section>
</template>
