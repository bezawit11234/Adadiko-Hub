<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
    <div>
      <div class="flex items-center gap-2.5">
        <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-ink font-heading">
          {{ title }}
        </h1>
        <slot name="badge" />
      </div>
      <p v-if="description" class="mt-1 text-sm text-ink-muted">
        {{ description }}
      </p>
    </div>

    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2.5">
      <slot name="actions" />
    </div>
  </div>
</template>
