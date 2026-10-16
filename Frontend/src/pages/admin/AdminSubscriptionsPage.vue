<script setup lang="ts">
import { ref } from 'vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatCurrency, formatDate } from '@/utils/format'

const subs = ref([
  { id: 'SUB-101', orgName: 'Horizon Smart Solar Ltd', tier: 'Enterprise', cycle: 'Monthly', nextBillDate: '2026-04-01', mrr: 389.0, status: 'Active' },
  { id: 'SUB-102', orgName: 'Apex Wholesale Ltd', tier: 'Growth', cycle: 'Monthly', nextBillDate: '2026-04-15', mrr: 119.0, status: 'Active' },
  { id: 'SUB-103', orgName: 'Blue Nile Trading PLC', tier: 'Starter', cycle: 'Monthly', nextBillDate: '2026-04-28', mrr: 49.0, status: 'Active' },
  { id: 'SUB-104', orgName: 'Sahara Grocers Cooperative', tier: 'Growth', cycle: 'Monthly', nextBillDate: '2026-04-01', mrr: 119.0, status: 'Trial' },
])

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

    <DataTable :columns="columns" :rows="subs">
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
