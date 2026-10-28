<script setup lang="ts">
import type { AgentTraceEvent } from "@casino-ops/shared";
import { computed } from "vue";
import StatusPill from "./StatusPill.vue";

const props = defineProps<{ traces: AgentTraceEvent[] }>();
const tone = (status: AgentTraceEvent["status"]) => status === "success" ? "ok" : status === "error" ? "danger" : "muted";
const verified = computed(() => props.traces.some((trace) => trace.stage === "verification" && trace.status === "success"));
const checklist = (trace: AgentTraceEvent): string[] => Array.isArray(trace.details.checklist)
  ? trace.details.checklist.filter((item): item is string => typeof item === "string") : [];
const checks = (trace: AgentTraceEvent): Array<{ check: string; passed: boolean }> => Array.isArray(trace.details.checks)
  ? trace.details.checks.filter((item): item is { check: string; passed: boolean } => isCheck(item)) : [];
function isCheck(value: unknown): boolean {
  return typeof value === "object" && value !== null && "check" in value && typeof value.check === "string" && "passed" in value && typeof value.passed === "boolean";
}
</script>

<template>
  <section class="panel trace-panel">
    <header><div><span class="eyebrow">AUDITABLE AGENT TRACE</span><h2>Investigation evidence</h2></div><StatusPill :label="verified ? 'VERIFIED' : traces.at(-1)?.stage.toUpperCase() ?? 'READY'" :tone="verified ? 'ok' : traces.at(-1) ? tone(traces.at(-1)!.status) : 'muted'" /></header>
    <div v-if="!traces.length" class="empty">Run a scenario to observe plan, tools, evidence and verification.</div>
    <ol v-else class="trace-list">
      <li v-for="trace in traces.slice(-12)" :key="trace.id" :class="`trace--${trace.status}`">
        <time>{{ new Date(trace.timestamp).toLocaleTimeString() }}</time><b>{{ trace.stage.replace('_', ' ') }}</b><span>{{ trace.summary }}</span>
        <small v-if="trace.evidenceIds.length">{{ trace.evidenceIds.length }} evidence item(s)</small>
        <ul v-if="checklist(trace).length" class="trace-checklist"><li v-for="item in checklist(trace)" :key="item">{{ item }}</li></ul>
        <div v-if="trace.evidenceIds.length" class="trace-evidence"><code v-for="id in trace.evidenceIds.slice(0, 6)" :key="id">{{ id }}</code></div>
        <div v-if="checks(trace).length" class="trace-checks"><span v-for="check in checks(trace)" :key="check.check" :class="{ passed: check.passed }">{{ check.passed ? '✓' : '×' }} {{ check.check.replaceAll('_', ' ') }}</span></div>
      </li>
    </ol>
  </section>
</template>
