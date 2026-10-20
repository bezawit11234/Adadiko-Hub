<script setup lang="ts">
import Toast from '@/components/common/Toast.vue'
import { useToast } from '@/composables/useToast'

const { toasts, dismissToast } = useToast()
</script>

<template>
  <div class="min-h-screen bg-stone-bg font-sans text-ink antialiased">
    <router-view />
    <Toast :toasts="toasts" @dismiss="dismissToast" />
  </div>
</template>
