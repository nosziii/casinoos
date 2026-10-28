<script setup lang="ts">
import type { AgentTraceEvent } from "@casino-ops/shared";
import { computed, ref } from "vue";
import { summarizeInvestigation } from "../utils/agent-trace";
import StatusPill from "./StatusPill.vue";

const props = defineProps<{ traces: AgentTraceEvent[] }>();
const technicalTraceVisible = ref(false);
const summary = computed(() => summarizeInvestigation(props.traces));
const checklist = (trace: AgentTraceEvent): string[] => Array.isArray(trace.details.checklist)
  ? trace.details.checklist.filter((item): item is string => typeof item === "string") : [];
const statusTone = computed(() => summary.value.status === "verified" ? "ok" : summary.value.status === "rejected" ? "danger" : "muted");
</script>

<template>
  <section class="panel trace-panel">
    <header><div><span class="eyebrow">AI INVESTIGATION</span><h2>Root-cause verification</h2></div><StatusPill :label="summary.status.toUpperCase()" :tone="statusTone" /></header>
    <div v-if="summary.status === 'ready'" class="empty">Run a scenario to observe evidence-backed root-cause verification.</div>
    <template v-else>
      <div class="investigation-summary">
        <div class="investigation-hypothesis"><small>HYPOTHESIS</small><strong>{{ summary.hypothesis }}</strong></div>
        <div><small>EVIDENCE</small><strong>{{ summary.evidenceCount }}</strong><span>signals</span></div>
        <div><small>VERIFICATION</small><strong>{{ summary.checks.filter(({ passed }) => passed).length }} / {{ summary.checks.length || 4 }}</strong><span>checks passed</span></div>
        <div><small>CONFIDENCE</small><strong>{{ summary.confidencePercent === null ? '—' : `${summary.confidencePercent}%` }}</strong><span>evidence-adjusted</span></div>
      </div>
      <div v-if="summary.checks.length" class="investigation-checks">
        <span v-for="check in summary.checks" :key="check.check" :class="{ passed: check.passed }">{{ check.passed ? '✓' : '×' }} {{ check.check.replaceAll('_', ' ') }}</span>
      </div>
      <button class="trace-toggle" type="button" aria-controls="technical-agent-trace" :aria-expanded="technicalTraceVisible" @click="technicalTraceVisible = !technicalTraceVisible">{{ technicalTraceVisible ? 'Hide technical trace' : 'View technical trace' }}</button>
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
