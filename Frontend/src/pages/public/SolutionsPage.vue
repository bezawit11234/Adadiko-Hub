<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'

const industries = [
  {
    title: 'Commercial Wholesale & Distribution',
    description: 'Manage high-frequency sales orders, volume customer discounts, packing slip dispatches, and outstanding customer debt.',
    icon: 'truck',
    features: ['Real-time stock alerts for dispatchers', 'Instant invoice generation from shipped orders', 'Credit limits and customer debt timeline'],
  },
  {
    title: 'Renewable Energy & Solar Installers',
    description: 'Track serialized batteries and hybrid inverters, coordinate warehouse dispatches to field teams, and log progress payments.',
    icon: 'zap',
    features: ['Safety stock reserve levels', 'Multi-line quotation to sales order conversion', 'Custom territory assignments for sales reps'],
  },
  {
    title: 'Manufacturing & Workshop Assembly',
    description: 'Connect quotation margins directly to raw material stocks and finished assembly dispatches with role-based operator controls.',
    icon: 'cpu',
    features: ['Role-separated storekeeper packing queue', 'Manager approvals for margin discounts', 'Future Frappe v16 BOM & Work Order linkage'],
  },
]
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
    <div class="max-w-3xl space-y-4">
      <Badge variant="signal" size="sm">Tailored Workflows</Badge>
      <h1 class="text-4xl sm:text-5xl font-black text-ink font-heading tracking-tight">
        Engineered for operational speed in physical commerce
      </h1>
      <p class="text-base text-ink-muted leading-relaxed">
        Generic accounting packages force your business into stiff spreadsheets. Adadiko Hub adapts to your actual order-to-cash velocity.
      </p>
    </div>

    <!-- Industry Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div
        v-for="(ind, idx) in industries"
        :key="idx"
        class="bg-white rounded-3xl border border-stone-border p-8 shadow-soft flex flex-col justify-between hover:shadow-card transition-all"
      >
        <div class="space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-signal-subtle text-signal flex items-center justify-center">
            <AppIcon :name="ind.icon" :size="24" />
          </div>
          <h3 class="text-xl font-bold text-ink font-heading">
            {{ ind.title }}
          </h3>
          <p class="text-xs text-ink-muted leading-relaxed">
            {{ ind.description }}
          </p>

          <div class="pt-4 border-t border-stone-border space-y-2.5">
            <div
              v-for="(f, i) in ind.features"
              :key="i"
              class="flex items-start gap-2 text-xs text-ink"
            >
              <AppIcon name="check" :size="14" className="text-status-green mt-0.5" />
              <span>{{ f }}</span>
            </div>
          </div>
        </div>

        <div class="pt-6 mt-6 border-t border-stone-border">
          <RouterLink to="/checkout">
            <AppButton variant="outline" size="sm" block>
              Configure Solution Workspace
            </AppButton>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
