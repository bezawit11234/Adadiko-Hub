<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import StatCard from '@/components/common/StatCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatCurrency } from '@/utils/format'

interface PlatformEvent {
  id: string
  text: string
  time: string
  color: string
}

const clientCount = ref(0)
const totalMrr = ref(0)
const modulesCount = ref(0)
const events = ref<PlatformEvent[]>([])

onMounted(() => {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('adadiko_mock_accounts')
      if (raw) {
        const accounts = JSON.parse(raw)
        clientCount.value = accounts.length
        let totalMod = 0
        accounts.forEach((acc: any) => {
          const mods = acc.organization?.subscribedModules || []
          totalMod += mods.length
        })
        modulesCount.value = totalMod
        totalMrr.value = accounts.length * 49
        events.value = accounts.map((acc: any) => ({
          id: acc.organization?.id || Math.random().toString(),
          text: `Tenant ${acc.organization?.name || 'Workspace'} provisioned with ${acc.organization?.subscribedModules?.join(', ') || 'sales'} module`,
          time: 'Active',
          color: 'bg-status-green',
        }))
      }
    } catch {
      clientCount.value = 0
      totalMrr.value = 0
      modulesCount.value = 0
      events.value = []
    }
  }
})
</script>

<template>
  <PageContainer max-width="2xl">
    <SampleNotice text="Adadiko Platform Operator Back Office: Multi-tenant management, SaaS subscriptions, and platform telemetry." />

    <SectionHeading
      title="Adadiko Platform HQ Overview"
      description="Central command center for Adadiko staff managing client organizations, SaaS subscriptions, and catalog offerings."
    >
      <template #badge>
        <Badge variant="signal" size="sm">Adadiko Operator HQ</Badge>
      </template>
      <template #actions>
        <RouterLink to="/admin/clients">
          <AppButton variant="primary" size="sm">
            <AppIcon name="building" :size="16" />
            <span>View Client Orgs</span>
          </AppButton>
        </RouterLink>
      </template>
    </SectionHeading>

    <!-- Top Platform KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Active Client Orgs"
        :value="`${clientCount} Companies`"
        subtitle="Registered tenants"
        icon="building"
        trend="neutral"
        trend-value="Clean state"
        variant="signal"
      />

      <StatCard
        title="Platform MRR"
        :value="formatCurrency(totalMrr)"
        subtitle="Monthly recurring revenue"
        icon="dollar-sign"
        trend="neutral"
        trend-value="Baseline"
      />

      <StatCard
        title="Active Modules Deployed"
        :value="`${modulesCount} Modules`"
        subtitle="Across all client tenants"
        icon="layers"
        trend="neutral"
        trend-value="Catalog active"
      />

      <StatCard
        title="Frappe Cloud Cluster"
        value="Operational"
        subtitle="Tenant database isolation"
        icon="shield"
        trend="up"
        trend-value="Optimal"
      />
    </div>

    <!-- Quick Navigation Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <RouterLink
        to="/admin/clients"
        class="p-5 bg-white rounded-2xl border border-stone-border shadow-soft hover:shadow-card transition-all group"
      >
        <div class="w-10 h-10 rounded-xl bg-signal-subtle text-signal flex items-center justify-center mb-3 group-hover:bg-signal group-hover:text-white transition-colors">
          <AppIcon name="building" :size="20" />
        </div>
        <h4 class="text-sm font-bold text-ink">Client Orgs</h4>
        <p class="text-xs text-ink-muted mt-1">Tenant directory & status</p>
      </RouterLink>

      <RouterLink
        to="/admin/subscriptions"
        class="p-5 bg-white rounded-2xl border border-stone-border shadow-soft hover:shadow-card transition-all group"
      >
        <div class="w-10 h-10 rounded-xl bg-status-green-bg text-status-green flex items-center justify-center mb-3 group-hover:bg-status-green group-hover:text-white transition-colors">
          <AppIcon name="credit-card" :size="20" />
        </div>
        <h4 class="text-sm font-bold text-ink">Subscriptions</h4>
        <p class="text-xs text-ink-muted mt-1">SaaS recurring billings</p>
      </RouterLink>

      <RouterLink
        to="/admin/orders"
        class="p-5 bg-white rounded-2xl border border-stone-border shadow-soft hover:shadow-card transition-all group"
      >
        <div class="w-10 h-10 rounded-xl bg-status-blue-bg text-status-blue flex items-center justify-center mb-3 group-hover:bg-status-blue group-hover:text-white transition-colors">
          <AppIcon name="orders" :size="20" />
        </div>
        <h4 class="text-sm font-bold text-ink">Platform Orders</h4>
        <p class="text-xs text-ink-muted mt-1">New client signups</p>
      </RouterLink>

      <RouterLink
        to="/admin/catalog"
        class="p-5 bg-white rounded-2xl border border-stone-border shadow-soft hover:shadow-card transition-all group"
      >
        <div class="w-10 h-10 rounded-xl bg-stone-bg text-ink flex items-center justify-center mb-3 group-hover:bg-ink-navy group-hover:text-white transition-colors">
          <AppIcon name="catalog" :size="20" />
        </div>
        <h4 class="text-sm font-bold text-ink">Catalog</h4>
        <p class="text-xs text-ink-muted mt-1">Marketplace pricing</p>
      </RouterLink>

      <RouterLink
        to="/admin/logs"
        class="p-5 bg-white rounded-2xl border border-stone-border shadow-soft hover:shadow-card transition-all group"
      >
        <div class="w-10 h-10 rounded-xl bg-stone-bg text-ink flex items-center justify-center mb-3 group-hover:bg-ink-navy group-hover:text-white transition-colors">
          <AppIcon name="command" :size="20" />
        </div>
        <h4 class="text-sm font-bold text-ink">Audit Logs</h4>
        <p class="text-xs text-ink-muted mt-1">API & security audit</p>
      </RouterLink>
    </div>

    <!-- Recent Platform Activity Feed -->
    <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 sm:p-8 space-y-4">
      <h3 class="text-base font-bold text-ink font-heading pb-2 border-b border-stone-border flex items-center justify-between">
        <span>Recent Platform Events</span>
        <span class="text-xs text-ink-muted">Multi-tenant provision stream</span>
      </h3>

      <div v-if="events.length === 0" class="py-8 text-center text-xs text-ink-muted">
        No recent platform events recorded yet. New workspace registrations will appear here.
      </div>

      <div v-else class="space-y-3 text-xs">
        <div
          v-for="ev in events"
          :key="ev.id"
          class="p-3.5 rounded-xl bg-stone-bg/50 border border-stone-border flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <span :class="['w-2 h-2 rounded-full', ev.color]" />
            <span class="text-ink">{{ ev.text }}</span>
          </div>
          <span class="text-ink-muted font-mono">{{ ev.time }}</span>
        </div>
      </div>
    </div>
  </PageContainer>
</template>
