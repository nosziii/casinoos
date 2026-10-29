<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AgentActivity from "./components/AgentActivity.vue";
import AgentTrace from "./components/AgentTrace.vue";
import DemoSafetyNotice from "./components/DemoSafetyNotice.vue";
import DemoProgress from "./components/DemoProgress.vue";
import DemoModePanel from "./components/DemoModePanel.vue";
import DependencyGraph from "./components/DependencyGraph.vue";
import EventStream from "./components/EventStream.vue";
import IncidentPanel from "./components/IncidentPanel.vue";
import IncidentTimeline from "./components/IncidentTimeline.vue";
import JudgeTour from "./components/JudgeTour.vue";
import StatusPill from "./components/StatusPill.vue";
import SystemHealth from "./components/SystemHealth.vue";
import WhatIfPanel from "./components/WhatIfPanel.vue";
import { useGuidedDemo } from "./composables/use-guided-demo";
import { useCasinoStore } from "./stores/casino";
import { summarizeInvestigation } from "./utils/agent-trace";
import type { DemoJourneySignals } from "./utils/demo-journey";

const casino = useCasinoStore();
const error = ref("");
const working = ref(false);
const verified = computed(() => casino.agentTraces.some(({ stage, status }) => stage === "verification" && status === "success"));
const guidedIncidentReady = computed(() => verified.value && casino.state.phase >= 3 && Boolean(casino.latestIncident));
const recoveryComplete = computed(() => casino.state.mitigation?.status === "completed");
const evidenceCount = computed(() => summarizeInvestigation(casino.agentTraces).evidenceCount);
const { mode, stage, busy: guidedBusy, error: guidedError, startGuided, enterExplore, returnToLanding, approveRecovery } = useGuidedDemo(casino, { verified: guidedIncidentReady, comparison: computed(() => casino.mitigations), recoveryComplete });
const busy = computed(() => working.value || guidedBusy.value);
const journeySignals = computed<DemoJourneySignals>(() => ({
  scenarioStarted: casino.state.phase > 0,
  investigationStarted: casino.agentTraces.some(({ stage: traceStage }) => traceStage === "plan"),
  rootCauseVerified: verified.value,
  forecastReady: Boolean(casino.prediction),
  mitigationsReady: Boolean(casino.mitigations),
  recoveryComplete: recoveryComplete.value,
}));
onMounted(async () => { try { await casino.initialize(); } catch (cause) { error.value = cause instanceof Error ? cause.message : "Initialization failed"; } });
async function act(operation: () => Promise<void>): Promise<void> { working.value = true; error.value = ""; try { await operation(); } catch (cause) { error.value = cause instanceof Error ? cause.message : "Action failed"; } finally { working.value = false; } }
const runPrediction = (minutes: number) => act(() => casino.predict(minutes));
const runMitigations = (minutes: number) => act(() => casino.compareMitigations(minutes));
const askCasinoBrain = (query: string) => act(() => casino.askCasinoBrain(query));
const runMitigationSimulation = (action: Parameters<typeof casino.simulateMitigation>[0]) => act(() => casino.simulateMitigation(action));
</script>

<template>
  <main class="shell">
    <nav><div class="brand"><span>CO</span><div><strong>CASINO<span>OPS</span></strong><small>CASINO OPERATIONS INTELLIGENCE</small></div></div><div class="nav-actions"><StatusPill :label="casino.connected ? 'LIVE LINK' : 'OFFLINE'" :tone="casino.connected ? 'ok' : 'danger'" /><template v-if="mode === 'explore'"><button class="button button--ghost" :disabled="busy" @click="act(casino.reset)">Reset demo</button><button class="button" :disabled="busy || casino.state.running" @click="act(casino.runScenario)">{{ casino.state.running ? 'Scenario running' : 'Run auth cascade' }}</button></template></div></nav>
    <div v-if="error" class="error-banner">{{ error }}</div>
    <template v-if="mode === 'landing'">
      <DemoModePanel :mode="mode" :stage="stage" :busy="busy" :error="guidedError" @guided="startGuided" @explore="enterExplore" @exit="returnToLanding" @approve="approveRecovery" />
      <SystemHealth :services="casino.state.services" />
      <DemoSafetyNotice />
    </template>
    <template v-if="mode !== 'landing'">
    <div class="hero"><div><span class="section-label">Operational digital twin</span><h1>Casino Operations Intelligence</h1><p>Understand what failed. Know what happens next.</p></div><div class="phase"><small>Scenario phase</small><strong>0{{ casino.state.phase }}</strong><span>/ 03</span></div></div>
    <DemoSafetyNotice />
    <DemoModePanel :mode="mode" :stage="stage" :busy="busy" :error="guidedError" @guided="startGuided" @explore="enterExplore" @exit="returnToLanding" @approve="approveRecovery" />
    <DemoProgress :signals="journeySignals" />
    <div class="dashboard"><IncidentPanel :incident="casino.latestIncident" :services="casino.state.services" :evidence-count="evidenceCount" /><SystemHealth :services="casino.state.services" /><DependencyGraph :services="casino.state.services" :root-cause="casino.latestIncident?.rootCause.service" /><AgentActivity :event-count="casino.events.length" :reports="casino.agentReports" /><EventStream :events="casino.events" /></div>
    <WhatIfPanel :enabled="Boolean(casino.latestIncident)" :busy="busy" :prediction="casino.prediction" :comparison="casino.mitigations" :query-response="casino.queryResponse" :simulation="casino.state.mitigation" @ask="askCasinoBrain" @predict="runPrediction" @compare="runMitigations" @simulate="runMitigationSimulation" />
    <AgentTrace :traces="casino.agentTraces" />
    <IncidentTimeline :events="casino.events" />
    <JudgeTour v-if="mode === 'guided'" :stage="stage" />
    </template>
    <footer><span>CasinoOps · Synthetic environment</span><span>No production systems connected · No autonomous production actions</span></footer>
  </main>
</template>
