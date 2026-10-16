<script setup lang="ts">
import AppIcon from './AppIcon.vue'

withDefaults(
  defineProps<{
    inline?: boolean
    text?: string
  }>(),
  {
    inline: false,
    text: 'Simulated demonstration data prepared for manager evaluation. Real enforcement and persistence handled via Frappe / ERPNext v16 API.',
  }
)
</script>

<template>
  <div
    v-if="!inline"
    class="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-stone-subtle border border-stone-border text-xs text-ink-muted"
  >
    <div class="w-4 h-4 rounded-full bg-signal/15 text-signal flex items-center justify-center shrink-0">
      <AppIcon name="shield" :size="10" />
    </div>
    <span class="font-medium text-ink">Demo Notice:</span>
    <span class="truncate">{{ text }}</span>
  </div>

  <span
    v-else
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-muted text-[11px] font-medium text-ink-muted border border-stone-border"
  >
    <span class="w-1.5 h-1.5 rounded-full bg-signal" />
    <span>Demo Data</span>
  </span>
</template>
