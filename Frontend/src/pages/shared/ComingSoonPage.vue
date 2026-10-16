<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { MODULE_CATALOG } from '@/data/catalog'
import type { ModuleKey } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'

const props = withDefaults(
  defineProps<{
    moduleKey: ModuleKey
    title?: string
  }>(),
  {
    title: 'Module',
  }
)

const moduleInfo = computed(() => {
  return MODULE_CATALOG.find((m) => m.id === props.moduleKey) || MODULE_CATALOG[1]
})
</script>

<template>
  <PageContainer max-width="lg">
    <div class="space-y-6">
      <SampleNotice text="Sales module is live and fully functional. Inventory, Purchasing, Finance, and Manufacturing are currently in schema design for ERPNext v16." />

      <div class="bg-white rounded-3xl border border-stone-border shadow-card p-8 sm:p-12 text-center space-y-6">
        <div
          class="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-soft"
          :style="{ backgroundColor: moduleInfo.color }"
        >
          <AppIcon :name="moduleInfo.id" :size="32" />
        </div>

        <div class="space-y-2">
          <Badge variant="signal" size="sm" dot>Next Development Phase</Badge>
          <h1 class="text-2xl sm:text-3xl font-black text-ink font-heading">
            {{ moduleInfo.title }} is Coming Soon
          </h1>
          <p class="text-sm text-ink-muted max-w-lg mx-auto leading-relaxed">
            {{ moduleInfo.description }}
          </p>
        </div>

        <!-- Planned Features Preview -->
        <div class="max-w-md mx-auto text-left pt-4 border-t border-stone-border space-y-3">
          <p class="text-xs font-bold uppercase tracking-wider text-ink font-heading">
            Planned ERPNext Integration Capabilities:
          </p>
          <div class="space-y-2 text-xs text-ink-muted">
            <div
              v-for="(f, idx) in moduleInfo.includedFeatures"
              :key="idx"
              class="flex items-start gap-2.5"
            >
              <div class="w-4 h-4 rounded-full bg-status-green-bg text-status-green flex items-center justify-center shrink-0 mt-0.5">
                <AppIcon name="check" :size="10" />
              </div>
              <span>{{ f }}</span>
            </div>
          </div>
        </div>

        <div class="pt-6 border-t border-stone-border flex flex-wrap items-center justify-center gap-3">
          <RouterLink to="/app/sales">
            <AppButton variant="primary" size="md">
              <span>Work in Sales Module</span>
              <AppIcon name="arrow-right" :size="16" />
            </AppButton>
          </RouterLink>
          <RouterLink to="/app/sales/orders/new">
            <AppButton variant="outline" size="md">
              Create New Sales Order
            </AppButton>
          </RouterLink>
        </div>
      </div>
    </div>
  </PageContainer>
</template>
