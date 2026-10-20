<script setup lang="ts">
withDefaults(
  defineProps<{
    maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | 'full'
  }>(),
  {
    maxWidth: 'full',
  }
)
</script>

<template>
  <div class="w-full space-y-6">
    <div
      :class="[
        'w-full space-y-6',
        maxWidth === 'md' ? 'max-w-4xl mx-auto' : '',
        maxWidth === 'lg' ? 'max-w-5xl mx-auto' : '',
        maxWidth === 'xl' ? 'max-w-6xl mx-auto' : '',
        maxWidth === '2xl' ? 'max-w-7xl mx-auto' : '',
        maxWidth === 'full' ? 'w-full' : '',
      ]"
    >
      <slot />
    </div>
  </div>
</template>
