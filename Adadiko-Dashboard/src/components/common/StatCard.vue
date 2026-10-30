<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    label?: string
    value: string | number
    subtitle?: string
    hint?: string
    icon?: string
    iconBg?: string
    iconColor?: string
    trend?: 'up' | 'down' | 'neutral' | string
    trendDirection?: 'up' | 'down' | 'neutral'
    trendValue?: string
    variant?: 'default' | 'signal' | 'success' | 'warning' | 'info'
    hasInfoBadge?: boolean
  }>(),
  {
    trend: 'neutral',
    variant: 'default',
    hasInfoBadge: false,
  }
)

const displayTitle = computed(() => props.title || props.label || '')
const displaySubtitle = computed(() => props.subtitle || props.hint || '')

const effectiveDirection = computed(() => {
  if (props.trendDirection) return props.trendDirection
  if (props.trend === 'up' || props.trend === 'down' || props.trend === 'neutral') {
    return props.trend
  }
  return 'neutral'
})

const effectiveTrendValue = computed(() => {
  if (props.trendValue) return props.trendValue
  if (props.trend && props.trend !== 'up' && props.trend !== 'down' && props.trend !== 'neutral') {
    return props.trend
  }
  return ''
})

const cardTheme = computed(() => {
  if (props.variant === 'signal') {
    return {
      container: 'bg-signal-subtle border-signal/30 text-ink shadow-soft',
      iconBox: 'bg-signal/15 text-signal',
      infoBadge: 'text-signal bg-signal/20',
    }
  }
  if (props.variant === 'success') {
    return {
      container: 'bg-stone-surface border-stone-border text-ink shadow-soft',
      iconBox: 'bg-status-green-bg text-status-green',
      infoBadge: 'text-ink-muted bg-stone-muted',
    }
  }
  if (props.variant === 'info') {
    return {
      container: 'bg-stone-surface border-stone-border text-ink shadow-soft',
      iconBox: 'bg-status-blue-bg text-status-blue',
      infoBadge: 'text-ink-muted bg-stone-muted',
    }
  }
  if (props.variant === 'warning') {
    return {
      container: 'bg-stone-surface border-stone-border text-ink shadow-soft',
      iconBox: 'bg-status-amber-bg text-status-amber',
      infoBadge: 'text-ink-muted bg-stone-muted',
    }
  }
  // Default: soft mint or stone
  return {
    container: 'bg-stone-surface border-stone-border text-ink shadow-soft',
    iconBox: 'bg-stone-muted text-ink',
    infoBadge: 'text-ink-muted bg-stone-muted',
  }
})
</script>

<template>
  <div
    :class="[
      'relative p-4.5 rounded-2xl border transition-all duration-200 hover:shadow-card flex items-center gap-3.5',
      cardTheme.container,
    ]"
  >
    <!-- Left Icon Box -->
    <div
      v-if="icon"
      :class="[
        'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-black/5',
        cardTheme.iconBox,
      ]"
    >
      <AppIcon :name="icon" :size="20" />
    </div>

    <!-- Center Content -->
    <div class="flex-1 min-w-0">
      <div class="text-2xl font-black font-heading text-ink tracking-tight num-tabular leading-tight">
        {{ value }}
      </div>
      <div class="text-xs text-ink-muted truncate mt-0.5 font-medium">
        {{ displayTitle }}
      </div>
      <div v-if="displaySubtitle" class="text-[11px] text-ink-light truncate mt-0.5">
        {{ displaySubtitle }}
      </div>
    </div>

    <!-- Small Info Pill Badge in bottom right -->
    <div
      v-if="hasInfoBadge || variant === 'signal'"
      :class="[
        'absolute bottom-2.5 right-2.5 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-bold cursor-default',
        cardTheme.infoBadge,
      ]"
      title="Requires attention"
    >
      i
    </div>
  </div>
</template>
