<script setup lang="ts">
import { onMounted } from 'vue'
import Toast from '@/components/common/Toast.vue'
import { useToast } from '@/composables/useToast'
import { useSession } from '@/composables/useSession'

const { toasts, dismissToast } = useToast()
const { restoreSession } = useSession()

onMounted(() => {
  restoreSession()
})
</script>

<template>
  <div class="min-h-screen bg-stone-bg font-sans text-ink antialiased">
    <router-view />
    <Toast :toasts="toasts" @dismiss="dismissToast" />
  </div>
</template>
