<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    title: string
    value: string | number
    subtitle?: string
    icon?: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    variant?: 'default' | 'signal' | 'success' | 'warning'
  }>(),
  {
    trend: 'neutral',
    variant: 'default',
  }
)

const trendClasses = computed(() => {
  if (props.trend === 'up') return 'text-status-green bg-status-green-bg'
  if (props.trend === 'down') return 'text-status-red bg-status-red-bg'
  return 'text-ink-muted bg-stone-muted'
})

const cardBorder = computed(() => {
  if (props.variant === 'signal') return 'border-signal/40 bg-gradient-to-br from-white to-signal-subtle/30'
  return 'border-stone-border bg-white'
})
</script>

<template>
  <div
    :class="[
      'p-5 rounded-2xl border shadow-soft flex flex-col justify-between transition-all duration-200 hover:shadow-card',
      cardBorder,
    ]"
  >
    <div class="flex items-start justify-between">
      <span class="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {{ title }}
      </span>
      <div
        v-if="icon"
        class="w-8 h-8 rounded-xl bg-stone-bg flex items-center justify-center text-ink-navy border border-stone-border"
      >
        <AppIcon :name="icon" :size="16" />
      </div>
    </div>

    <div class="my-3">
      <div class="text-2xl lg:text-3xl font-extrabold tracking-tight text-ink font-heading num-tabular">
        {{ value }}
      </div>
    </div>

    <div class="flex items-center justify-between text-xs pt-1 border-t border-stone-border/60">
      <span v-if="subtitle" class="text-ink-muted truncate">
        {{ subtitle }}
      </span>
      <span
        v-if="trendValue"
        :class="['px-1.5 py-0.5 rounded-md font-semibold num-tabular inline-flex items-center gap-1', trendClasses]"
      >
        <span v-if="trend === 'up'">↑</span>
        <span v-else-if="trend === 'down'">↓</span>
        {{ trendValue }}
      </span>
    </div>
  </div>
</template>
