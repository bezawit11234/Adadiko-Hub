<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  router.replace('/checkout')
})
</script>

<template>
  <div class="space-y-3 text-center">
    <h2 class="text-2xl font-black text-ink font-heading">Choose your plan first</h2>
    <p class="text-sm text-ink-muted">
      New workspaces start with company details, modules, and checkout. You create a password at the end so you can sign in next time.
    </p>
  </div>
</template>
