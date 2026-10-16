<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import type { SalesOrder } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import TextField from '@/components/common/TextField.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatCurrency, formatDate } from '@/utils/format'

const router = useRouter()
const salesApi = getSalesApi()

const orders = ref<SalesOrder[]>([])
const loading = ref(true)
const search = ref('')
const activeFilter = ref<'all' | 'to_deliver' | 'to_bill' | 'completed'>('all')

const columns: Column[] = [
  { key: 'id', label: 'Order #' },
  { key: 'customerName', label: 'Customer' },
  { key: 'orderDate', label: 'Order Date' },
  { key: 'deliveryDate', label: 'Target Delivery' },
  { key: 'stage', label: 'Current Stage' },
  { key: 'status', label: 'Status' },
  { key: 'grandTotal', label: 'Grand Total', align: 'right' },
]

async function loadOrders() {
  loading.value = true
  try {
    const res = await salesApi.listSalesOrders()
    if (res.ok && res.data) {
      orders.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrders()
})

const filteredOrders = computed(() => {
  let list = orders.value
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
    )
  }

  if (activeFilter.value === 'to_deliver') {
    list = list.filter((o) => o.deliveryStatus === 'Not Delivered')
  } else if (activeFilter.value === 'to_bill') {
    list = list.filter((o) => o.billingStatus !== 'Paid' && o.deliveryStatus === 'Fully Delivered')
  } else if (activeFilter.value === 'completed') {
    list = list.filter((o) => o.status === 'Completed')
  }

  return list
})

function onRowClick(row: SalesOrder) {
  router.push(`/app/sales/orders/${row.id}`)
}
</script>

<template>
  <PageContainer max-width="2xl">
    <SampleNotice text="ERPNext Sales Order DocType: Master commercial contract driving Delivery Note packing and Sales Invoice billing." />

    <SectionHeading
      title="Sales Orders"
      description="Track orders from confirmation through dispatch, billing, and full cash reconciliation."
    >
      <template #badge>
        <Badge variant="signal" size="sm">{{ orders.length }} Total Orders</Badge>
      </template>
      <template #actions>
        <RouterLink to="/app/sales/orders/new">
          <AppButton variant="primary" size="sm">
            <AppIcon name="plus" :size="16" />
            <span>New Sales Order</span>
          </AppButton>
        </RouterLink>
      </template>
    </SectionHeading>

    <!-- Search & Filter bar -->
    <div class="bg-white p-4 rounded-2xl border border-stone-border shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="max-w-md w-full">
        <TextField v-model="search" placeholder="Search orders by # or customer name...">
          <template #prefix>
            <AppIcon name="search" :size="16" />
          </template>
        </TextField>
      </div>

      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
            activeFilter === 'all' ? 'bg-ink-navy text-white' : 'bg-stone-bg text-ink-muted hover:text-ink',
          ]"
          @click="activeFilter = 'all'"
        >
          All ({{ orders.length }})
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
            activeFilter === 'to_deliver' ? 'bg-ink-navy text-white' : 'bg-stone-bg text-ink-muted hover:text-ink',
          ]"
          @click="activeFilter = 'to_deliver'"
        >
          To Deliver
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
            activeFilter === 'to_bill' ? 'bg-ink-navy text-white' : 'bg-stone-bg text-ink-muted hover:text-ink',
          ]"
          @click="activeFilter = 'to_bill'"
        >
          To Bill
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
            activeFilter === 'completed' ? 'bg-ink-navy text-white' : 'bg-stone-bg text-ink-muted hover:text-ink',
          ]"
          @click="activeFilter = 'completed'"
        >
          Completed
        </button>
      </div>
    </div>

    <!-- Table -->
    <DataTable
      :columns="columns"
      :rows="filteredOrders"
      :loading="loading"
      row-clickable
      empty-title="No sales orders found"
      empty-description="Create your first sales order using the form button above."
      @row-click="onRowClick"
    >
      <template #id="{ value }">
        <span class="font-mono font-bold text-ink hover:text-signal transition-colors">{{ value }}</span>
      </template>

      <template #customerName="{ value }">
        <span class="font-bold text-ink">{{ value }}</span>
      </template>

      <template #orderDate="{ value }">
        <span class="text-xs text-ink-muted">{{ formatDate(value) }}</span>
      </template>

      <template #deliveryDate="{ value }">
        <span class="text-xs text-ink-muted">{{ formatDate(value) }}</span>
      </template>

      <template #stage="{ value }">
        <Badge variant="signal" size="sm" dot>
          {{ value }}
        </Badge>
      </template>

      <template #status="{ value }">
        <Badge
          :variant="value === 'Completed' ? 'success' : value.includes('Deliver') ? 'warning' : 'neutral'"
          size="sm"
        >
          {{ value }}
        </Badge>
      </template>

      <template #grandTotal="{ value }">
        <span class="font-bold text-ink num-tabular">{{ formatCurrency(value) }}</span>
      </template>
    </DataTable>
  </PageContainer>
</template>
