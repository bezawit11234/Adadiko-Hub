<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

// Initialize theme on app mount
useTheme()
</script>

<template>
  <div id="adadiko-root" class="min-h-screen bg-stone-bg text-ink transition-colors duration-150">
    <RouterView />
  </div>
</template>
