<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle'
    size?: 'sm' | 'md' | 'lg'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    block?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
    block: false,
  }
)

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const baseClasses =
  'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none'

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs px-3 py-1.5 rounded-lg gap-1.5'
    case 'lg':
      return 'text-base px-5 py-2.5 rounded-xl gap-2.5 font-semibold'
    case 'md':
    default:
      return 'text-sm px-4 py-2 rounded-xl gap-2'
  }
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-signal text-white hover:bg-[#DE782B] active:bg-[#C96B24] shadow-sm'
    case 'secondary':
      return 'bg-ink-navy text-white hover:bg-ink-deep active:bg-black shadow-sm'
    case 'outline':
      return 'border border-stone-border bg-white text-ink hover:bg-stone-muted active:bg-[#E5E1D8]'
    case 'ghost':
      return 'bg-transparent text-ink-muted hover:text-ink hover:bg-stone-muted/70 active:bg-stone-muted'
    case 'danger':
      return 'bg-status-red text-white hover:bg-[#C32C2E] active:bg-[#A82224]'
    case 'subtle':
      return 'bg-signal-subtle text-signal hover:bg-[#FCE8D8] active:bg-[#F9D8C0]'
    default:
      return 'bg-signal text-white'
  }
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      baseClasses,
      sizeClasses,
      variantClasses,
      block ? 'w-full' : '',
    ]"
    @click="$emit('click', $event)"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
    <slot />
  </button>
</template>
