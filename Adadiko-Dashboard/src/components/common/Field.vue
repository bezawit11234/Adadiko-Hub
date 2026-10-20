<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    id?: string
    required?: boolean
    hint?: string
    error?: string
  }>(),
  {
    required: false,
  }
)
</script>

<template>
  <div class="space-y-1.5">
    <div v-if="label" class="flex items-center justify-between">
      <label
        :for="id"
        class="block text-xs font-semibold uppercase tracking-wider text-ink-muted"
      >
        {{ label }}
        <span v-if="required" class="text-status-red ml-0.5">*</span>
      </label>
      <slot name="label-right" />
    </div>

    <slot />

    <p v-if="error" class="text-xs text-status-red font-medium">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-xs text-ink-light">
      {{ hint }}
    </p>
  </div>
</template>
