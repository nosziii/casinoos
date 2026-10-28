<script setup lang="ts">
defineProps<{ label: string; tone: "ok" | "warn" | "danger" | "muted" }>();
</script>

<template><span class="status-pill" :class="`status-pill--${tone}`"><i />{{ label }}</span></template>

