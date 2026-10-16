<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { MODULE_CATALOG } from '@/data/catalog'
import type { ModuleKey } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'

const route = useRoute()
const moduleKey = computed(() => route.params.module as ModuleKey)

const moduleInfo = computed(() => {
  return MODULE_CATALOG.find((m) => m.id === moduleKey.value) || {
    id: moduleKey.value,
    title: 'Functional Module',
    tagline: 'This module is not currently included in your company subscription.',
    monthlyPrice: 39,
  }
})
</script>

<template>
  <PageContainer max-width="md">
    <div class="bg-white rounded-3xl border border-stone-border shadow-card p-8 sm:p-12 text-center space-y-6">
      <div class="w-16 h-16 rounded-2xl bg-signal-subtle text-signal mx-auto flex items-center justify-center">
        <AppIcon name="lock" :size="32" />
      </div>

      <div class="space-y-2">
        <Badge variant="signal" size="sm">Module Not Subscribed</Badge>
        <h1 class="text-2xl sm:text-3xl font-black text-ink font-heading">
          {{ moduleInfo.title }} is Locked
        </h1>
        <p class="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
          Your organization has not added this module to your current plan. Company administrators can activate it immediately with one click.
        </p>
      </div>

      <div class="p-4 rounded-2xl bg-stone-bg border border-stone-border text-xs text-ink-muted text-left space-y-2 max-w-sm mx-auto">
        <div class="flex justify-between">
          <span>Module:</span>
          <strong class="text-ink">{{ moduleInfo.title }}</strong>
        </div>
        <div class="flex justify-between">
          <span>Pricing:</span>
          <span class="font-bold text-ink num-tabular">${{ moduleInfo.monthlyPrice }} / month</span>
        </div>
      </div>

      <div class="pt-4 flex flex-wrap items-center justify-center gap-3">
        <RouterLink to="/app/plan">
          <AppButton variant="primary" size="md">
            <span>Upgrade Workspace Plan</span>
            <AppIcon name="arrow-right" :size="16" />
          </AppButton>
        </RouterLink>
        <RouterLink to="/app/sales">
          <AppButton variant="outline" size="md">
            Return to Sales
          </AppButton>
        </RouterLink>
      </div>
    </div>
  </PageContainer>
</template>
