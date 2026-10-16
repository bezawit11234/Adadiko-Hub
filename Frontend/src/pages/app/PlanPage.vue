<script setup lang="ts">
import { computed } from 'vue'
import { useSession } from '@/composables/useSession'
import { useToast } from '@/composables/useToast'
import { MODULE_CATALOG, PRICING_TIERS } from '@/data/catalog'
import type { ModuleKey } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatCurrency } from '@/utils/format'

const { currentOrg, toggleSubscribedModule } = useSession()
const toast = useToast()

const activeTier = computed(() => {
  return PRICING_TIERS.find((p) => p.id === currentOrg.value.plan) || PRICING_TIERS[1]
})

function handleToggleModule(moduleKey: ModuleKey, title: string) {
  const isCurrentlySubscribed = currentOrg.value.subscribedModules.includes(moduleKey)
  toggleSubscribedModule(moduleKey)
  if (isCurrentlySubscribed) {
    toast.info('Module Removed', `${title} was removed from your active workspace plan.`)
  } else {
    toast.success('Module Added', `${title} is now enabled for your workspace!`)
  }
}

// Compute total monthly invoice
const totalMonthlyCost = computed(() => {
  let cost = activeTier.value.monthlyBasePrice
  // Calculate extra modules
  const extraCount = Math.max(0, currentOrg.value.subscribedModules.length - 1)
  cost += extraCount * 30
  return cost
})
</script>

<template>
  <PageContainer max-width="2xl">
    <SampleNotice text="Workspace Plan & Subscriptions: Manage organization modules and simulate SaaS billing totals." />

    <SectionHeading
      title="Workspace Plan & Modules"
      description="Review what your company bought, activate extra business modules, and monitor billing."
    >
      <template #badge>
        <Badge variant="signal" size="sm" class="uppercase">Plan: {{ currentOrg.plan }}</Badge>
      </template>
    </SectionHeading>

    <!-- ACTIVE SUBSCRIPTION SUMMARY CARD -->
    <div class="bg-white rounded-3xl border border-stone-border shadow-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <Badge variant="success" size="sm" dot>Active Workspace</Badge>
          <span class="text-xs text-ink-muted">Billed Monthly</span>
        </div>
        <h2 class="text-2xl font-black text-ink font-heading">
          {{ activeTier.name }}
        </h2>
        <p class="text-xs text-ink-muted max-w-md">
          Includes up to {{ activeTier.includedUsers }} seats and dedicated multi-tenant data storage.
        </p>
      </div>

      <div class="p-4 rounded-2xl bg-stone-bg border border-stone-border text-right shrink-0">
        <span class="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
          Current Monthly Total
        </span>
        <span class="text-3xl font-black text-ink font-heading num-tabular block">
          {{ formatCurrency(totalMonthlyCost) }}
        </span>
        <span class="text-[11px] text-ink-light block mt-0.5">
          {{ currentOrg.subscribedModules.length }} modules active
        </span>
      </div>
    </div>

    <!-- WHAT WAS BOUGHT (Active Subscriptions) -->
    <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4">
      <h3 class="text-base font-bold text-ink font-heading pb-2 border-b border-stone-border flex items-center justify-between">
        <span>What Was Bought (Active Subscriptions)</span>
        <span class="text-xs text-status-green font-semibold flex items-center gap-1">
          <AppIcon name="check-circle" :size="14" />
          <span>{{ currentOrg.subscribedModules.length }} Modules Subscribed</span>
        </span>
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          v-for="modKey in currentOrg.subscribedModules"
          :key="modKey"
          class="p-4 rounded-2xl bg-signal-subtle/40 border border-signal/30 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-signal text-white flex items-center justify-center font-bold">
              <AppIcon :name="modKey" :size="18" />
            </div>
            <div>
              <p class="text-xs font-bold text-ink uppercase">{{ modKey }} Pipeline</p>
              <p class="text-[11px] text-status-green font-semibold">Active & Operational</p>
            </div>
          </div>
          <Badge variant="signal" size="sm">Subscribed</Badge>
        </div>
      </div>
    </div>

    <!-- ADD OR REMOVE MODULE CARDS -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-ink font-heading">
            Add or Remove Workspace Modules
          </h3>
          <p class="text-xs text-ink-muted">
            Toggle modules below. Your client workspace routes and sidebar will adapt immediately.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="mod in MODULE_CATALOG"
          :key="mod.id"
          :class="[
            'bg-white rounded-2xl border p-6 shadow-soft flex flex-col justify-between transition-all',
            currentOrg.subscribedModules.includes(mod.id)
              ? 'border-signal ring-1 ring-signal/20'
              : 'border-stone-border opacity-90',
          ]"
        >
          <div class="space-y-3">
            <div class="flex items-start justify-between">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                :style="{ backgroundColor: mod.color }"
              >
                <AppIcon :name="mod.id" :size="20" />
              </div>
              <Badge
                :variant="currentOrg.subscribedModules.includes(mod.id) ? 'signal' : 'neutral'"
                size="sm"
              >
                {{ currentOrg.subscribedModules.includes(mod.id) ? 'Enabled' : 'Disabled' }}
              </Badge>
            </div>

            <div>
              <h4 class="text-base font-bold text-ink font-heading">
                {{ mod.title }}
              </h4>
              <p class="text-xs text-ink-muted leading-relaxed mt-1">
                {{ mod.tagline }}
              </p>
            </div>

            <div class="text-xs font-bold text-ink num-tabular font-heading">
              {{ formatCurrency(mod.monthlyPrice) }} / month
            </div>
          </div>

          <div class="pt-4 mt-4 border-t border-stone-border">
            <AppButton
              :variant="currentOrg.subscribedModules.includes(mod.id) ? 'outline' : 'primary'"
              size="sm"
              block
              @click="handleToggleModule(mod.id, mod.title)"
            >
              <AppIcon :name="currentOrg.subscribedModules.includes(mod.id) ? 'x' : 'plus'" :size="14" />
              <span>
                {{ currentOrg.subscribedModules.includes(mod.id) ? 'Remove from Workspace' : 'Add to Workspace' }}
              </span>
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  </PageContainer>
</template>
