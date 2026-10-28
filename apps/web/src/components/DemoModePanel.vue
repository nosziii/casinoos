<script setup lang="ts">
import type { DemoMode, GuidedDemoStage } from "../composables/use-guided-demo";
import { guidedDemoContent } from "../utils/guided-demo-content";

defineProps<{ mode: DemoMode; stage: GuidedDemoStage; busy: boolean; error?: string }>();
defineEmits<{ guided: []; explore: []; exit: []; approve: [] }>();
</script>

<template>
  <section v-if="mode === 'landing'" class="mode-selector">
    <span class="eyebrow">CASINOOPS DEMO</span>
    <h1>Understand a cascading casino incident in minutes.</h1>
    <p>Detect shared failures, verify their root cause, predict operational impact and test recovery strategies before touching production.</p>
    <div><button class="button" :disabled="busy" @click="$emit('guided')">Start guided demo</button><button class="button button--ghost" :disabled="busy" @click="$emit('explore')">Explore CasinoOps</button></div>
  </section>
  <section v-else-if="mode === 'guided'" class="guided-control" :class="`guided-control--${stage}`">
    <div><span class="eyebrow">GUIDED DEMO</span><h2>{{ guidedDemoContent[stage].title }}</h2><p>{{ error || guidedDemoContent[stage].description }}</p></div>
    <div class="guided-actions"><span v-if="busy">Working…</span><button v-if="stage === 'awaiting_approval'" class="button" :disabled="busy" @click="$emit('approve')">Approve simulated recovery</button><button v-if="stage === 'completed' || stage === 'error'" class="button" :disabled="busy" @click="$emit('guided')">Run again</button><button class="button button--ghost" :disabled="busy" @click="$emit('exit')">Exit demo</button></div>
  </section>
  <section v-else class="explore-control"><div><span class="eyebrow">EXPLORE MODE</span><strong>All operator controls are available.</strong></div><button class="button button--ghost" :disabled="busy" @click="$emit('exit')">Back to demo start</button></section>
</template>
