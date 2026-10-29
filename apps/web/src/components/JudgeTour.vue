<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { GuidedDemoStage } from "../composables/use-guided-demo";
import { judgeTourSteps } from "../utils/judge-tour";

const props = defineProps<{ stage: GuidedDemoStage }>();
const stepIndex = ref(0);
const dismissed = ref(false);
const popover = ref<HTMLElement>();
const position = ref({ top: 16, left: 16 });
let highlighted: HTMLElement | undefined;
let frame = 0;

const step = computed(() => judgeTourSteps[stepIndex.value]);
const investigationReady = computed(() => ["awaiting_approval", "recovering", "completed"].includes(props.stage));
const waiting = computed(() => Boolean(step.value?.requiresIncident) && !investigationReady.value);
const approvalStep = computed(() => step.value?.action === "approve");
const finalStep = computed(() => stepIndex.value === judgeTourSteps.length - 1);

function next(): void {
  if (waiting.value || approvalStep.value) return;
  if (finalStep.value) dismiss();
  else stepIndex.value += 1;
}

function dismiss(): void {
  dismissed.value = true;
  highlighted?.classList.remove("tour-highlight");
  highlighted = undefined;
}

function updatePosition(scroll = false): void {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(async () => {
    await nextTick();
    highlighted?.classList.remove("tour-highlight");
    const target = document.querySelector<HTMLElement>(step.value?.target ?? "") ?? undefined;
    highlighted = target;
    if (!target) return;
    target.classList.add("tour-highlight");
    if (scroll) target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    await nextTick();
    const rect = target.getBoundingClientRect();
    const width = Math.min(popover.value?.offsetWidth ?? 340, window.innerWidth - 24);
    const height = popover.value?.offsetHeight ?? 210;
    const gap = 12;
    let left = rect.right + gap;
    let top = rect.top;
    if (left + width > window.innerWidth - 12) left = rect.left - width - gap;
    if (left < 12) {
      left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + rect.width / 2 - width / 2));
      top = rect.bottom + gap;
      if (top + height > window.innerHeight - 12) top = rect.top - height - gap;
    }
    position.value = {
      left: Math.max(12, Math.min(window.innerWidth - width - 12, left)),
      top: Math.max(12, Math.min(window.innerHeight - height - 12, top)),
    };
  });
}

const handleViewportChange = () => updatePosition(false);
watch(stepIndex, () => updatePosition(true));
watch(() => props.stage, (stage) => {
  if (approvalStep.value && (stage === "recovering" || stage === "completed")) stepIndex.value += 1;
  else updatePosition(false);
});
onMounted(() => {
  window.addEventListener("resize", handleViewportChange);
  window.addEventListener("scroll", handleViewportChange, true);
  updatePosition(false);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  highlighted?.classList.remove("tour-highlight");
  window.removeEventListener("resize", handleViewportChange);
  window.removeEventListener("scroll", handleViewportChange, true);
});
</script>

<template>
  <Teleport to="body">
    <aside
      v-if="!dismissed && step"
      ref="popover"
      class="judge-tour"
      role="dialog"
      aria-live="polite"
      aria-label="Guided product tour"
      data-testid="judge-tour"
      :data-step="stepIndex"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
    >
      <div class="judge-tour__meta"><span>Guided tour</span><b>{{ stepIndex + 1 }} / {{ judgeTourSteps.length }}</b></div>
      <h2>{{ step.title }}</h2>
      <p>{{ step.description }}</p>
      <div class="judge-tour__actions">
        <button type="button" class="tour-skip" @click="dismiss">Skip tour</button>
        <span v-if="approvalStep">Use the highlighted button</span>
        <button v-else type="button" class="button" :disabled="waiting" @click="next">
          {{ waiting ? 'Waiting for verified incident…' : finalStep ? 'Finish tour' : 'Next' }}
        </button>
      </div>
    </aside>
  </Teleport>
</template>
