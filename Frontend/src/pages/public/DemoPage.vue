<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ROLE_DEFINITIONS } from '@/data/roles'
import type { Role } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'

const roleCards: { role: Role; icon: string; highlight: string }[] = [
  { role: 'sales_rep', icon: 'home', highlight: 'Daily follow-up tasks, quotation creation, sales orders, and customer directory.' },
  { role: 'sales_manager', icon: 'dashboard', highlight: 'Revenue analytics, SVG trend charts, team performance, and order discount authorizations.' },
  { role: 'admin', icon: 'user', highlight: 'Full workspace permissions, invite team members, adjust subscribed modules and billing.' },
  { role: 'accountant', icon: 'invoices', highlight: 'Invoices & receivables oversight, record incoming customer payments and reconciliation.' },
  { role: 'storekeeper', icon: 'truck', highlight: 'Warehouse fulfillment queue, packing slip generation, and delivery note dispatch.' },
]
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
    <div class="text-center max-w-2xl mx-auto space-y-3">
      <Badge variant="signal" size="sm">Workspace Architecture</Badge>
      <h1 class="text-3xl sm:text-4xl font-black text-ink font-heading tracking-tight">
        Role-Based Access in Adadiko Hub
      </h1>
      <p class="text-sm text-ink-muted">
        Adadiko Hub operates from a clean state. Create a new organization workspace to start managing sales pipelines, orders, deliveries, and team members.
      </p>

      <div class="flex items-center justify-center gap-4 pt-4">
        <RouterLink to="/checkout">
          <AppButton variant="primary" size="md">
            <AppIcon name="plus" :size="16" />
            <span>Create New Workspace</span>
          </AppButton>
        </RouterLink>
        <RouterLink to="/sign-in">
          <AppButton variant="outline" size="md">
            <span>Sign In</span>
          </AppButton>
        </RouterLink>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="item in roleCards"
        :key="item.role"
        class="bg-white rounded-3xl border border-stone-border p-6 shadow-soft flex flex-col justify-between hover:shadow-card transition-all"
      >
        <div class="space-y-4">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-stone-bg border border-stone-border flex items-center justify-center text-ink-navy">
              <AppIcon :name="item.icon" :size="24" />
            </div>
            <Badge variant="neutral" size="sm">{{ ROLE_DEFINITIONS[item.role].erpnextRole }}</Badge>
          </div>

          <div>
            <h3 class="text-lg font-bold text-ink font-heading">
              {{ ROLE_DEFINITIONS[item.role].label }}
            </h3>
            <p class="text-xs text-signal font-semibold mt-1">
              ERPNext Role: {{ ROLE_DEFINITIONS[item.role].erpnextRole }}
            </p>
            <p class="text-xs text-ink-muted mt-2 leading-relaxed">
              {{ item.highlight }}
            </p>
          </div>
        </div>

        <div class="pt-6 mt-6 border-t border-stone-border">
          <RouterLink to="/checkout">
            <AppButton variant="subtle" size="sm" block>
              <span>Get Started as {{ ROLE_DEFINITIONS[item.role].label }}</span>
            </AppButton>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
