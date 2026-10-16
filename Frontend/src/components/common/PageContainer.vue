<script setup lang="ts">
withDefaults(
  defineProps<{
    maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | 'full'
  }>(),
  {
    maxWidth: '2xl',
  }
)
</script>

<template>
  <div class="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <div
      :class="[
        'mx-auto w-full space-y-6',
        maxWidth === 'md' ? 'max-w-4xl' : '',
        maxWidth === 'lg' ? 'max-w-5xl' : '',
        maxWidth === 'xl' ? 'max-w-6xl' : '',
        maxWidth === '2xl' ? 'max-w-7xl' : '',
        maxWidth === 'full' ? 'max-w-full' : '',
      ]"
    >
      <slot />
    </div>
  </div>
</template>
