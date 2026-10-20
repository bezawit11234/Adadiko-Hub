<script setup lang="ts">
import { useRouter } from 'vue-router'
import PageContainer from '@/components/common/PageContainer.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const router = useRouter()
</script>

<template>
  <PageContainer>
    <div class="max-w-md mx-auto text-center py-20">
      <div class="w-14 h-14 rounded-2xl bg-stone-muted text-ink-muted mx-auto flex items-center justify-center mb-4">
        <AppIcon name="alert-circle" :size="28" />
      </div>

      <h1 class="font-heading font-bold text-2xl text-ink tracking-tight mb-2">
        Page Not Found
      </h1>

      <p class="text-xs text-ink-muted leading-relaxed mb-6">
        The dashboard view you requested does not exist or has been moved to another section.
      </p>

      <AppButton variant="primary" size="sm" @click="router.push('/overview')">
        Return to Overview
      </AppButton>
    </div>
  </PageContainer>
</template>
