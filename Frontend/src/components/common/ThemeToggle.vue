<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import AppIcon from '@/components/common/AppIcon.vue'

withDefaults(
  defineProps<{
    size?: 'sm' | 'md'
    showLabel?: boolean
  }>(),
  {
    size: 'md',
    showLabel: false,
  }
)

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    :class="[
      'group relative inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 select-none cursor-pointer',
      size === 'sm' ? 'p-1.5 text-xs' : 'p-2 text-xs',
      'border border-stone-border/80 hover:border-signal/70 bg-white/80 dark:bg-stone-surface dark:border-stone-border shadow-2xs hover:shadow-soft',
      'text-ink-muted hover:text-ink dark:text-stone-bg/80 dark:hover:text-white',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-1'
    ]"
    :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    :aria-label="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    @click="toggleTheme"
  >
    <!-- Sun icon for switching back to light -->
    <span
      v-if="isDark"
      class="inline-flex items-center justify-center text-amber-400 group-hover:text-amber-300 transition-transform duration-300 group-hover:rotate-45"
    >
      <AppIcon name="sun" :size="size === 'sm' ? 14 : 16" />
    </span>

    <!-- Moon icon for switching to dark -->
    <span
      v-else
      class="inline-flex items-center justify-center text-ink-navy group-hover:text-signal transition-transform duration-300 group-hover:-rotate-12"
    >
      <AppIcon name="moon" :size="size === 'sm' ? 14 : 16" />
    </span>

    <span v-if="showLabel" class="font-medium text-[11px]">
      {{ isDark ? 'Light' : 'Dark' }}
    </span>
  </button>
</template>
