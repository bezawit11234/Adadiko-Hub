<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import type { Customer, SalesOrder, SalesInvoice } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatCurrency, formatDate } from '@/utils/format'

const route = useRoute()
const customerId = computed(() => route.params.id as string)
const salesApi = getSalesApi()

const customer = ref<Customer | null>(null)
const orders = ref<SalesOrder[]>([])
const invoices = ref<SalesInvoice[]>([])
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    const [custRes, ordersRes, invRes] = await Promise.all([
      salesApi.getCustomer(customerId.value),
      salesApi.listSalesOrders(),
      salesApi.listSalesInvoices(),
    ])
    if (custRes.ok && custRes.data) customer.value = custRes.data
    if (ordersRes.ok && ordersRes.data) {
      orders.value = ordersRes.data.filter((o) => o.customerId === customerId.value)
    }
    if (invRes.ok && invRes.data) {
      invoices.value = invRes.data.filter((i) => i.customerId === customerId.value)
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <PageContainer max-width="2xl">
    <div class="flex items-center gap-2 text-xs text-ink-muted">
      <RouterLink to="/app/sales/customers" class="hover:text-ink">Customers</RouterLink>
      <span>/</span>
      <span class="text-ink font-semibold">{{ customer?.name || 'Customer Detail' }}</span>
    </div>

    <SampleNotice text="Customer Profile: Aggregated outstanding debt balance and timeline of orders & invoices." />

    <div v-if="customer" class="space-y-6">
      <!-- Customer Header Card -->
      <div class="bg-white rounded-3xl border border-stone-border shadow-card p-6 sm:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-2xl bg-stone-bg border border-stone-border flex items-center justify-center text-ink-navy text-xl font-black font-heading shrink-0">
            {{ customer.name.charAt(0) }}
          </div>
          <div class="space-y-1.5">
            <div class="flex items-center gap-2.5">
              <h1 class="text-xl sm:text-2xl font-black text-ink font-heading">
                {{ customer.name }}
              </h1>
              <Badge :variant="customer.status === 'Active' ? 'success' : 'neutral'" size="sm" dot>
                {{ customer.status }}
              </Badge>
            </div>
            <p class="text-xs text-ink-muted flex items-center gap-4">
              <span><strong>Group:</strong> {{ customer.group }}</span>
              <span>•</span>
              <span><strong>Territory:</strong> {{ customer.territory }}</span>
            </p>
          </div>
        </div>

        <!-- Prominent Amount Owed Indicator -->
        <div class="p-4 rounded-2xl bg-stone-bg border border-stone-border text-right shrink-0">
          <span class="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
            Customer Owes Total:
          </span>
          <span
            :class="[
              'text-2xl font-black font-heading num-tabular block mt-0.5',
              customer.amountOwed > 0 ? 'text-status-red' : 'text-status-green',
            ]"
          >
            {{ formatCurrency(customer.amountOwed) }}
          </span>
          <span class="text-[11px] text-ink-light block mt-1">
            {{ customer.amountOwed > 0 ? 'Pending invoice payments' : 'Account in good standing' }}
          </span>
        </div>
      </div>

      <!-- 2-Column: Contacts / Notes and Timeline -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left: Contact Details & Related Info -->
        <div class="lg:col-span-5 space-y-6">
          <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-ink font-heading pb-2 border-b border-stone-border">
              Contact & Location
            </h3>
            <div class="space-y-3 text-xs">
              <div class="flex items-center gap-2.5 text-ink">
                <AppIcon name="mail" :size="16" className="text-signal shrink-0" />
                <a :href="`mailto:${customer.email}`" class="hover:underline font-medium">{{ customer.email }}</a>
              </div>
              <div class="flex items-center gap-2.5 text-ink">
                <AppIcon name="phone" :size="16" className="text-signal shrink-0" />
                <span class="font-medium">{{ customer.phone }}</span>
              </div>
              <div v-if="customer.address" class="flex items-start gap-2.5 text-ink">
                <AppIcon name="building" :size="16" className="text-signal shrink-0 mt-0.5" />
                <span class="text-ink-muted leading-relaxed">{{ customer.address }}</span>
              </div>
            </div>

            <div v-if="customer.notes" class="pt-3 border-t border-stone-border">
              <span class="text-[11px] font-bold text-ink-muted uppercase">Notes & Special Terms:</span>
              <p class="text-xs text-ink mt-1 bg-stone-bg p-3 rounded-xl border border-stone-border/60 italic">
                "{{ customer.notes }}"
              </p>
            </div>
          </div>

          <!-- Quick Action: Create New Order for this customer -->
          <div class="bg-signal-subtle/50 p-6 rounded-3xl border border-signal/20 text-center space-y-3">
            <h4 class="text-sm font-bold text-ink font-heading">
              Need to create a new order?
            </h4>
            <p class="text-xs text-ink-muted">
              Start a new sales order directly with {{ customer.name }}.
            </p>
            <RouterLink :to="`/app/sales/orders/new?customer=${customer.id}`">
              <AppButton variant="primary" size="md" block>
                <AppIcon name="plus" :size="16" />
                <span>Create Sales Order</span>
              </AppButton>
            </RouterLink>
          </div>
        </div>

        <!-- Right: Activity Timeline & Documents -->
        <div class="lg:col-span-7 space-y-6">
          <!-- Orders History -->
          <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-ink font-heading pb-2 border-b border-stone-border flex items-center justify-between">
              <span>Sales Orders ({{ orders.length }})</span>
              <span class="text-ink-muted font-normal lowercase">associated transactions</span>
            </h3>

            <div v-if="orders.length === 0" class="py-6 text-center text-xs text-ink-muted">
              No orders registered for this customer yet.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="order in orders"
                :key="order.id"
                class="p-4 rounded-2xl bg-stone-bg/40 border border-stone-border flex items-center justify-between"
              >
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono font-bold text-ink">{{ order.id }}</span>
                    <Badge variant="signal" size="sm">{{ order.stage }}</Badge>
                  </div>
                  <p class="text-[11px] text-ink-muted">
                    Order date: {{ formatDate(order.orderDate) }}
                  </p>
                </div>
                <div class="text-right">
                  <span class="text-sm font-extrabold text-ink font-heading num-tabular">
                    {{ formatCurrency(order.grandTotal) }}
                  </span>
                  <RouterLink :to="`/app/sales/orders/${order.id}`" class="block text-[11px] text-signal hover:underline">
                    View order →
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>

          <!-- Invoices & Billing History -->
          <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-ink font-heading pb-2 border-b border-stone-border flex items-center justify-between">
              <span>Sales Invoices ({{ invoices.length }})</span>
              <span class="text-ink-muted font-normal lowercase">receivables ledger</span>
            </h3>

            <div v-if="invoices.length === 0" class="py-6 text-center text-xs text-ink-muted">
              No invoices generated for this customer yet.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="inv in invoices"
                :key="inv.id"
                class="p-4 rounded-2xl bg-stone-bg/40 border border-stone-border flex items-center justify-between"
              >
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono font-bold text-ink">{{ inv.id }}</span>
                    <Badge :variant="inv.status === 'Paid' ? 'success' : inv.status === 'Overdue' ? 'danger' : 'warning'" size="sm">
                      {{ inv.status }}
                    </Badge>
                  </div>
                  <p class="text-[11px] text-ink-muted">
                    Due date: {{ formatDate(inv.dueDate) }}
                  </p>
                </div>
                <div class="text-right">
                  <span class="text-sm font-extrabold text-ink font-heading num-tabular">
                    {{ formatCurrency(inv.grandTotal) }}
                  </span>
                  <RouterLink :to="`/app/sales/invoices/${inv.id}`" class="block text-[11px] text-signal hover:underline">
                    Open invoice →
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageContainer>
</template>
