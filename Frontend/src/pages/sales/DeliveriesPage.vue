<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getSalesApi } from '@/services/sales'
import { useToast } from '@/composables/useToast'
import { useSession } from '@/composables/useSession'
import type { DeliveryNote, SalesOrder } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatDate } from '@/utils/format'

const salesApi = getSalesApi()
const toast = useToast()
const { currentRole } = useSession()

const deliveries = ref<DeliveryNote[]>([])
const orders = ref<SalesOrder[]>([])
const loading = ref(true)
const creatingDeliveryId = ref<string | null>(null)

const columns: Column[] = [
  { key: 'id', label: 'Delivery Note #' },
  { key: 'salesOrderId', label: 'Order Ref' },
  { key: 'customerName', label: 'Customer' },
  { key: 'postingDate', label: 'Dispatch Date' },
  { key: 'carrier', label: 'Carrier / Logistics' },
  { key: 'status', label: 'Status' },
]

async function loadData() {
  loading.value = true
  try {
    const [delRes, ordersRes] = await Promise.all([
      salesApi.listDeliveries(),
      salesApi.listSalesOrders(),
    ])
    if (delRes.ok && delRes.data) deliveries.value = delRes.data
    if (ordersRes.ok && ordersRes.data) orders.value = ordersRes.data
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

// Orders waiting for storekeeper fulfillment dispatch
const ordersWaitingDelivery = computed(() => {
  return orders.value.filter((o) => o.deliveryStatus === 'Not Delivered')
})

async function handleCreateDelivery(salesOrderId: string) {
  creatingDeliveryId.value = salesOrderId
  try {
    const res = await salesApi.createDelivery(salesOrderId)
    if (res.ok && res.data) {
      toast.success(
        'Delivery Note Created',
        `Dispatched items under Note ${res.data.id} for ${res.data.customerName}!`
      )
      await loadData()
    } else {
      toast.error('Dispatch Failed', res.error)
    }
  } finally {
    creatingDeliveryId.value = null
  }
}
</script>

<template>
  <PageContainer max-width="2xl">
    <SectionHeading
      title="Deliveries & Warehouse Dispatch"
      description="Storekeeper fulfillment workspace. Review orders awaiting packing slips and print dispatch notes."
    >
      <template #badge>
        <Badge variant="signal" size="sm">Storekeeper Queue</Badge>
      </template>
    </SectionHeading>

    <!-- SECTION 1: ORDERS WAITING FOR DELIVERY (Prominent Storekeeper Action Queue) -->
    <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-stone-border">
        <div class="flex items-center gap-2">
          <AppIcon name="truck" :size="18" className="text-signal" />
          <h2 class="text-base font-bold text-ink font-heading">
            Orders Waiting for Delivery
          </h2>
          <Badge v-if="ordersWaitingDelivery.length > 0" variant="warning" size="sm">
            {{ ordersWaitingDelivery.length }} In Queue
          </Badge>
        </div>
        <span class="text-xs text-ink-muted">Main Store Fulfillment</span>
      </div>

      <div v-if="ordersWaitingDelivery.length === 0" class="py-8 text-center text-xs text-ink-muted">
        All approved sales orders have been packaged and dispatched.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="order in ordersWaitingDelivery"
          :key="order.id"
          class="p-4 rounded-2xl bg-stone-bg/50 border border-stone-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-bg transition-colors"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-ink">{{ order.id }}</span>
              <Badge variant="signal" size="sm">Ready to pack</Badge>
            </div>
            <p class="text-sm font-bold text-ink">{{ order.customerName }}</p>
            <p class="text-xs text-ink-muted">
              Target date: <strong>{{ formatDate(order.deliveryDate) }}</strong> • Items: {{ order.items.length }} line items
            </p>
          </div>

          <!-- Prominent "Create Delivery" Action Button -->
          <AppButton
            variant="primary"
            size="sm"
            :loading="creatingDeliveryId === order.id"
            @click="handleCreateDelivery(order.id)"
          >
            <AppIcon name="truck" :size="14" />
            <span>Create Delivery</span>
          </AppButton>
        </div>
      </div>
    </div>

    <!-- SECTION 2: DISPATCHED DELIVERY NOTES HISTORY -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-ink font-heading flex items-center gap-2">
          <AppIcon name="check-circle" :size="18" className="text-status-green" />
          <span>Dispatched Delivery Notes</span>
        </h2>
        <span class="text-xs text-ink-muted">{{ deliveries.length }} Completed Dispatches</span>
      </div>

      <DataTable
        :columns="columns"
        :rows="deliveries"
        :loading="loading"
        empty-title="No delivery notes recorded yet"
        empty-description="Orders fulfilled above will generate persistent Delivery Notes here."
      >
        <template #id="{ value }">
          <span class="font-mono font-bold text-ink">{{ value }}</span>
        </template>

        <template #salesOrderId="{ value }">
          <span class="font-mono text-xs text-signal font-semibold">{{ value }}</span>
        </template>

        <template #customerName="{ value }">
          <span class="font-bold text-ink">{{ value }}</span>
        </template>

        <template #postingDate="{ value }">
          <span class="text-xs text-ink-muted">{{ formatDate(value) }}</span>
        </template>

        <template #carrier="{ row }">
          <span class="text-xs text-ink-muted">
            {{ row.carrier }} <span v-if="row.trackingNo" class="font-mono">({{ row.trackingNo }})</span>
          </span>
        </template>

        <template #status="{ value }">
          <Badge variant="success" size="sm" dot>
            {{ value }}
          </Badge>
        </template>
      </DataTable>
    </div>
  </PageContainer>
</template>
