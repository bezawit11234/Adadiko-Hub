<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import { useSession } from '@/composables/useSession'
import type { SalesOrder, Quotation, Customer } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatCurrency, formatDate } from '@/utils/format'

const { currentUser } = useSession()
const salesApi = getSalesApi()

const orders = ref<SalesOrder[]>([])
const quotations = ref<Quotation[]>([])
const customers = ref<Customer[]>([])
const loading = ref(true)

// Checklist of personal daily actions for the sales rep
const tasks = ref<{ id: number; text: string; completed: boolean; due: string }[]>([])

function toggleTask(id: number) {
  const t = tasks.value.find((item) => item.id === id)
  if (t) t.completed = !t.completed
}

onMounted(async () => {
  loading.value = true
  try {
    const [ordersRes, quotesRes, custsRes] = await Promise.all([
      salesApi.listSalesOrders(),
      salesApi.listQuotations(),
      salesApi.listCustomers(),
    ])
    if (ordersRes.ok && ordersRes.data) orders.value = ordersRes.data
    if (quotesRes.ok && quotesRes.data) quotations.value = quotesRes.data
    if (custsRes.ok && custsRes.data) customers.value = custsRes.data
  } finally {
    loading.value = false
  }
})

// Sales Rep filter: only their assigned orders or active pipeline
const myOpenOrders = computed(() => {
  return orders.value.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled')
})

const waitingQuotations = computed(() => {
  return quotations.value.filter((q) => q.status === 'Submitted')
})

const followUpCustomers = computed(() => {
  return customers.value.filter((c) => c.amountOwed > 0 || c.status === 'Prospect')
})
</script>

