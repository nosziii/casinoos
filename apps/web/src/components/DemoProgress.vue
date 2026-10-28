<script setup lang="ts">
import { computed } from "vue";
import { buildDemoJourney, type DemoJourneySignals } from "../utils/demo-journey";

const props = defineProps<{ signals: DemoJourneySignals }>();
const steps = computed(() => buildDemoJourney(props.signals));
const activeIndex = computed(() => {
  const firstIncomplete = steps.value.findIndex(({ complete }) => !complete);
  return firstIncomplete === -1 ? steps.value.length - 1 : firstIncomplete;
});
</script>

<template>
  <section class="demo-progress" aria-label="Demo journey progress">
    <header><div><span class="section-label">Demo progress</span><strong>Step {{ activeIndex + 1 }} / {{ steps.length }}</strong></div><span>{{ steps[activeIndex]?.label }}</span></header>
    <ol>
      <li v-for="(step, index) in steps" :key="step.label" :class="{ complete: step.complete, active: index === activeIndex }"><i>{{ step.complete ? '✓' : index + 1 }}</i><span>{{ step.label }}</span></li>
    </ol>
  </section>
</template>
