<script setup lang="ts">
import type { AgentAnalysis, SpecialistAgentName } from "@casino-ops/shared";
import StatusPill from "./StatusPill.vue";
const props = defineProps<{ eventCount: number; reports: AgentAnalysis[] }>();
const agents: Array<{ id: SpecialistAgentName; initials: string; title: string; focus: string }> = [
  { id: "infrastructure-agent", initials: "IA", title: "Infrastructure Agent", focus: "dependencies & service health" },
  { id: "operations-agent", initials: "OA", title: "Operations Agent", focus: "players & transactions" },
  { id: "risk-agent", initials: "RA", title: "Risk Agent", focus: "exposure & escalation" },
];
const hasReport = (agent: SpecialistAgentName) => props.reports.some((analysis) => analysis.agent === agent);
</script>

<template>
  <section class="panel agent-panel">
    <header><span class="eyebrow">HIERARCHICAL AI</span><h2>Agent activity</h2></header>
    <div class="agent-stack">
      <div v-for="agent in agents" :key="agent.id" class="agent-heading">
        <div class="agent-icon">{{ agent.initials }}</div><div><strong>{{ agent.title }}</strong><small>{{ agent.focus }}</small></div>
        <StatusPill :label="hasReport(agent.id) ? 'REPORT SENT' : eventCount ? 'ANALYZING' : 'READY'" :tone="hasReport(agent.id) ? 'ok' : eventCount ? 'warn' : 'muted'" />
      </div>
    </div>
    <ol class="activity-list"><li :class="{ done: eventCount }">Buffered {{ eventCount }} events</li><li :class="{ done: reports.length >= 3 }">Specialists analyzed in parallel</li><li :class="{ done: reports.length >= 3 }">Structured reports sent to Casino Brain</li></ol>
  </section>
</template>
