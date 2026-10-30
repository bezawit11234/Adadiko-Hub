<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
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

const activeTab = ref<'queue' | 'delivered'>('queue')
const deliveries = ref<DeliveryNote[]>([])
const orders = ref<SalesOrder[]>([])
const loading = ref(true)
const creatingDeliveryId = ref<string | null>(null)

const deliveredColumns: Column[] = [
  { key: 'id', label: 'Delivery Note #' },
  { key: 'postingDate', label: 'Dispatch Date' },
  { key: 'customerName', label: 'Customer' },
  { key: 'salesOrderId', label: 'Sales Order Link' },
  { key: 'items', label: 'Items Delivered' },
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
      activeTab.value = 'delivered'
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
      description="Storekeeper fulfillment workspace. Review orders awaiting packing slips and verify completed delivery notes."
    >
      <template #badge>
        <Badge variant="signal" size="sm">Storekeeper Queue</Badge>
      </template>
    </SectionHeading>

    <!-- TWO TABS: "Waiting for delivery" and "Delivered" -->
    <div class="flex items-center gap-2 border-b border-stone-border pb-3">
      <button
        type="button"
        :class="[
          'px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer',
          activeTab === 'queue'
            ? 'bg-ink-navy text-white shadow-soft'
            : 'bg-white hover:bg-stone-bg text-ink-muted hover:text-ink border border-stone-border',
        ]"
        @click="activeTab = 'queue'"
      >
        <AppIcon name="truck" :size="16" />
        <span>Waiting for delivery</span>
        <Badge :variant="activeTab === 'queue' ? 'warning' : 'neutral'" size="sm">
          {{ ordersWaitingDelivery.length }}
        </Badge>
      </button>

      <button
        type="button"
        :class="[
          'px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer',
          activeTab === 'delivered'
            ? 'bg-ink-navy text-white shadow-soft'
            : 'bg-white hover:bg-stone-bg text-ink-muted hover:text-ink border border-stone-border',
        ]"
        @click="activeTab = 'delivered'"
      >
        <AppIcon name="check-circle" :size="16" />
        <span>Delivered</span>
        <Badge :variant="activeTab === 'delivered' ? 'success' : 'neutral'" size="sm">
          {{ deliveries.length }}
        </Badge>
      </button>
    </div>

    <!-- TAB 1 CONTENT: ORDERS WAITING FOR DELIVERY (Queue) -->
    <div v-if="activeTab === 'queue'" class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4">
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

      <div v-if="ordersWaitingDelivery.length === 0" class="py-12 text-center text-xs text-ink-muted">
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

          <!-- "Create Delivery" Action Button -->
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

    <!-- TAB 2 CONTENT: SUBMITTED DELIVERY NOTES (Delivered) -->
    <div v-else-if="activeTab === 'delivered'" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-ink font-heading flex items-center gap-2">
          <AppIcon name="check-circle" :size="18" className="text-status-green" />
          <span>Submitted Delivery Notes</span>
        </h2>
        <span class="text-xs text-ink-muted">{{ deliveries.length }} Completed Dispatches</span>
      </div>

      <DataTable
        :columns="deliveredColumns"
        :rows="deliveries"
        :loading="loading"
        empty-title="No delivery notes recorded yet"
        empty-description="Orders fulfilled from the queue will generate persistent Delivery Notes here."
      >
        <template #id="{ value }">
          <span class="font-mono font-bold text-ink">{{ value }}</span>
        </template>

        <template #postingDate="{ value }">
          <span class="text-xs font-semibold text-ink">{{ formatDate(value) }}</span>
        </template>

        <template #customerName="{ value }">
          <span class="font-bold text-ink">{{ value }}</span>
        </template>

        <template #salesOrderId="{ value }">
          <RouterLink
            v-if="value"
            :to="`/app/sales/orders/${value}`"
            class="font-mono text-xs text-signal font-bold hover:underline inline-flex items-center gap-1"
          >
            <span>{{ value }}</span>
            <AppIcon name="external-link" :size="11" />
          </RouterLink>
          <span v-else class="text-xs text-ink-muted">—</span>
        </template>

        <template #items="{ row }">
          <div v-if="row.items && row.items.length > 0" class="space-y-1">
            <div
              v-for="item in row.items"
              :key="item.itemCode"
              class="text-xs text-ink flex items-center gap-1.5"
            >
              <span class="font-bold text-signal num-tabular">{{ item.qty }}x</span>
              <span class="truncate max-w-xs">{{ item.itemName || item.itemCode }}</span>
            </div>
          </div>
          <span v-else class="text-xs text-ink-muted">Standard Order Package</span>
        </template>

        <template #status="{ value }">
          <Badge variant="success" size="sm" dot>
            {{ value || 'Delivered' }}
          </Badge>
        </template>
      </DataTable>
    </div>
  </PageContainer>
</template>
