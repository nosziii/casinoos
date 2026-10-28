<script setup lang="ts">
import type { DemoMode, GuidedDemoStage } from "../composables/use-guided-demo";
import { guidedDemoContent } from "../utils/guided-demo-content";

defineProps<{ mode: DemoMode; stage: GuidedDemoStage; busy: boolean; error?: string }>();
defineEmits<{ guided: []; explore: []; exit: []; approve: [] }>();
</script>

<template>
  <section v-if="mode === 'landing'" class="mode-selector">
    <span class="product-kicker">Casino operations intelligence</span>
    <h1>CasinoOps</h1>
    <strong>Understand what failed. Know what happens next.</strong>
    <p>CasinoOps connects operational signals across casino systems to identify cascading incidents, verify their root cause, predict their impact and safely test recovery strategies.</p>
    <div><button class="button" :disabled="busy" @click="$emit('guided')">Start live demo</button><button class="button button--ghost" :disabled="busy" @click="$emit('explore')">Explore system</button></div>
  </section>
  <section v-else-if="mode === 'guided'" class="guided-control" :class="`guided-control--${stage}`">
    <div><span class="section-label">Guided demo</span><h2>{{ guidedDemoContent[stage].title }}</h2><p>{{ error || guidedDemoContent[stage].description }}</p></div>
    <div class="guided-actions"><span v-if="busy">Working…</span><button v-if="stage === 'awaiting_approval'" class="button" :disabled="busy" @click="$emit('approve')">Approve simulated recovery</button><button v-if="stage === 'completed' || stage === 'error'" class="button" :disabled="busy" @click="$emit('guided')">Run again</button><button class="button button--ghost" :disabled="busy" @click="$emit('exit')">Exit demo</button></div>
  </section>
  <section v-else class="explore-control"><div><span class="section-label">Explore mode</span><strong>All operator controls are available.</strong></div><button class="button button--ghost" :disabled="busy" @click="$emit('exit')">Back to demo start</button></section>
</template>
