<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import { useToast } from '@/composables/useToast'
import type { Quotation } from '@/types'
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
const toast = useToast()

const quotations = ref<Quotation[]>([])
const loading = ref(true)
const search = ref('')

const columns: Column[] = [
  { key: 'id', label: 'Quotation #' },
  { key: 'customerName', label: 'Customer' },
  { key: 'date', label: 'Date' },
  { key: 'validTill', label: 'Valid Until' },
  { key: 'status', label: 'Status' },
  { key: 'grandTotal', label: 'Grand Total', align: 'right' },
  { key: 'action', label: 'Next Action', align: 'right' },
]

async function loadQuotations() {
  loading.value = true
  try {
    const res = await salesApi.listQuotations()
    if (res.ok && res.data) {
      quotations.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadQuotations()
})

const filteredQuotations = computed(() => {
  let list = quotations.value
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (item) =>
        item.id.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q)
    )
  }
  return list
})

async function convertToOrder(quote: Quotation) {
  // Convert quotation into new sales order
  const res = await salesApi.createSalesOrder({
    customerName: quote.customerName,
    customerId: quote.customerId,
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [...quote.items],
    subtotal: quote.subtotal,
    taxAmount: quote.taxAmount,
    grandTotal: quote.grandTotal,
    quotationId: quote.id,
    assignedTo: quote.createdBy,
  })

  if (res.ok && res.data) {
    quote.status = 'Ordered'
    toast.success('Order Converted', `Quotation ${quote.id} was converted into Sales Order ${res.data.id}!`)
    router.push(`/app/sales/orders/${res.data.id}`)
  } else {
    toast.error('Conversion failed', res.error)
  }
}
</script>

<template>
  <PageContainer max-width="2xl">
    <SampleNotice text="ERPNext Quotation DocType: Submit quotes to prospects and convert into confirmed Sales Orders in one click." />

    <SectionHeading
      title="Quotations & Proposals"
      description="Track commercial price quotes, validity dates, and convert approved quotes into sales orders."
    >
      <template #badge>
        <Badge variant="signal" size="sm">{{ quotations.length }} Quotations</Badge>
      </template>
      <template #actions>
        <RouterLink to="/app/sales/orders/new">
          <AppButton variant="primary" size="sm">
            <AppIcon name="plus" :size="16" />
            <span>Create New Quote / Order</span>
          </AppButton>
        </RouterLink>
      </template>
    </SectionHeading>

    <!-- Search filter -->
    <div class="bg-white p-4 rounded-2xl border border-stone-border shadow-soft max-w-md">
      <TextField v-model="search" placeholder="Search quotations by # or customer...">
        <template #prefix>
          <AppIcon name="search" :size="16" />
        </template>
      </TextField>
    </div>

    <!-- Table -->
    <DataTable
      :columns="columns"
      :rows="filteredQuotations"
      :loading="loading"
      empty-title="No quotations found"
      empty-description="Draft a new quote or adjust your search filter."
    >
      <template #id="{ value }">
        <span class="font-mono font-bold text-ink">{{ value }}</span>
      </template>

      <template #customerName="{ value }">
        <span class="font-bold text-ink">{{ value }}</span>
      </template>

      <template #date="{ value }">
        <span class="text-xs text-ink-muted">{{ formatDate(value) }}</span>
      </template>

      <template #validTill="{ value }">
        <span class="text-xs text-ink-muted">{{ formatDate(value) }}</span>
      </template>

      <template #status="{ value }">
        <Badge
          :variant="value === 'Ordered' ? 'success' : value === 'Submitted' ? 'warning' : 'neutral'"
          size="sm"
          dot
        >
          {{ value }}
        </Badge>
      </template>

      <template #grandTotal="{ value }">
        <span class="font-bold text-ink num-tabular">{{ formatCurrency(value) }}</span>
      </template>

      <template #action="{ row }">
        <AppButton
          v-if="row.status !== 'Ordered'"
          variant="subtle"
          size="sm"
          @click="convertToOrder(row)"
        >
          <AppIcon name="check" :size="12" />
          <span>Convert to Order</span>
        </AppButton>
        <span v-else class="text-xs text-status-green font-semibold inline-flex items-center gap-1">
          <AppIcon name="check-circle" :size="14" />
          <span>Converted</span>
        </span>
      </template>
    </DataTable>
  </PageContainer>
</template>
