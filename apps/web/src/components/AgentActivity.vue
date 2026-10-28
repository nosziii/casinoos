<script setup lang="ts">
import type { AgentAnalysis, SpecialistAgentName } from "@casino-ops/shared";
import StatusPill from "./StatusPill.vue";
const props = defineProps<{ eventCount: number; reports: AgentAnalysis[] }>();
const agents: Array<{ id: SpecialistAgentName; initials: string; title: string; focus: string }> = [
  { id: "infrastructure-agent", initials: "IN", title: "Infrastructure", focus: "Root cause investigation" },
  { id: "operations-agent", initials: "OP", title: "Operations", focus: "Player and transaction impact" },
  { id: "risk-agent", initials: "RK", title: "Risk", focus: "Exposure assessment" },
];
const hasReport = (agent: SpecialistAgentName) => props.reports.some((analysis) => analysis.agent === agent);
</script>

<template>
  <section class="panel agent-panel">
    <header><div><span class="section-label">Investigation team</span><h2>Operational analysis</h2><p>Specialists examine the same incident from three perspectives.</p></div></header>
    <div class="agent-stack">
      <div v-for="agent in agents" :key="agent.id" class="agent-heading">
        <div class="agent-icon">{{ agent.initials }}</div><div><strong>{{ agent.title }}</strong><small>{{ agent.focus }}</small></div>
        <StatusPill :label="hasReport(agent.id) ? (agent.id === 'infrastructure-agent' ? 'VERIFIED' : 'COMPLETE') : eventCount ? 'INVESTIGATING' : 'READY'" :tone="hasReport(agent.id) ? 'ok' : eventCount ? 'warn' : 'muted'" />
      </div>
    </div>
    <ol class="activity-list"><li :class="{ done: eventCount }">{{ eventCount }} operational signals received</li><li :class="{ done: reports.length >= 3 }">Cross-system analysis complete</li><li :class="{ done: reports.length >= 3 }">Conclusion sent for verification</li></ol>
  </section>
</template>
