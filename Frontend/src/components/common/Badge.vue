<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'signal'
    size?: 'sm' | 'md'
    dot?: boolean
  }>(),
  {
    variant: 'default',
    size: 'sm',
    dot: false,
  }
)

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-status-green-bg text-status-green border-status-green/20'
    case 'warning':
      return 'bg-status-amber-bg text-status-amber border-status-amber/20'
    case 'danger':
      return 'bg-status-red-bg text-status-red border-status-red/20'
    case 'info':
      return 'bg-status-blue-bg text-status-blue border-status-blue/20'
    case 'signal':
      return 'bg-signal-subtle text-signal border-signal/25'
    case 'neutral':
      return 'bg-stone-muted text-ink-muted border-stone-border'
    case 'default':
    default:
      return 'bg-[#F2EFE9] text-ink border-stone-border'
  }
})

const dotColor = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-status-green'
    case 'warning':
      return 'bg-status-amber'
    case 'danger':
      return 'bg-status-red'
    case 'info':
      return 'bg-status-blue'
    case 'signal':
      return 'bg-signal'
    default:
      return 'bg-ink-muted'
  }
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center font-medium border rounded-full select-none',
      size === 'sm' ? 'px-2 py-0.5 text-xs gap-1.5' : 'px-3 py-1 text-sm gap-2',
      variantClasses,
    ]"
  >
    <span
      v-if="dot"
      :class="['w-1.5 h-1.5 rounded-full shrink-0', dotColor]"
    />
    <slot />
  </span>
</template>
