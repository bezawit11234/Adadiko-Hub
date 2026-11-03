<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import type { Customer, SalesOrder, SalesInvoice, Quotation, DeliveryNote, Payment, Lead } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency, formatDate } from '@/utils/format'

const route = useRoute()
const customerId = computed(() => route.params.id as string)
const salesApi = getSalesApi()

const customer = ref<Customer | null>(null)
const leads = ref<Lead[]>([])
const quotations = ref<Quotation[]>([])
const orders = ref<SalesOrder[]>([])
const deliveries = ref<DeliveryNote[]>([])
const invoices = ref<SalesInvoice[]>([])
const payments = ref<Payment[]>([])
const loading = ref(true)
const activeTab = ref<'all' | 'leads' | 'quotations' | 'orders' | 'deliveries' | 'invoices' | 'payments'>('all')

onMounted(async () => {
  loading.value = true
  try {
    const [custRes, leadsRes, quotesRes, ordersRes, delivRes, invRes, payRes] = await Promise.all([
      salesApi.getCustomer(customerId.value),
      salesApi.listLeads(),
      salesApi.listQuotations(),
      salesApi.listSalesOrders(),
      salesApi.listDeliveries(),
      salesApi.listSalesInvoices(),
      salesApi.listPayments(),
    ])
    if (custRes.ok && custRes.data) customer.value = custRes.data
    const cName = customer.value?.name || customerId.value
    const cId = customerId.value

    if (leadsRes.ok && leadsRes.data) {
      leads.value = leadsRes.data.filter((l) => l.customer === cId || l.customer === cName || l.companyName === cName || l.name === cName)
    }
    if (quotesRes.ok && quotesRes.data) {
      quotations.value = quotesRes.data.filter((q) => q.customerId === cId || q.customerName === cName)
    }
    if (ordersRes.ok && ordersRes.data) {
      orders.value = ordersRes.data.filter((o) => o.customerId === cId || o.customerName === cName)
    }
    if (delivRes.ok && delivRes.data) {
      deliveries.value = delivRes.data.filter((d) => d.customerName === cName)
    }
    if (invRes.ok && invRes.data) {
      invoices.value = invRes.data.filter((i) => i.customerId === cId || i.customerName === cName)
    }
    if (payRes.ok && payRes.data) {
      payments.value = payRes.data.filter((p) => p.customerName === cName || (customer.value && p.customerName.toLowerCase().includes(customer.value.name.toLowerCase())))
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <PageContainer max-width="2xl">
    <div class="flex items-center justify-between text-xs text-ink-muted">
      <div class="flex items-center gap-2">
        <RouterLink to="/app/sales/customers" class="hover:text-ink">Customers</RouterLink>
        <span>/</span>
        <span class="text-ink font-semibold">{{ customer?.name || 'Customer Detail' }}</span>
      </div>
      <div v-if="customer" class="flex items-center gap-2">
        <RouterLink :to="`/app/sales/quotations/new?customer=${customer.id}`">
          <AppButton variant="outline" size="sm">
            <AppIcon name="file-text" :size="14" />
            <span>New Quotation</span>
          </AppButton>
        </RouterLink>
        <RouterLink :to="`/app/sales/orders/new?customer=${customer.id}`">
          <AppButton variant="primary" size="sm">
            <AppIcon name="plus" :size="14" />
            <span>New Sales Order</span>
          </AppButton>
        </RouterLink>
      </div>
    </div>

    <div v-if="customer" class="space-y-6">
      <!-- Customer Header Card -->
      <div class="bg-white rounded-3xl border border-stone-border shadow-card p-6 sm:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-2xl bg-stone-bg border border-stone-border flex items-center justify-center text-ink-navy text-xl font-black font-heading shrink-0">
            {{ customer.name.charAt(0) }}
          </div>
          <div class="space-y-1.5">
            <div class="flex items-center gap-2.5 flex-wrap">
              <h1 class="text-xl sm:text-2xl font-black text-ink font-heading">
                {{ customer.name }}
              </h1>
              <Badge :variant="customer.status === 'Active' ? 'success' : 'neutral'" size="sm" dot>
                {{ customer.status }}
              </Badge>
              <Badge v-if="customer.customerType" variant="neutral" size="sm">
                {{ customer.customerType }}
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
            {{ customer.amountOwed > 0 ? 'Pending invoice receivables' : 'Account in good standing' }}
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

          <!-- Quick Actions: New Quotation & New Order -->
          <div class="bg-signal-subtle/50 p-6 rounded-3xl border border-signal/20 space-y-3">
            <h4 class="text-sm font-bold text-ink font-heading">
              Next Transactions
            </h4>
            <p class="text-xs text-ink-muted">
              Create a proposal or commercial sales order for {{ customer.name }}.
            </p>
            <div class="space-y-2 pt-1">
              <RouterLink :to="`/app/sales/quotations/new?customer=${customer.id}`" class="block">
                <AppButton variant="outline" size="sm" block>
                  <AppIcon name="file-text" :size="15" />
                  <span>New Quotation</span>
                </AppButton>
              </RouterLink>
              <RouterLink :to="`/app/sales/orders/new?customer=${customer.id}`" class="block">
                <AppButton variant="primary" size="sm" block>
                  <AppIcon name="plus" :size="15" />
                  <span>New Sales Order</span>
                </AppButton>
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Right: Activity Pipeline Lists -->
        <div class="lg:col-span-7 space-y-6">
          <!-- Filter Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              v-for="t in [
                { id: 'all', label: 'All History' },
                { id: 'leads', label: `Leads (${leads.length})` },
                { id: 'quotations', label: `Quotes (${quotations.length})` },
                { id: 'orders', label: `Orders (${orders.length})` },
                { id: 'deliveries', label: `Deliveries (${deliveries.length})` },
                { id: 'invoices', label: `Invoices (${invoices.length})` },
                { id: 'payments', label: `Payments (${payments.length})` },
              ]"
              :key="t.id"
              type="button"
              :class="[
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0',
                activeTab === t.id ? 'bg-ink-navy text-white' : 'bg-stone-bg text-ink-muted hover:text-ink',
              ]"
              @click="activeTab = t.id as any"
            >
              {{ t.label }}
            </button>
          </div>

          <!-- Leads Origin -->
          <div
            v-if="['all', 'leads'].includes(activeTab)"
            class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4"
          >
            <h3 class="text-xs font-bold uppercase tracking-wider text-ink font-heading pb-2 border-b border-stone-border flex items-center justify-between">
              <span>Leads Origin ({{ leads.length }})</span>
              <span class="text-ink-muted font-normal lowercase">prospect conversion history</span>
            </h3>
            <div v-if="leads.length === 0" class="py-4 text-center text-xs text-ink-muted">
              No matching lead origin records found.
            </div>
            <div v-else class="space-y-2.5">
              <div
                v-for="lead in leads"
                :key="lead.id"
                class="p-3.5 rounded-2xl bg-stone-bg/40 border border-stone-border flex items-center justify-between text-xs"
              >
                <div>
                  <span class="font-bold text-ink">{{ lead.name }}</span>
                  <span v-if="lead.companyName" class="text-ink-muted ml-2">({{ lead.companyName }})</span>
                  <p class="text-[11px] text-ink-muted">Source: {{ lead.source }} • Registered: {{ lead.createdDate }}</p>
                </div>
                <Badge variant="success" size="sm">{{ lead.status }}</Badge>
              </div>
            </div>
          </div>

          <!-- Quotations -->
          <div
            v-if="['all', 'quotations'].includes(activeTab)"
            class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4"
          >
            <h3 class="text-xs font-bold uppercase tracking-wider text-ink font-heading pb-2 border-b border-stone-border flex items-center justify-between">
              <span>Quotations ({{ quotations.length }})</span>
              <span class="text-ink-muted font-normal lowercase">commercial proposals</span>
            </h3>
            <div v-if="quotations.length === 0" class="py-4 text-center text-xs text-ink-muted">
              No quotations created for this customer yet.
            </div>
            <div v-else class="space-y-2.5">
              <div
                v-for="quote in quotations"
                :key="quote.id"
                class="p-3.5 rounded-2xl bg-stone-bg/40 border border-stone-border flex items-center justify-between text-xs"
              >
                <div>
                  <span class="font-mono font-bold text-ink">{{ quote.id }}</span>
                  <Badge variant="neutral" size="sm" class="ml-2">{{ quote.status }}</Badge>
                  <p class="text-[11px] text-ink-muted">Valid till: {{ formatDate(quote.validTill) }}</p>
                </div>
                <div class="text-right">
                  <span class="font-bold text-ink num-tabular">{{ formatCurrency(quote.grandTotal) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Sales Orders -->
          <div
            v-if="['all', 'orders'].includes(activeTab)"
            class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4"
          >
            <h3 class="text-xs font-bold uppercase tracking-wider text-ink font-heading pb-2 border-b border-stone-border flex items-center justify-between">
              <span>Sales Orders ({{ orders.length }})</span>
              <span class="text-ink-muted font-normal lowercase">confirmed transactions</span>
            </h3>
            <div v-if="orders.length === 0" class="py-4 text-center text-xs text-ink-muted">
              No orders registered for this customer yet.
            </div>
            <div v-else class="space-y-2.5">
              <div
                v-for="order in orders"
                :key="order.id"
                class="p-3.5 rounded-2xl bg-stone-bg/40 border border-stone-border flex items-center justify-between text-xs"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-ink">{{ order.id }}</span>
                    <Badge variant="signal" size="sm">{{ order.status }}</Badge>
                  </div>
                  <p class="text-[11px] text-ink-muted">Order date: {{ formatDate(order.orderDate) }}</p>
                </div>
                <div class="text-right">
                  <span class="font-extrabold text-ink num-tabular block">{{ formatCurrency(order.grandTotal) }}</span>
                  <RouterLink :to="`/app/sales/orders/${order.id}`" class="text-[11px] text-signal hover:underline">
                    View order →
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>

          <!-- Deliveries -->
          <div
            v-if="['all', 'deliveries'].includes(activeTab)"
            class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4"
          >
            <h3 class="text-xs font-bold uppercase tracking-wider text-ink font-heading pb-2 border-b border-stone-border flex items-center justify-between">
              <span>Deliveries ({{ deliveries.length }})</span>
              <span class="text-ink-muted font-normal lowercase">stock dispatches</span>
            </h3>
            <div v-if="deliveries.length === 0" class="py-4 text-center text-xs text-ink-muted">
              No delivery notes recorded for this customer yet.
            </div>
            <div v-else class="space-y-2.5">
              <div
                v-for="deliv in deliveries"
                :key="deliv.id"
                class="p-3.5 rounded-2xl bg-stone-bg/40 border border-stone-border flex items-center justify-between text-xs"
              >
                <div>
                  <span class="font-mono font-bold text-ink">{{ deliv.id }}</span>
                  <Badge variant="success" size="sm" class="ml-2">{{ deliv.status }}</Badge>
                  <p class="text-[11px] text-ink-muted">Posted: {{ formatDate(deliv.postingDate) }} • Against: {{ deliv.salesOrderId }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Invoices -->
          <div
            v-if="['all', 'invoices'].includes(activeTab)"
            class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4"
          >
            <h3 class="text-xs font-bold uppercase tracking-wider text-ink font-heading pb-2 border-b border-stone-border flex items-center justify-between">
              <span>Invoices ({{ invoices.length }})</span>
              <span class="text-ink-muted font-normal lowercase">receivables ledger</span>
            </h3>
            <div v-if="invoices.length === 0" class="py-4 text-center text-xs text-ink-muted">
              No invoices generated for this customer yet.
            </div>
            <div v-else class="space-y-2.5">
              <div
                v-for="inv in invoices"
                :key="inv.id"
                class="p-3.5 rounded-2xl bg-stone-bg/40 border border-stone-border flex items-center justify-between text-xs"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-ink">{{ inv.id }}</span>
                    <Badge :variant="inv.status === 'Paid' ? 'success' : inv.status === 'Overdue' ? 'danger' : 'warning'" size="sm">
                      {{ inv.status }}
                    </Badge>
                  </div>
                  <p class="text-[11px] text-ink-muted">Due date: {{ formatDate(inv.dueDate) }}</p>
                </div>
                <div class="text-right">
                  <span class="font-extrabold text-ink num-tabular block">{{ formatCurrency(inv.grandTotal) }}</span>
                  <RouterLink :to="`/app/sales/invoices/${inv.id}`" class="text-[11px] text-signal hover:underline">
                    Open invoice →
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>

          <!-- Payments -->
          <div
            v-if="['all', 'payments'].includes(activeTab)"
            class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4"
          >
            <h3 class="text-xs font-bold uppercase tracking-wider text-ink font-heading pb-2 border-b border-stone-border flex items-center justify-between">
              <span>Payments ({{ payments.length }})</span>
              <span class="text-ink-muted font-normal lowercase">cleared settlements</span>
            </h3>
            <div v-if="payments.length === 0" class="py-4 text-center text-xs text-ink-muted">
              No payment receipts recorded for this customer yet.
            </div>
            <div v-else class="space-y-2.5">
              <div
                v-for="pay in payments"
                :key="pay.id"
                class="p-3.5 rounded-2xl bg-stone-bg/40 border border-stone-border flex items-center justify-between text-xs"
              >
                <div>
                  <span class="font-mono font-bold text-ink">{{ pay.id }}</span>
                  <Badge variant="success" size="sm" class="ml-2">{{ pay.mode || pay.modeOfPayment }}</Badge>
                  <p class="text-[11px] text-ink-muted">Ref: {{ pay.referenceNo || 'None' }} • Posted: {{ formatDate(pay.postingDate || pay.date) }}</p>
                </div>
                <div class="text-right">
                  <span class="font-bold text-status-green num-tabular">+{{ formatCurrency(pay.amount) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State if customer not found -->
    <div v-else-if="!loading" class="bg-white rounded-3xl border border-stone-border shadow-soft p-12 text-center">
      <EmptyState
        title="Customer account not found"
        description="The requested customer profile does not exist or has been removed."
      >
        <template #action>
          <RouterLink to="/app/sales/customers">
            <AppButton variant="primary" size="sm">
              <AppIcon name="users" :size="16" />
              <span>Back to Customers</span>
            </AppButton>
          </RouterLink>
        </template>
      </EmptyState>
    </div>
  </PageContainer>
</template>
