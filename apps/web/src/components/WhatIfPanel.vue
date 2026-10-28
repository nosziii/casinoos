<script setup lang="ts">
import type { MitigationAction, MitigationComparison, MitigationSimulation, SimulationPrediction } from "@casino-os/shared";
import { ref } from "vue";

defineProps<{ enabled: boolean; busy: boolean; prediction?: SimulationPrediction; comparison?: MitigationComparison; simulation: MitigationSimulation | null }>();
const emit = defineEmits<{ predict: [minutes: number]; compare: [minutes: number]; simulate: [action: MitigationAction] }>();
const duration = ref(30);
const euros = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const title = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
</script>

<template>
  <section class="panel what-if-panel">
    <header>
      <div><span class="eyebrow">ACCELERATED DIGITAL TWIN</span><h2>What happens if we do nothing?</h2></div>
      <div class="horizon"><button v-for="minutes in [10, 20, 30]" :key="minutes" :class="{ active: duration === minutes }" @click="duration = minutes">+{{ minutes }} min</button></div>
    </header>
    <div v-if="!enabled" class="what-if-locked">Run the auth cascade and wait for Casino Brain correlation to unlock predictive simulation.</div>
    <template v-else>
      <div class="simulation-actions"><button class="button" :disabled="busy" @click="emit('predict', duration)">Run forecast</button><button class="button button--ghost" :disabled="busy || !prediction" @click="emit('compare', duration)">Compare mitigations</button></div>
      <div v-if="prediction" class="forecast-grid">
        <div><small>AFFECTED PLAYERS</small><strong>{{ prediction.affectedPlayers }}</strong></div>
        <div><small>FAILED DEPOSITS</small><strong>{{ prediction.failedDeposits }}</strong></div>
        <div><small>QUEUED WITHDRAWALS</small><strong>{{ prediction.queuedWithdrawals }}</strong></div>
        <div><small>BLOCKED VALUE</small><strong>{{ euros.format(prediction.estimatedBlockedValue) }}</strong></div>
      </div>
      <div v-if="prediction" class="impact-timeline"><div v-for="point in prediction.timeline" :key="point.minute"><span>+{{ point.minute }}m</span><i :style="{ height: `${Math.max(12, point.affectedPlayers / prediction.affectedPlayers * 80)}px` }" /><strong>{{ point.affectedPlayers }}</strong></div></div>
      <div v-if="comparison" class="strategy-grid">
        <article v-for="strategy in comparison.strategies" :key="strategy.action" :class="{ recommended: strategy.recommended }">
          <span v-if="strategy.recommended">RECOMMENDED</span><small>{{ title(strategy.action) }}</small><strong>{{ strategy.title }}</strong>
          <div><b>{{ Math.round(strategy.estimatedRecovery * 100) }}%</b> recovery · {{ strategy.risk }} risk · {{ strategy.recoveryTimeMinutes }}m</div>
          <p>Projected blocked value: {{ euros.format(strategy.projectedBlockedValue) }}</p><button class="simulate-button" :disabled="busy || simulation?.status === 'running'" @click="emit('simulate', strategy.action)">Simulate</button>
        </article>
      </div>
      <div v-if="simulation" class="recovery-status" :class="`recovery-status--${simulation.outcome}`"><div><small>DIGITAL TWIN RECOVERY</small><strong>{{ title(simulation.action) }} · {{ simulation.status }}</strong><p>{{ simulation.summary }}</p></div><div class="recovery-progress"><i :style="{ width: `${simulation.progress * 100}%` }" /></div><b>{{ Math.round(simulation.progress * 100) }}%</b></div>
    </template>
  </section>
</template>
