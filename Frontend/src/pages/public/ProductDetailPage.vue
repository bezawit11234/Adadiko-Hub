<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { MODULE_CATALOG } from '@/data/catalog'
import type { ModuleKey } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import { formatCurrency } from '@/utils/format'

const route = useRoute()
const moduleId = computed(() => route.params.id as ModuleKey)

const moduleProduct = computed(() => {
  return MODULE_CATALOG.find((m) => m.id === moduleId.value) || MODULE_CATALOG[0]
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-xs text-ink-muted">
      <RouterLink to="/products" class="hover:text-ink">Marketplace</RouterLink>
      <span>/</span>
      <span class="text-ink font-semibold">{{ moduleProduct.title }}</span>
    </div>

    <!-- Main Module Header -->
    <div class="bg-white rounded-3xl border border-stone-border shadow-card p-6 sm:p-10 space-y-8">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-stone-border">
        <div class="flex items-start gap-4">
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
            :style="{ backgroundColor: moduleProduct.color }"
          >
            <AppIcon :name="moduleProduct.id" :size="32" />
          </div>
          <div class="space-y-1.5">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl sm:text-3xl font-black text-ink font-heading">
                {{ moduleProduct.title }}
              </h1>
              <Badge :variant="moduleProduct.isCore ? 'signal' : 'neutral'" size="sm" dot>
                {{ moduleProduct.badge }}
              </Badge>
            </div>
            <p class="text-base text-ink-muted">
              {{ moduleProduct.tagline }}
            </p>
          </div>
        </div>

        <div class="text-right shrink-0">
          <div class="text-3xl font-black text-ink font-heading num-tabular">
            {{ formatCurrency(moduleProduct.monthlyPrice) }}
          </div>
          <p class="text-xs text-ink-muted">per company / month</p>
          <div class="mt-3">
            <RouterLink :to="`/checkout?module=${moduleProduct.id}`">
              <AppButton variant="primary" size="md">
                Subscribe to Module
              </AppButton>
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Detailed Overview -->
      <div class="space-y-4">
        <h2 class="text-lg font-bold text-ink font-heading">
          Architecture Overview
        </h2>
        <p class="text-sm text-ink-muted leading-relaxed">
          {{ moduleProduct.description }}
        </p>
      </div>

      <!-- Feature Matrix -->
      <div class="space-y-4">
        <h2 class="text-lg font-bold text-ink font-heading">
          Capabilities Included in this Module
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="(f, i) in moduleProduct.includedFeatures"
            :key="i"
            class="p-3.5 rounded-xl bg-stone-subtle border border-stone-border flex items-start gap-3"
          >
            <div class="w-5 h-5 rounded-full bg-status-green-bg text-status-green flex items-center justify-center shrink-0 mt-0.5">
              <AppIcon name="check" :size="12" />
            </div>
            <span class="text-xs font-medium text-ink leading-relaxed">{{ f }}</span>
          </div>
        </div>
      </div>

      <!-- ERPNext Integration Readiness Note -->
      <div class="p-5 rounded-2xl bg-stone-bg border border-stone-border space-y-2">
        <div class="flex items-center gap-2">
          <AppIcon name="shield" :size="16" className="text-signal" />
          <h4 class="text-xs font-bold uppercase tracking-wider text-ink font-heading">
            Frappe v16 & ERPNext Integration Architecture
          </h4>
        </div>
        <p class="text-xs text-ink-muted leading-relaxed">
          When connected to an ERPNext instance, this module writes directly to the official DocTypes with standard naming conventions, transaction validation hooks, and double-entry general ledger journal triggers.
        </p>
      </div>
    </div>
  </div>
</template>
