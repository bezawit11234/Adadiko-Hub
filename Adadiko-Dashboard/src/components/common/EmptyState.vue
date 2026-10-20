<script setup lang="ts">
import AppIcon from './AppIcon.vue'

withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: string
  }>(),
  {
    icon: 'box',
  }
)
</script>

<template>
  <div class="p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto">
    <!-- Friendly geometric CSS/SVG illustration -->
    <div class="relative w-20 h-20 mb-5 flex items-center justify-center">
      <div class="absolute inset-0 rounded-2xl bg-stone-muted rotate-6 border border-stone-border" />
      <div class="absolute inset-0 rounded-2xl bg-white shadow-soft -rotate-3 border border-stone-border flex items-center justify-center">
        <div class="w-10 h-10 rounded-xl bg-signal-subtle flex items-center justify-center text-signal">
          <AppIcon :name="icon" :size="22" />
        </div>
      </div>
    </div>

    <h3 class="text-base font-bold text-ink font-heading">
      {{ title }}
    </h3>

    <p v-if="description" class="mt-1.5 text-sm text-ink-muted leading-relaxed">
      {{ description }}
    </p>

    <div v-if="$slots.action" class="mt-5">
      <slot name="action" />
    </div>
  </div>
</template>
