<script setup lang="ts">
import { ref } from 'vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatCurrency, formatDate } from '@/utils/format'

const orders = ref([
  { id: 'ORD-SaaS-901', clientName: 'Horizon Smart Solar Ltd', item: 'Enterprise Plan + 2 Modules', amount: 389.0, date: '2026-03-01', status: 'Completed' },
  { id: 'ORD-SaaS-899', clientName: 'Sahara Grocers Cooperative', item: 'Growth Suite Starter', amount: 119.0, date: '2026-02-28', status: 'Completed' },
  { id: 'ORD-SaaS-884', clientName: 'Apex Wholesale Ltd', item: 'Growth Suite Monthly', amount: 119.0, date: '2026-02-15', status: 'Completed' },
  { id: 'ORD-SaaS-872', clientName: 'Atlas Industrial Workshop', item: 'Starter Workspace', amount: 49.0, date: '2026-02-01', status: 'Completed' },
])

const columns: Column[] = [
  { key: 'id', label: 'Order #' },
  { key: 'clientName', label: 'Client Organization' },
  { key: 'item', label: 'Subscription / Add-On' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Billed Amount', align: 'right' },
]
</script>

<template>
  <PageContainer max-width="2xl">
    <SampleNotice text="Back Office Platform Orders: New workspace license transactions and tier upgrades." />

    <SectionHeading
      title="Platform SaaS Orders"
      description="Record of software subscription sales and modular upgrades across organizations."
    >
      <template #badge>
        <Badge variant="signal" size="sm">{{ orders.length }} Platform Orders</Badge>
      </template>
    </SectionHeading>

    <DataTable :columns="columns" :rows="orders">
      <template #id="{ value }">
        <span class="font-mono font-bold text-ink">{{ value }}</span>
      </template>

      <template #clientName="{ value }">
        <span class="font-bold text-ink">{{ value }}</span>
      </template>

      <template #item="{ value }">
        <span class="text-xs text-ink">{{ value }}</span>
      </template>

      <template #date="{ value }">
        <span class="text-xs text-ink-muted">{{ formatDate(value) }}</span>
      </template>

      <template #status="{ value }">
        <Badge variant="success" size="sm" dot>
          {{ value }}
        </Badge>
      </template>

      <template #amount="{ value }">
        <span class="font-extrabold text-ink num-tabular">{{ formatCurrency(value) }}</span>
      </template>
    </DataTable>
  </PageContainer>
</template>
