<script setup lang="ts">
import { ref } from 'vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatCurrency, formatDate } from '@/utils/format'

interface PlatformSubscription {
  id: string
  orgName: string
  tier: string
  cycle: string
  nextBillDate: string
  mrr: number
  status: string
}

const subs = ref<PlatformSubscription[]>([])

const columns: Column[] = [
  { key: 'id', label: 'Subscription #' },
  { key: 'orgName', label: 'Organization' },
  { key: 'tier', label: 'Base Plan' },
  { key: 'cycle', label: 'Cycle' },
  { key: 'nextBillDate', label: 'Renewal Date' },
  { key: 'status', label: 'Status' },
  { key: 'mrr', label: 'Monthly MRR', align: 'right' },
]
</script>

<template>
  <PageContainer max-width="2xl">
    <SampleNotice text="Back Office Subscriptions: Recurring billing schedules and SaaS contract status across tenants." />

    <SectionHeading
      title="SaaS Subscriptions"
      description="Monitor recurring revenue contracts, billing cycles, and subscription renewal dates."
    >
      <template #badge>
        <Badge variant="signal" size="sm">Active Recurring</Badge>
      </template>
    </SectionHeading>

    <DataTable
      :columns="columns"
      :rows="subs"
      empty-title="No active recurring subscriptions"
      empty-description="Recurring client contracts and billing renewals will be displayed here."
    >
      <template #id="{ value }">
        <span class="font-mono font-bold text-ink">{{ value }}</span>
      </template>

      <template #orgName="{ value }">
        <span class="font-bold text-ink">{{ value }}</span>
      </template>

      <template #nextBillDate="{ value }">
        <span class="text-xs text-ink-muted">{{ formatDate(value) }}</span>
      </template>

      <template #status="{ value }">
        <Badge :variant="value === 'Active' ? 'success' : 'warning'" size="sm" dot>
          {{ value }}
        </Badge>
      </template>

      <template #mrr="{ value }">
        <span class="font-extrabold text-ink num-tabular">{{ formatCurrency(value) }}</span>
      </template>
    </DataTable>
  </PageContainer>
</template>
