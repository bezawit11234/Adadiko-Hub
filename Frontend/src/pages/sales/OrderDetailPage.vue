<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import { getStoredSlug } from '@/services/frappeHttp'
import { useToast } from '@/composables/useToast'
import type { SalesOrder } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import StepTracker from '@/components/common/StepTracker.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Modal from '@/components/common/Modal.vue'
import Field from '@/components/common/Field.vue'
import TextField from '@/components/common/TextField.vue'
import { formatCurrency, formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const orderId = computed(() => route.params.id as string)
const salesApi = getSalesApi()
const toast = useToast()

const order = ref<SalesOrder | null>(null)
const loading = ref(true)
const actionLoading = ref(false)

// Desk links
const currentSlug = computed(() => getStoredSlug() || 'adadiko')
const deskOrderUrl = computed(() => `http://${currentSlug.value}.localhost:8000/desk/sales-order/${orderId.value}`)
const deskInvoiceUrl = computed(() =>
  order.value?.invoiceId ? `http://${currentSlug.value}.localhost:8000/desk/sales-invoice/${order.value.invoiceId}` : ''
)
const deskDeliveryUrl = computed(() =>
  order.value?.deliveryNoteId ? `http://${currentSlug.value}.localhost:8000/desk/delivery-note/${order.value.deliveryNoteId}` : ''
)

// Payment modal state
const isPaymentModalOpen = ref(false)
const payAmount = ref(0)
const payMode = ref<'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash'>('Bank Transfer')
const payRef = ref('')

const isOrderCompleted = computed(() => {
  if (!order.value) return false
  return (
    order.value.status === 'Completed' ||
    order.value.billingStatus === 'Paid' ||
    (order.value.billingStatus === 'Fully Billed' && order.value.stage === 'Payment')
  )
})

async function loadOrder() {
  loading.value = true
  try {
    const res = await salesApi.getSalesOrder(orderId.value)
    if (res.ok && res.data) {
      order.value = res.data
      payAmount.value = res.data.grandTotal
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrder()
})

interface NextStepAction {
  label: string
  action: () => void
  icon: string
  badgeText: string
  description: string
}

const nextStepInfo = computed<NextStepAction | null>(() => {
  if (!order.value || isOrderCompleted.value) return null
  const o = order.value

  // If invoiced and awaiting payment
  if (o.invoiceId && o.billingStatus !== 'Paid') {
    return {
      label: 'Record Payment',
      action: () => { isPaymentModalOpen.value = true },
      icon: 'credit-card',
      badgeText: 'Payment Pending',
      description: `Sales Invoice ${o.invoiceId} is ready. Record customer payment receipt to reconcile in full.`,
    }
  }

  // If delivered but needs invoice
  if (o.deliveryStatus === 'Fully Delivered' && !o.invoiceId) {
    return {
      label: 'Generate Invoice',
      action: handleCreateInvoice,
      icon: 'receipt',
      badgeText: 'Billing Pending',
      description: 'Goods dispatched. Generate customer sales invoice and post receivables.',
    }
  }

  // Not delivered and not invoiced yet: delivery is optional!
  if (!o.invoiceId) {
    return {
      label: 'Create Delivery',
      action: handleCreateDelivery,
      icon: 'truck',
      badgeText: 'Fulfillment & Billing',
      description: 'Dispatch physical goods with a Delivery Note, or bill directly if delivery is optional.',
    }
  }

  return null
})

async function handleCreateDelivery() {
  if (!order.value) return
  actionLoading.value = true
  try {
    const res = await salesApi.createDelivery(order.value.id)
    if (res.ok && res.data) {
      toast.success('Delivery Note Created', `Delivery Note ${res.data.id} recorded in ERPNext!`)
      await loadOrder()
    } else {
      toast.error('Failed to create delivery', res.error)
    }
  } finally {
    actionLoading.value = false
  }
}

async function handleCreateInvoice() {
  if (!order.value) return
  actionLoading.value = true
  try {
    const res = await salesApi.createInvoiceFromOrder(order.value.id)
    if (res.ok && res.data) {
      toast.success('Invoice Created', `Sales Invoice ${res.data.id} created! Customer owes ${formatCurrency(res.data.grandTotal)}.`)
      await loadOrder()
    } else {
      toast.error('Failed to create invoice', res.error)
    }
  } finally {
    actionLoading.value = false
  }
}

async function handleRecordPayment() {
  if (!order.value || !order.value.invoiceId) return
  actionLoading.value = true
  try {
    const res = await salesApi.recordPayment(
      order.value.invoiceId,
      payAmount.value,
      payMode.value,
      payRef.value || 'PAY-' + Math.floor(Math.random() * 900000 + 100000)
    )
    if (res.ok) {
      toast.success('Payment Recorded', `Payment of ${formatCurrency(payAmount.value)} confirmed! Order completed.`)
      isPaymentModalOpen.value = false
      await loadOrder()
    } else {
      toast.error('Payment failed', res.error)
    }
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <PageContainer max-width="2xl">
    <div class="flex items-center gap-2 text-xs text-ink-muted">
      <RouterLink to="/app/sales/orders" class="hover:text-ink">Sales Orders</RouterLink>
      <span>/</span>
      <span class="text-ink font-semibold">{{ orderId }}</span>
    </div>

    <div v-if="order" class="space-y-6">
      <!-- Order Header Card -->
      <div class="bg-white rounded-3xl border border-stone-border shadow-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1.5">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="text-xs font-mono font-bold text-signal bg-signal-subtle px-2 py-0.5 rounded border border-signal/20">
              {{ order.id }}
            </span>
            <Badge :variant="isOrderCompleted ? 'success' : 'signal'" size="sm" dot>
              {{ isOrderCompleted ? 'Completed (Paid)' : order.status }}
            </Badge>

            <a
              :href="deskOrderUrl"
              target="_blank"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-stone-bg hover:bg-stone-muted border border-stone-border text-[11px] font-bold text-ink transition-colors"
              title="Open live Sales Order in ERPNext Desk"
            >
              <AppIcon name="external-link" :size="12" />
              <span>ERPNext Desk</span>
            </a>
          </div>
          <h1 class="text-2xl font-black text-ink font-heading">
            {{ order.customerName }}
          </h1>
          <p class="text-xs text-ink-muted flex items-center gap-3">
            <span>Order Date: <strong>{{ formatDate(order.orderDate) }}</strong></span>
            <span>•</span>
            <span>Target Delivery: <strong>{{ formatDate(order.deliveryDate) }}</strong></span>
          </p>
        </div>

        <div class="text-right shrink-0">
          <span class="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
            Grand Total
          </span>
          <span class="text-3xl font-black text-ink font-heading num-tabular block">
            {{ formatCurrency(order.grandTotal) }}
          </span>
          <span class="text-xs text-ink-light block mt-0.5">
            {{ isOrderCompleted ? 'Paid' : order.billingStatus }}
          </span>
        </div>
      </div>

      <!-- STEP TRACKER -->
      <StepTracker
        :current-stage="order.stage"
        :is-completed="isOrderCompleted"
      />

      <!-- PROMINENT NEXT STEP CALLOUT BANNER -->
      <div
        v-if="!isOrderCompleted"
        class="bg-gradient-to-r from-signal-subtle/80 via-white to-stone-bg border-2 border-signal/40 p-6 rounded-3xl shadow-card flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div class="space-y-1 text-center sm:text-left">
          <div class="flex items-center justify-center sm:justify-start gap-2">
            <Badge variant="signal" size="sm" dot>{{ nextStepInfo?.badgeText || 'Action Required' }}</Badge>
            <span class="text-xs font-bold uppercase tracking-wider text-ink font-heading">
              Next Action:
            </span>
          </div>
          <p class="text-sm font-semibold text-ink">
            {{ nextStepInfo?.description }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 shrink-0">
          <!-- When invoice is ready: Show Record Payment -->
          <AppButton
            v-if="order.invoiceId && order.billingStatus !== 'Paid'"
            variant="primary"
            size="lg"
            :loading="actionLoading"
            class="font-extrabold px-8 py-3.5 shadow-lift text-base"
            @click="isPaymentModalOpen = true"
          >
            <AppIcon name="credit-card" :size="20" />
            <span>Record Payment ({{ formatCurrency(order.grandTotal) }})</span>
          </AppButton>

          <!-- When order not invoiced yet: Show BOTH Delivery AND Direct Invoicing -->
          <template v-else-if="!order.invoiceId">
            <AppButton
              v-if="order.deliveryStatus !== 'Fully Delivered'"
              variant="outline"
              size="lg"
              :loading="actionLoading"
              class="font-bold px-6 py-3 text-sm"
              @click="handleCreateDelivery"
            >
              <AppIcon name="truck" :size="18" />
              <span>Create Delivery</span>
            </AppButton>

            <AppButton
              variant="primary"
              size="lg"
              :loading="actionLoading"
              class="font-extrabold px-8 py-3.5 shadow-lift text-base"
              @click="handleCreateInvoice"
            >
              <AppIcon name="receipt" :size="20" />
              <span>{{ order.deliveryStatus === 'Fully Delivered' ? 'Generate Invoice' : 'Skip Delivery & Bill Directly' }}</span>
            </AppButton>
          </template>
        </div>
      </div>

      <!-- COMPLETED & FULLY PAID BANNER -->
      <div
        v-else
        class="bg-status-green-bg/60 border border-status-green/30 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-status-green"
      >
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-2xl bg-status-green text-white flex items-center justify-center shrink-0">
            <AppIcon name="check-circle" :size="22" />
          </div>
          <div>
            <h4 class="text-base font-extrabold font-heading text-ink">Order Completed & Bill Paid!</h4>
            <p class="text-xs text-ink-muted">All goods have been processed and full customer payment has been reconciled in ERPNext.</p>
          </div>
        </div>

        <a
          :href="deskOrderUrl"
          target="_blank"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-bg border border-stone-border text-xs font-bold text-ink shadow-2xs transition-colors shrink-0"
        >
          <AppIcon name="external-link" :size="14" />
          <span>View in ERPNext Desk</span>
        </a>
      </div>

      <!-- Order Items Table -->
      <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4">
        <h3 class="text-base font-bold text-ink font-heading pb-2 border-b border-stone-border">
          Ordered Line Items
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-xs uppercase tracking-wider text-ink-muted bg-stone-bg/50 border-b border-stone-border">
              <tr>
                <th class="px-4 py-2.5 font-semibold">Item & Code</th>
                <th class="px-4 py-2.5 font-semibold text-center">Quantity</th>
                <th class="px-4 py-2.5 font-semibold text-right">Unit Rate</th>
                <th class="px-4 py-2.5 font-semibold text-right">Line Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-border/60">
              <tr v-for="item in order.items" :key="item.id">
                <td class="px-4 py-3 font-medium text-ink">
                  <p class="font-bold">{{ item.itemName }}</p>
                  <p class="text-xs font-mono text-ink-muted">{{ item.itemCode }}</p>
                </td>
                <td class="px-4 py-3 text-center num-tabular text-ink">
                  {{ item.qty }} units
                </td>
                <td class="px-4 py-3 text-right num-tabular text-ink">
                  {{ formatCurrency(item.rate) }}
                </td>
                <td class="px-4 py-3 text-right font-extrabold text-ink num-tabular">
                  {{ formatCurrency(item.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Order Totals Box -->
        <div class="pt-4 border-t border-stone-border flex justify-end">
          <div class="w-72 space-y-2 text-xs">
            <div class="flex justify-between text-ink-muted">
              <span>Subtotal:</span>
              <span class="font-bold text-ink num-tabular">{{ formatCurrency(order.subtotal) }}</span>
            </div>
            <div class="flex justify-between text-ink-muted">
              <span>Sales Tax (15% VAT):</span>
              <span class="font-bold text-ink num-tabular">{{ formatCurrency(order.taxAmount) }}</span>
            </div>
            <div class="pt-2 border-t border-stone-border flex justify-between text-sm font-extrabold text-ink">
              <span>Grand Total:</span>
              <span class="text-signal font-heading text-base num-tabular">{{ formatCurrency(order.grandTotal) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Linked Documents Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Delivery Card -->
        <div class="bg-white p-5 rounded-2xl border border-stone-border shadow-2xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase text-ink-muted flex items-center gap-1.5">
              <AppIcon name="truck" :size="14" className="text-signal" />
              <span>Delivery Dispatch Note</span>
            </span>
            <Badge :variant="order.deliveryStatus === 'Fully Delivered' ? 'success' : 'neutral'" size="sm">
              {{ order.deliveryStatus }}
            </Badge>
          </div>
          <div v-if="order.deliveryNoteId" class="flex items-center justify-between pt-1">
            <p class="text-xs text-ink font-bold font-mono">
              {{ order.deliveryNoteId }}
            </p>
            <a
              v-if="deskDeliveryUrl"
              :href="deskDeliveryUrl"
              target="_blank"
              class="text-xs text-signal hover:underline font-semibold flex items-center gap-1"
            >
              <span>View in ERPNext</span>
              <AppIcon name="external-link" :size="12" />
            </a>
          </div>
          <p v-else class="text-xs text-ink-muted">Delivery note optional or not created.</p>
        </div>

        <!-- Invoice Card -->
        <div class="bg-white p-5 rounded-2xl border border-stone-border shadow-2xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase text-ink-muted flex items-center gap-1.5">
              <AppIcon name="receipt" :size="14" className="text-signal" />
              <span>Sales Invoice</span>
            </span>
            <Badge :variant="order.billingStatus === 'Paid' || isOrderCompleted ? 'success' : 'neutral'" size="sm">
              {{ isOrderCompleted ? 'Paid' : order.billingStatus }}
            </Badge>
          </div>
          <div v-if="order.invoiceId" class="flex items-center justify-between pt-1">
            <RouterLink
              :to="`/app/sales/invoices/${order.invoiceId}`"
              class="text-xs text-ink font-bold font-mono hover:text-signal transition-colors"
            >
              {{ order.invoiceId }}
            </RouterLink>
            <a
              v-if="deskInvoiceUrl"
              :href="deskInvoiceUrl"
              target="_blank"
              class="text-xs text-signal hover:underline font-semibold flex items-center gap-1"
            >
              <span>View in ERPNext</span>
              <AppIcon name="external-link" :size="12" />
            </a>
          </div>
          <p v-else class="text-xs text-ink-muted">No invoice generated yet.</p>
        </div>
      </div>
    </div>

    <!-- Empty State if order not found -->
    <div v-else-if="!loading" class="bg-white rounded-3xl border border-stone-border shadow-soft p-12 text-center">
      <EmptyState
        title="Sales order not found"
        description="The requested order does not exist in this workspace or has been removed."
      >
        <template #action>
          <RouterLink to="/app/sales/orders">
            <AppButton variant="primary" size="sm">
              <AppIcon name="orders" :size="16" />
              <span>Back to Sales Orders</span>
            </AppButton>
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <!-- Record Payment Modal -->
    <Modal
      :is-open="isPaymentModalOpen"
      title="Record Customer Payment"
      subtitle="Log incoming customer funds against this order's invoice in ERPNext."
      max-width="md"
      @close="isPaymentModalOpen = false"
    >
      <div class="space-y-4 text-xs">
        <Field label="Amount to Pay" required>
          <TextField v-model="payAmount" type="number" tabular />
        </Field>

        <Field label="Payment Mode">
          <select
            v-model="payMode"
            class="block w-full rounded-xl border border-stone-border bg-white px-3.5 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
          >
            <option value="Cash">Cash Receipt</option>
            <option value="Bank Transfer">Bank Wire Transfer</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cheque">Cheque</option>
          </select>
        </Field>

        <Field label="Bank Reference / Receipt #">
          <TextField v-model="payRef" placeholder="e.g. STANBIC-FT-88912" />
        </Field>
      </div>

      <template #footer>
        <AppButton variant="ghost" size="sm" @click="isPaymentModalOpen = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" :loading="actionLoading" @click="handleRecordPayment">
          Confirm Payment Receipt
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
