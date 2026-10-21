<script setup lang="ts">
import { ref } from 'vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatCurrency, formatDate } from '@/utils/format'

interface PlatformOrder {
  id: string
  clientName: string
  item: string
  amount: number
  date: string
  status: string
}

const orders = ref<PlatformOrder[]>([])

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

    <DataTable
      :columns="columns"
      :rows="orders"
      empty-title="No SaaS platform orders placed yet"
      empty-description="Client tier subscriptions and module purchases will be tracked here."
    >
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
