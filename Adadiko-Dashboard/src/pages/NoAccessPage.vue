<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSession } from '@/composables/useSession'
import PageContainer from '@/components/common/PageContainer.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const router = useRouter()
const { currentRole, currentRoleMeta, switchRole } = useSession()

const handleSwitchToAdmin = () => {
  switchRole('admin')
  router.push('/overview')
}
</script>

<template>
  <PageContainer>
    <div class="max-w-md mx-auto text-center py-16">
      <div class="w-14 h-14 rounded-2xl bg-status-red-bg text-status-red mx-auto flex items-center justify-center mb-4">
        <AppIcon name="lock" :size="28" />
      </div>

      <h1 class="font-heading font-bold text-2xl text-ink tracking-tight mb-2">
        Access Restricted
      </h1>

      <p class="text-xs text-ink-muted leading-relaxed mb-6">
        Your current staff profile (<strong>{{ currentRoleMeta.label }}</strong>) is not authorized to access this administration section.
      </p>

      <div class="p-4 rounded-2xl bg-stone-surface border border-stone-border mb-6 text-left text-xs">
        <div class="font-semibold text-ink mb-1">Permitted routes for {{ currentRoleMeta.label }}:</div>
        <ul class="list-disc list-inside text-ink-muted space-y-1 font-mono text-[11px]">
          <li v-for="r in currentRoleMeta.allowedRoutes" :key="r">{{ r }}</li>
        </ul>
      </div>

      <div class="flex items-center justify-center gap-3">
        <AppButton variant="secondary" size="sm" @click="router.push('/overview')">
          Return to Overview
        </AppButton>
        <AppButton variant="primary" size="sm" @click="handleSwitchToAdmin">
          Switch to Admin (Demo)
        </AppButton>
      </div>
    </div>
  </PageContainer>
</template>
