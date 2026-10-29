<script setup lang="ts">
import type { ServiceState } from "@casino-ops/shared";
import { computed } from "vue";
import { buildDependencyGraph } from "../utils/dependency-graph";

const props = defineProps<{ services: ServiceState[]; rootCause?: string }>();
const graph = computed(() => buildDependencyGraph(props.services, props.rootCause));
const incidentActive = computed(() => props.services.some(({ status }) => status !== "healthy"));
const edgeCoordinates = (source: { x: number; y: number }, target: { x: number; y: number }) => ({
  x1: source.x + 105,
  y1: source.y + 37,
  x2: target.x + 105,
  y2: target.y + 37,
});
</script>

<template>
  <section class="panel dependency-panel" data-testid="dependency-graph">
    <header>
      <div><span class="section-label">Operational dependencies</span><h2>Failure propagation</h2><p>See how one degraded dependency affects critical casino operations.</p></div>
      <span class="dependency-summary" :class="{ 'dependency-summary--incident': incidentActive }">{{ incidentActive ? 'Cascade detected' : 'All paths healthy' }}</span>
    </header>
    <div class="dependency-viewport">
      <svg class="dependency-map" viewBox="0 0 1000 404" role="img" aria-labelledby="dependency-title dependency-description">
        <title id="dependency-title">Casino operations dependency graph</title>
        <desc id="dependency-description">Authentication supplies Payments, KYC, Cashier and Player Registration. Payments also supplies Cashier and KYC supplies Player Registration. Customer Support is independent.</desc>
        <defs>
          <marker id="dependency-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
        </defs>
        <line
          v-for="edge in graph.edges"
          :key="edge.id"
          v-bind="edgeCoordinates(edge.source, edge.target)"
          class="dependency-edge"
          :class="`dependency-edge--${edge.status}`"
          marker-end="url(#dependency-arrow)"
        />
        <g
          v-for="node in graph.nodes"
          :key="node.id"
          class="dependency-node"
          :class="[`dependency-node--${node.status}`, { 'dependency-node--root': node.rootCause }]"
          :transform="`translate(${node.x} ${node.y})`"
          :data-service="node.id"
        >
          <rect width="210" height="74" rx="9" />
          <circle cx="20" cy="22" r="5" />
          <text class="dependency-node__label" x="34" y="27">{{ node.label }}</text>
          <text class="dependency-node__status" x="20" y="56">{{ node.rootCause ? 'VERIFIED ROOT CAUSE' : node.status.toUpperCase() }}</text>
        </g>
      </svg>
    </div>
    <div class="dependency-legend" aria-hidden="true"><span><i class="legend-dot legend-dot--healthy" />Healthy</span><span><i class="legend-dot legend-dot--degraded" />Degraded</span><span><i class="legend-dot legend-dot--failed" />Failed</span></div>
  </section>
</template>
