<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getAdminApi } from '@/services/admin'
import type { Order } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const adminApi = getAdminApi()

const orders = ref<Order[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedStatus = ref<'all' | 'paid' | 'pending' | 'failed'>('all')

// Selected order for detail modal
const selectedOrder = ref<Order | null>(null)
const showDetailModal = ref(false)

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await adminApi.listOrders()
    if (res.ok && res.data) {
      orders.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOrders()
})

const filteredOrders = computed(() => {
  return orders.value.filter((o) => {
    const matchesStatus = selectedStatus.value === 'all' || o.status === selectedStatus.value
    const q = searchQuery.value.toLowerCase().trim()
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.clientCompanyName.toLowerCase().includes(q) ||
      o.invoiceRef.toLowerCase().includes(q)

    return matchesStatus && matchesSearch
  })
})

const getStatusBadge = (status: Order['status']) => {
  switch (status) {
    case 'paid':
      return { variant: 'success' as const, label: 'Paid' }
    case 'pending':
      return { variant: 'warning' as const, label: 'Pending' }
    case 'failed':
      return { variant: 'danger' as const, label: 'Failed' }
  }
}

const openOrderDetail = (order: Order) => {
  selectedOrder.value = order
  showDetailModal.value = true
}
</script>

<template>
  <PageContainer>
    <SectionHeading
      title="Orders &amp; Invoices"
      description="Track platform billing transactions, tenant module subscriptions, and invoice settlements."
    >
      <template #actions>
        <span class="text-xs font-mono text-ink-muted">
          Showing {{ filteredOrders.length }} of {{ orders.length }} transactions
        </span>
      </template>
    </SectionHeading>

    <!-- Filter and Search Toolbar -->
    <div class="bg-stone-surface border border-stone-border rounded-2xl p-4 shadow-soft mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
        <button
          type="button"
          @click="selectedStatus = 'all'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedStatus === 'all' ? 'bg-ink text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          All ({{ orders.length }})
        </button>
        <button
          type="button"
          @click="selectedStatus = 'paid'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedStatus === 'paid' ? 'bg-status-green text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          Paid ({{ orders.filter(o => o.status === 'paid').length }})
        </button>
        <button
          type="button"
          @click="selectedStatus = 'pending'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedStatus === 'pending' ? 'bg-status-amber text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          Pending ({{ orders.filter(o => o.status === 'pending').length }})
        </button>
        <button
          type="button"
          @click="selectedStatus = 'failed'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedStatus === 'failed' ? 'bg-status-red text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          Failed ({{ orders.filter(o => o.status === 'failed').length }})
        </button>
      </div>

      <!-- Search Box -->
      <div class="relative w-full md:w-72">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-light">
          <AppIcon name="search" :size="16" />
        </div>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search order #, client, invoice..."
          class="w-full pl-9 pr-3 py-1.5 bg-white text-xs text-ink rounded-xl border border-stone-border focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors"
        />
      </div>
    </div>

    <!-- Orders Table -->
    <div class="bg-stone-surface border border-stone-border rounded-2xl shadow-soft overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-stone-subtle/80 border-b border-stone-border text-ink-muted uppercase font-mono text-[11px] tracking-wider">
              <th class="py-3.5 px-4 font-semibold">Order Number</th>
              <th class="py-3.5 px-4 font-semibold">Client Organization</th>
              <th class="py-3.5 px-4 font-semibold">Transaction Date</th>
              <th class="py-3.5 px-4 font-semibold">Plan Tier</th>
              <th class="py-3.5 px-4 font-semibold">Items</th>
              <th class="py-3.5 px-4 font-semibold">Amount</th>
              <th class="py-3.5 px-4 font-semibold">Invoice Ref</th>
              <th class="py-3.5 px-4 font-semibold">Status</th>
              <th class="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-border">
            <tr
              v-for="order in filteredOrders"
              :key="order.id"
              class="hover:bg-stone-subtle/60 transition-colors group cursor-pointer"
              @click="openOrderDetail(order)"
            >
              <td class="py-3.5 px-4 font-mono font-medium text-ink group-hover:text-signal">
                {{ order.orderNumber }}
              </td>

              <td class="py-3.5 px-4 font-medium text-ink">
                {{ order.clientCompanyName }}
              </td>

              <td class="py-3.5 px-4 text-ink-muted font-mono text-[11px]">
                {{ formatDate(order.date) }}
              </td>

              <td class="py-3.5 px-4">
                <Badge :variant="order.plan === 'enterprise' ? 'accent' : 'neutral'">
                  {{ order.plan }}
                </Badge>
              </td>

              <td class="py-3.5 px-4 text-ink-muted max-w-[200px] truncate" :title="order.items.join(', ')">
                {{ order.items.join(', ') }}
              </td>

              <td class="py-3.5 px-4 font-mono font-bold text-ink">
                {{ formatCurrency(order.amount) }}
              </td>

              <td class="py-3.5 px-4 font-mono text-[11px] text-ink-muted">
                {{ order.invoiceRef }}
              </td>

              <td class="py-3.5 px-4">
                <Badge :variant="getStatusBadge(order.status).variant">
                  {{ getStatusBadge(order.status).label }}
                </Badge>
              </td>

              <td class="py-3.5 px-4 text-right" @click.stop>
                <AppButton
                  variant="secondary"
                  size="sm"
                  @click="openOrderDetail(order)"
                >
                  View &rarr;
                </AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <EmptyState
        v-if="filteredOrders.length === 0 && !loading"
        title="No billing orders found"
        description="Try adjusting your status filter or search parameters."
        icon="orders"
      />
    </div>

    <!-- Order Detail Modal -->
    <Modal
      :show="showDetailModal"
      :title="`Order Details — ${selectedOrder?.orderNumber}`"
      @close="showDetailModal = false"
    >
      <div v-if="selectedOrder" class="space-y-4 text-xs">
        <div class="grid grid-cols-2 gap-3 p-3 rounded-xl bg-stone-subtle border border-stone-border">
          <div>
            <span class="text-ink-muted block text-[11px]">Client Company</span>
            <span class="font-bold text-ink text-sm">{{ selectedOrder.clientCompanyName }}</span>
          </div>
          <div>
            <span class="text-ink-muted block text-[11px]">Transaction Status</span>
            <Badge :variant="getStatusBadge(selectedOrder.status).variant" class="mt-0.5">
              {{ getStatusBadge(selectedOrder.status).label }}
            </Badge>
          </div>
          <div>
            <span class="text-ink-muted block text-[11px]">Billing Date</span>
            <span class="font-mono text-ink">{{ formatDate(selectedOrder.date) }}</span>
          </div>
          <div>
            <span class="text-ink-muted block text-[11px]">Invoice Reference</span>
            <span class="font-mono text-ink">{{ selectedOrder.invoiceRef }}</span>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-ink mb-2">Line Items</h4>
          <div class="space-y-1.5 border border-stone-border rounded-xl p-3 bg-stone-subtle/50">
            <div
              v-for="(item, idx) in selectedOrder.items"
              :key="idx"
              class="flex items-center justify-between text-ink py-1"
            >
              <span>{{ item }}</span>
              <span class="font-mono text-ink-muted">Included</span>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center p-3 rounded-xl bg-ink text-white font-mono">
          <span class="text-xs">Total Amount Billed:</span>
          <span class="text-base font-bold text-signal">{{ formatCurrency(selectedOrder.amount) }}</span>
        </div>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="showDetailModal = false">
          Close
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
