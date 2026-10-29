<script setup lang="ts">
import type { AgentTraceEvent } from "@casino-ops/shared";
import { computed, ref } from "vue";
import { summarizeInvestigation } from "../utils/agent-trace";
import StatusPill from "./StatusPill.vue";

const props = defineProps<{ traces: AgentTraceEvent[] }>();
const technicalTraceVisible = ref(false);
const evidenceVisible = ref(false);
const summary = computed(() => summarizeInvestigation(props.traces));
const checklist = (trace: AgentTraceEvent): string[] => Array.isArray(trace.details.checklist)
  ? trace.details.checklist.filter((item): item is string => typeof item === "string") : [];
const statusTone = computed(() => summary.value.status === "verified" ? "ok" : summary.value.status === "rejected" ? "danger" : "muted");
</script>

<template>
  <section id="investigation" class="panel trace-panel" data-tour="investigation">
    <header><div><span class="section-label">Investigation</span><h2>Root-cause verification</h2><p>Conclusions are checked against system dependencies and event evidence.</p></div><StatusPill :label="summary.status.toUpperCase()" :tone="statusTone" /></header>
    <div v-if="summary.status === 'ready'" class="empty">Run a scenario to observe evidence-backed root-cause verification.</div>
    <template v-else>
      <div class="investigation-summary">
        <div class="investigation-hypothesis"><small>Root-cause hypothesis</small><strong>{{ summary.hypothesis }}</strong></div>
        <div><small>Evidence</small><strong>{{ summary.evidenceCount }}</strong><span>independent signals</span></div>
        <div><small>Verification</small><strong>{{ summary.checks.filter(({ passed }) => passed).length }} / {{ summary.checks.length || 4 }}</strong><span>checks passed</span></div>
        <div><small>Confidence</small><strong>{{ summary.confidencePercent === null ? '—' : `${summary.confidencePercent}%` }}</strong><span>evidence-adjusted</span></div>
      </div>
      <div v-if="summary.checks.length" class="investigation-checks">
        <span v-for="check in summary.checks" :key="check.check" :class="{ passed: check.passed }">{{ check.passed ? '✓' : '×' }} {{ check.check.replaceAll('_', ' ') }}</span>
      </div>
      <div class="investigation-actions">
        <button class="trace-toggle" type="button" aria-controls="investigation-evidence" :aria-expanded="evidenceVisible" @click="evidenceVisible = !evidenceVisible">{{ evidenceVisible ? 'Hide evidence' : `View evidence (${summary.evidenceCount})` }}</button>
        <button class="trace-toggle" type="button" aria-controls="technical-agent-trace" :aria-expanded="technicalTraceVisible" @click="technicalTraceVisible = !technicalTraceVisible">{{ technicalTraceVisible ? 'Hide technical trace' : 'View technical trace' }}</button>
      </div>
      <div v-if="evidenceVisible" id="investigation-evidence" class="evidence-grid" data-testid="evidence-viewer">
        <article v-for="item in summary.evidence" :key="item.id">
          <span>{{ item.kind.replace('_', ' ') }}</span><p>{{ item.summary }}</p><code>{{ item.id }}</code>
        </article>
      </div>
      <ol v-if="technicalTraceVisible" id="technical-agent-trace" class="trace-list">
        <li v-for="trace in summary.traces" :key="trace.id" :class="`trace--${trace.status}`">
          <time>{{ new Date(trace.timestamp).toLocaleTimeString() }}</time><b>{{ trace.stage.replace('_', ' ') }}</b><span>{{ trace.summary }}</span>
          <small v-if="trace.evidenceIds.length">{{ trace.evidenceIds.length }} evidence item(s)</small>
          <ul v-if="checklist(trace).length" class="trace-checklist"><li v-for="item in checklist(trace)" :key="item">{{ item }}</li></ul>
          <div v-if="trace.evidenceIds.length" class="trace-evidence"><code v-for="id in trace.evidenceIds.slice(0, 6)" :key="id">{{ id }}</code></div>
        </li>
      </ol>
    </template>
  </section>
</template>