<template>
  <PageContainer max-width="2xl">
    <!-- Welcome & Hero Header with Big Button -->
    <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1.5">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wider text-signal font-heading">
            Sales Representative Desk
          </span>
          <span class="w-1.5 h-1.5 rounded-full bg-signal" />
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-ink font-heading">
          Good morning, {{ currentUser?.name || 'there' }}
        </h1>
        <p class="text-sm text-ink-muted">
          You have <strong class="text-ink">{{ myOpenOrders.length }} active orders</strong> and <strong class="text-ink">{{ waitingQuotations.length }} quotations</strong> awaiting customer response today.
        </p>
      </div>

      <!-- Prominent Primary Action -->
      <RouterLink to="/app/sales/orders/new" class="shrink-0">
        <AppButton variant="primary" size="lg" class="shadow-lift font-bold px-6 py-3 text-base">
          <AppIcon name="plus" :size="20" />
          <span>New Sales Order</span>
        </AppButton>
      </RouterLink>
    </div>

    <!-- 2-Column Working Layout: Today's Tasks + Quotations waiting -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left Column: Tasks & Open Orders -->
      <div class="lg:col-span-7 space-y-6">
        <!-- Today's Action Checklist -->
        <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-stone-border">
            <h2 class="text-base font-bold text-ink font-heading flex items-center gap-2">
              <AppIcon name="calendar" :size="18" className="text-signal" />
              <span>Today's Follow-up Checklist</span>
            </h2>
            <span class="text-xs text-ink-muted">
              {{ tasks.filter(t => t.completed).length }}/{{ tasks.length }} Completed
            </span>
          </div>

          <div v-if="tasks.length === 0" class="py-8 text-center text-xs text-ink-muted">
            No follow-up tasks scheduled for today. You are all caught up!
          </div>

          <div v-else class="space-y-2.5">
            <div
              v-for="task in tasks"
              :key="task.id"
              :class="[
                'p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all',
                task.completed ? 'bg-stone-bg/60 border-stone-border text-ink-light line-through' : 'bg-white border-stone-border hover:border-signal/50',
              ]"
              @click="toggleTask(task.id)"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-5 h-5 rounded-md border flex items-center justify-center shrink-0',
                    task.completed ? 'bg-status-green border-status-green text-white' : 'border-stone-border bg-white',
                  ]"
                >
                  <AppIcon v-if="task.completed" name="check" :size="12" />
                </div>
                <span class="text-xs font-medium text-ink">{{ task.text }}</span>
              </div>
              <span class="text-[11px] font-semibold text-ink-light shrink-0">{{ task.due }}</span>
            </div>
          </div>
        </div>

        <!-- My Open Orders -->
        <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-stone-border">
            <h2 class="text-base font-bold text-ink font-heading flex items-center gap-2">
              <AppIcon name="orders" :size="18" className="text-signal" />
              <span>My Open Orders in Progress</span>
            </h2>
            <RouterLink to="/app/sales/orders" class="text-xs text-signal font-semibold hover:underline">
              View all orders →
            </RouterLink>
          </div>

          <div v-if="myOpenOrders.length === 0" class="py-6 text-center text-xs text-ink-muted">
            No active orders currently in flight.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="order in myOpenOrders"
              :key="order.id"
              class="p-4 rounded-2xl bg-stone-bg/50 border border-stone-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-bg transition-colors"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-bold text-ink">{{ order.id }}</span>
                  <Badge variant="signal" size="sm">{{ order.stage }}</Badge>
                </div>
                <p class="text-sm font-bold text-ink">{{ order.customerName }}</p>
                <p class="text-xs text-ink-muted">
                  Delivery target: <strong>{{ formatDate(order.deliveryDate) }}</strong>
                </p>
              </div>

              <div class="sm:text-right flex sm:flex-col items-center sm:items-end justify-between">
                <span class="text-base font-extrabold text-ink font-heading num-tabular">
                  {{ formatCurrency(order.grandTotal) }}
                </span>
                <RouterLink :to="`/app/sales/orders/${order.id}`">
                  <span class="text-xs text-signal font-semibold hover:underline mt-1 inline-block">
                    Open Order Details →
                  </span>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Quotations Waiting & Customer Balances -->
      <div class="lg:col-span-5 space-y-6">
        <!-- Quotations waiting for reply -->
        <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-stone-border">
            <h2 class="text-base font-bold text-ink font-heading flex items-center gap-2">
              <AppIcon name="file-text" :size="18" className="text-signal" />
              <span>Quotes Awaiting Reply</span>
            </h2>
            <RouterLink to="/app/sales/quotations" class="text-xs text-signal font-semibold hover:underline">
              All quotes
            </RouterLink>
          </div>

          <div v-if="waitingQuotations.length === 0" class="py-6 text-center text-xs text-ink-muted">
            No quotations awaiting customer response.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="quote in waitingQuotations"
              :key="quote.id"
              class="p-3.5 rounded-2xl bg-stone-bg/40 border border-stone-border space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono font-bold text-ink">{{ quote.id }}</span>
                <Badge variant="warning" size="sm">Awaiting Reply</Badge>
              </div>
              <p class="text-xs font-bold text-ink truncate">{{ quote.customerName }}</p>
              <div class="flex items-center justify-between text-xs text-ink-muted pt-1 border-t border-stone-border/60">
                <span>Valid till: {{ formatDate(quote.validTill) }}</span>
                <span class="font-extrabold text-ink num-tabular">{{ formatCurrency(quote.grandTotal) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Customers to Follow Up -->
        <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-stone-border">
            <h2 class="text-base font-bold text-ink font-heading flex items-center gap-2">
              <AppIcon name="users" :size="18" className="text-signal" />
              <span>Accounts to Follow Up</span>
            </h2>
            <RouterLink to="/app/sales/customers" class="text-xs text-signal font-semibold hover:underline">
              Directory
            </RouterLink>
          </div>

          <div v-if="followUpCustomers.length === 0" class="py-6 text-center text-xs text-ink-muted">
            No accounts currently requiring follow-up.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="cust in followUpCustomers.slice(0, 3)"
              :key="cust.id"
              class="p-3.5 rounded-2xl bg-stone-bg/40 border border-stone-border flex items-center justify-between"
            >
              <div class="space-y-0.5 min-w-0">
                <p class="text-xs font-bold text-ink truncate">{{ cust.name }}</p>
                <p class="text-[11px] text-ink-muted truncate">{{ cust.phone }}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-[10px] uppercase font-semibold text-ink-muted">Customer owes</p>
                <p class="text-xs font-extrabold text-status-red num-tabular">
                  {{ formatCurrency(cust.amountOwed) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageContainer>
</template>
