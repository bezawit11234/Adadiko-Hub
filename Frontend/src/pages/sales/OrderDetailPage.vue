<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import { getStoredSlug } from '@/services/frappeHttp'
import { useToast } from '@/composables/useToast'
import { useSession } from '@/composables/useSession'
import type { SalesOrder } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import DocumentStepTracker from '@/components/common/DocumentStepTracker.vue'
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
const { currentUser, currentRole } = useSession()

const isManagerOrAdmin = computed(() =>
  ['admin', 'manager', 'sales_manager'].includes(currentRole.value)
)
const isStorekeeper = computed(() => currentRole.value === 'storekeeper')
const isAccountant = computed(() => currentRole.value === 'accountant')

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

// Advance payment modal state
const isAdvanceModalOpen = ref(false)
const advanceAmount = ref(0)
const advanceMode = ref<'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash'>('Bank Transfer')
const advanceRef = ref('')

// Quick sale modal state
const isQuickSaleModalOpen = ref(false)
const quickSaleAmount = ref(0)
const quickSaleMode = ref<'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash'>('Cash')
const quickSaleRef = ref('')

const isOrderCompleted = computed(() => {
  if (!order.value) return false
  return (
    order.value.status === 'Completed' ||
    order.value.billingStatus === 'Paid'
  )
})

async function loadOrder() {
  loading.value = true
  try {
    const res = await salesApi.getSalesOrder(orderId.value)
    if (res.ok && res.data) {
      order.value = res.data
      payAmount.value = res.data.grandTotal
      advanceAmount.value = res.data.grandTotal
      quickSaleAmount.value = res.data.grandTotal
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrder()
})

async function handleApproveOrder() {
  if (!order.value) return
  actionLoading.value = true
  try {
    const res = await salesApi.approveSalesOrder(order.value.id)
    if (res.ok && res.data) {
      toast.success('Sales Order Approved', `Order ${order.value.id} is confirmed and submitted in ERPNext.`)
      await loadOrder()
    } else {
      toast.error('Approval Failed', res.error)
    }
  } finally {
    actionLoading.value = false
  }
}

async function handleRejectOrder() {
  if (!order.value) return
  actionLoading.value = true
  try {
    const res = await salesApi.rejectSalesOrder(order.value.id, 'Rejected by manager')
    if (res.ok) {
      toast.success('Sales Order Rejected', `Order ${order.value.id} has been cancelled.`)
      router.push('/app/sales/orders')
    } else {
      toast.error('Rejection Failed', res.error)
    }
  } finally {
    actionLoading.value = false
  }
}

async function handleCreateDelivery() {
  if (!order.value) return
  actionLoading.value = true
  try {
    const res = await salesApi.createDelivery(order.value.id)
    if (res.ok && res.data) {
      toast.success('Delivery Note Created', `Delivery Note ${res.data.id} recorded in ERPNext! Stock deducted once.`)
      await loadOrder()
    } else {
      toast.error('Failed to create delivery', res.error)
    }
  } finally {
    actionLoading.value = false
  }
}

async function handleCreateInvoice(updateStock = false) {
  if (!order.value) return
  actionLoading.value = true
  try {
    const res = await salesApi.createInvoiceFromOrder(order.value.id, updateStock)
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

async function handleRecordAdvance() {
  if (!order.value) return
  if (advanceAmount.value <= 0) {
    toast.error('Validation error', 'Please enter a valid advance payment amount.')
    return
  }
  actionLoading.value = true
  try {
    const res = await salesApi.recordAdvancePayment(
      order.value.id,
      advanceAmount.value,
      advanceMode.value,
      advanceRef.value || `ADV-${Date.now().toString().slice(-6)}`
    )
    if (res.ok && res.data) {
      toast.success('Advance Payment Recorded', `Payment Entry ${res.data.id} recorded against Sales Order ${order.value.id}!`)
      isAdvanceModalOpen.value = false
      await loadOrder()
    } else {
      toast.error('Advance payment failed', res.error)
    }
  } finally {
    actionLoading.value = false
  }
}

async function handleQuickSaleSubmit() {
  if (!order.value) return
  actionLoading.value = true
  try {
    // 1. Create Sales Invoice with update_stock = 1
    const invRes = await salesApi.createInvoiceFromOrder(order.value.id, true)
    if (!invRes.ok || !invRes.data) {
      toast.error('Quick Sale Failed', invRes.error)
      return
    }

    toast.success('Quick Sale Invoiced', `Sales Invoice ${invRes.data.id} created with immediate stock update!`)

    // 2. If user specified payment amount, record Payment Entry
    if (quickSaleAmount.value > 0) {
      const payRes = await salesApi.recordPayment(
        invRes.data.id,
        quickSaleAmount.value,
        quickSaleMode.value,
        quickSaleRef.value || `QS-${Date.now().toString().slice(-6)}`
      )
      if (payRes.ok) {
        toast.success('Payment Reconciled', `Immediate payment receipt of ${formatCurrency(quickSaleAmount.value)} recorded!`)
      } else {
        toast.error('Payment Entry Warning', payRes.error)
      }
    }

    isQuickSaleModalOpen.value = false
    await loadOrder()
  } finally {
    actionLoading.value = false
  }
}

async function handleRecordPayment() {
  if (!order.value || !order.value.invoiceId) return
  if (payAmount.value <= 0) {
    toast.error('Validation error', 'Please specify a positive payment amount.')
    return
  }
  actionLoading.value = true
  try {
    const res = await salesApi.recordPayment(
      order.value.invoiceId,
      payAmount.value,
      payMode.value,
      payRef.value || 'PAY-' + Math.floor(Math.random() * 900000 + 100000)
    )
    if (res.ok) {
      toast.success('Payment Recorded', `Payment of ${formatCurrency(payAmount.value)} confirmed! Order reconciled.`)
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
            <Badge
              :variant="isOrderCompleted ? 'success' : order.status === 'Draft' ? 'neutral' : 'signal'"
              size="sm"
              dot
            >
              {{ isOrderCompleted ? 'Completed (Paid)' : order.status }}
            </Badge>

            <a
              v-if="isManagerOrAdmin"
              :href="deskOrderUrl"
              target="_blank"
              rel="noopener noreferrer"
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
            {{ isOrderCompleted ? 'Fully Paid' : order.billingStatus }}
          </span>
        </div>
      </div>

      <!-- UNIVERSAL DOCUMENT STEP TRACKER -->
      <DocumentStepTracker
        :lead-id="order.leadId"
        :opportunity-id="order.opportunityId"
        :quotation-id="order.quotationId"
        :sales-order-id="order.id"
        :delivery-id="order.deliveryNoteId"
        :invoice-id="order.invoiceId"
        :payment-id="order.paymentId || order.advancePaymentId"
        :delivery-not-needed="Boolean(order.allNonStock)"
        :current-doc-type="'Sales Order'"
        :current-doc-id="order.id"
        @next-action="order.invoiceId ? (isPaymentModalOpen = true) : !order.deliveryNoteId ? handleCreateDelivery() : handleCreateInvoice()"
      />

      <!-- DRAFT APPROVAL BANNER (WHEN ORDER IS DRAFT) -->
      <div
        v-if="order.status === 'Draft'"
        class="p-6 rounded-3xl bg-status-amber-bg/60 border-2 border-status-amber/30 shadow-card flex flex-col sm:flex-row items-center justify-between gap-5"
      >
        <div class="space-y-1 text-center sm:text-left">
          <div class="flex items-center justify-center sm:justify-start gap-2">
            <Badge variant="warning" size="sm" dot>Approval Required</Badge>
            <span class="text-xs font-bold uppercase tracking-wider text-ink font-heading">
              Draft Sales Order
            </span>
          </div>
          <p class="text-sm font-semibold text-ink">
            {{ isManagerOrAdmin ? 'This sales order was saved as a draft. Review item availability and approve to submit into ERPNext.' : 'Order saved as draft. Waiting for Sales Manager or Company Admin approval.' }}
          </p>
        </div>

        <div v-if="isManagerOrAdmin" class="flex items-center gap-3 shrink-0">
          <AppButton
            variant="ghost"
            size="md"
            :loading="actionLoading"
            class="text-status-red hover:bg-status-red/10"
            @click="handleRejectOrder"
          >
            <span>Reject / Cancel</span>
          </AppButton>
          <AppButton
            variant="primary"
            size="md"
            :loading="actionLoading"
            class="font-bold px-6 py-2.5"
            @click="handleApproveOrder"
          >
            <AppIcon name="check" :size="16" />
            <span>Approve & Submit Order</span>
          </AppButton>
        </div>
      </div>

      <!-- FULFILMENT CHOICES (WHEN ORDER APPROVED AND NOT COMPLETED) -->
      <div
        v-else-if="!isOrderCompleted"
        class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 sm:p-8 space-y-6"
      >
        <div class="flex items-center justify-between pb-3 border-b border-stone-border">
          <div>
            <h2 class="text-base font-bold text-ink font-heading">
              Fulfilment & Commercial Settlement
            </h2>
            <p class="text-xs text-ink-muted">
              Choose the fulfilment route matching this order's physical dispatch and billing requirements.
            </p>
          </div>
          <Badge variant="signal" size="sm">ERPNext Standard Flow</Badge>
        </div>

        <!-- STAGE A: AWAITING PAYMENT ON AN ISSUED INVOICE -->
        <div
          v-if="order.invoiceId && order.billingStatus !== 'Paid'"
          class="p-6 rounded-2xl bg-signal-subtle/50 border border-signal/20 flex flex-col sm:flex-row items-center justify-between gap-5"
        >
          <div class="space-y-1">
            <span class="text-xs font-bold uppercase tracking-wider text-signal block">Receivable Ledger Open</span>
            <p class="text-sm font-bold text-ink">
              Sales Invoice {{ order.invoiceId }} is posted. Record the customer payment receipt to complete order.
            </p>
          </div>
          <AppButton
            variant="primary"
            size="md"
            :loading="actionLoading"
            class="font-extrabold px-7 py-3"
            @click="isPaymentModalOpen = true"
          >
            <AppIcon name="credit-card" :size="18" />
            <span>Record Payment ({{ formatCurrency(order.grandTotal) }})</span>
          </AppButton>
        </div>

        <!-- STAGE B: GOODS DISPATCHED, AWAITING INVOICE GENERATION -->
        <div
          v-else-if="order.deliveryNoteId && !order.invoiceId"
          class="p-6 rounded-2xl bg-signal-subtle/50 border border-signal/20 flex flex-col sm:flex-row items-center justify-between gap-5"
        >
          <div class="space-y-1">
            <span class="text-xs font-bold uppercase tracking-wider text-status-green block">Delivery Note Confirmed ({{ order.deliveryNoteId }})</span>
            <p class="text-sm font-bold text-ink">
              Goods dispatched and inventory reduced. Generate the sales invoice from the delivery note.
            </p>
          </div>
          <AppButton
            variant="primary"
            size="md"
            :loading="actionLoading"
            class="font-extrabold px-7 py-3"
            @click="handleCreateInvoice(false)"
          >
            <AppIcon name="receipt" :size="18" />
            <span>Generate Invoice from Delivery Note</span>
          </AppButton>
        </div>

        <!-- STAGE C: APPROVED SALES ORDER READY FOR FULFILMENT -->
        <div v-else-if="!order.deliveryNoteId && !order.invoiceId" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Choice 1: Deliver Later (Standard stock items) -->
          <div class="p-5 rounded-2xl bg-stone-bg/50 border border-stone-border flex flex-col justify-between space-y-4">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2">
                <AppIcon name="truck" :size="18" className="text-signal" />
                <h3 class="text-sm font-bold text-ink">1. Deliver Later (Standard Flow)</h3>
              </div>
              <p class="text-xs text-ink-muted leading-relaxed">
                Dispatch physical goods with a Delivery Note first. Decreases warehouse stock once, then bills from the Delivery Note.
              </p>
            </div>
            <AppButton
              variant="primary"
              size="sm"
              :loading="actionLoading"
              class="w-full font-bold"
              @click="handleCreateDelivery"
            >
              <span>Create Delivery Note</span>
            </AppButton>
          </div>

          <!-- Choice 2: Invoice without delivery (Allowed ONLY if all non-stock items) -->
          <div
            :class="[
              'p-5 rounded-2xl border flex flex-col justify-between space-y-4',
              order.allNonStock ? 'bg-stone-bg/50 border-stone-border' : 'bg-stone-bg/20 border-stone-border/40 opacity-70',
            ]"
          >
            <div class="space-y-1.5">
              <div class="flex items-center gap-2">
                <AppIcon name="receipt" :size="18" className="text-signal" />
                <h3 class="text-sm font-bold text-ink">2. Invoice Without Delivery</h3>
              </div>
              <p class="text-xs text-ink-muted leading-relaxed">
                Allowed for pure service orders (Maintain Stock off). Delivery step marked as "not needed".
              </p>
            </div>
            <div>
              <AppButton
                v-if="order.allNonStock"
                variant="outline"
                size="sm"
                :loading="actionLoading"
                class="w-full font-bold"
                @click="handleCreateInvoice(false)"
              >
                <span>Bill Services (No Delivery)</span>
              </AppButton>
              <div v-else class="text-[11px] text-ink-light bg-stone-bg p-2 rounded-lg border border-stone-border text-center">
                Disabled: Order contains stock items that require delivery.
              </div>
            </div>
          </div>

          <!-- Choice 3: Hand Over & Pay Now (Quick Sale) -->
          <div class="p-5 rounded-2xl bg-stone-bg/50 border border-stone-border flex flex-col justify-between space-y-4">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2">
                <AppIcon name="zap" :size="18" className="text-status-amber" />
                <h3 class="text-sm font-bold text-ink">3. Hand Over & Pay Now (Quick Sale)</h3>
              </div>
              <p class="text-xs text-ink-muted leading-relaxed">
                Immediate counter sale: creates Sales Invoice with direct stock deduction, plus optional payment entry. No Delivery Note.
              </p>
            </div>
            <AppButton
              variant="outline"
              size="sm"
              class="w-full font-bold"
              @click="isQuickSaleModalOpen = true"
            >
              <span>Quick Sale (Hand Over & Pay)</span>
            </AppButton>
          </div>

          <!-- Choice 4: Advance Payment -->
          <div class="p-5 rounded-2xl bg-stone-bg/50 border border-stone-border flex flex-col justify-between space-y-4">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2">
                <AppIcon name="credit-card" :size="18" className="text-status-green" />
                <h3 class="text-sm font-bold text-ink">4. Advance Payment</h3>
              </div>
              <p class="text-xs text-ink-muted leading-relaxed">
                Record customer deposit or advance against this Sales Order before dispatching or invoicing.
              </p>
              <span v-if="order.advancePaid && order.advancePaid > 0" class="text-xs font-bold text-status-green block">
                Advance Paid: {{ formatCurrency(order.advancePaid) }}
              </span>
            </div>
            <AppButton
              variant="outline"
              size="sm"
              class="w-full font-bold"
              @click="isAdvanceModalOpen = true"
            >
              <span>Record Advance Deposit</span>
            </AppButton>
          </div>
        </div>
      </div>

      <!-- ORDER COMPLETED & PAID BANNER -->
      <div
        v-else
        class="bg-gradient-to-r from-status-green/10 via-white to-stone-bg border-2 border-status-green/30 p-6 rounded-3xl shadow-card flex items-center justify-between"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <Badge variant="success" size="sm" dot>Transaction Completed</Badge>
            <span class="text-xs font-bold uppercase tracking-wider text-ink font-heading">
              Fully Delivered & Reconciled
            </span>
          </div>
          <p class="text-sm font-semibold text-ink">
            ERPNext reports order status is Completed and invoice is fully Paid.
          </p>
        </div>
        <AppIcon name="check-circle" :size="32" className="text-status-green" />
      </div>

      <!-- ORDER ITEMS TABLE -->
      <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 sm:p-8 space-y-4">
        <h3 class="text-sm font-bold text-ink font-heading pb-2 border-b border-stone-border">
          Order Line Items
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead>
              <tr class="text-ink-muted border-b border-stone-border">
                <th class="py-2.5 font-bold">Item</th>
                <th class="py-2.5 font-bold text-right">Quantity</th>
                <th class="py-2.5 font-bold text-right">Rate</th>
                <th class="py-2.5 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-border/60">
              <tr v-for="item in order.items" :key="item.id" class="text-ink">
                <td class="py-3">
                  <span class="font-bold">{{ item.itemName }}</span>
                  <span class="text-ink-muted font-mono block text-[11px]">{{ item.itemCode }}</span>
                </td>
                <td class="py-3 text-right font-mono">{{ item.qty }}</td>
                <td class="py-3 text-right font-mono">{{ formatCurrency(item.rate) }}</td>
                <td class="py-3 text-right font-mono font-bold">{{ formatCurrency(item.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="bg-white rounded-3xl border border-stone-border shadow-soft p-12 text-center">
      <EmptyState
        title="Sales Order Not Found"
        description="The requested sales order does not exist or has been removed."
      />
    </div>

    <!-- Modal: Record Payment for Invoice -->
    <Modal
      :is-open="isPaymentModalOpen"
      title="Record Payment Receipt"
      subtitle="Reconcile customer invoice against official payment mode."
      max-width="md"
      @close="isPaymentModalOpen = false"
    >
      <div class="space-y-4 text-xs">
        <Field label="Amount to Settle" required>
          <TextField v-model="payAmount" type="number" step="0.01" />
        </Field>

        <Field label="Payment Method" required>
          <select
            v-model="payMode"
            class="block w-full rounded-xl border border-stone-border bg-white px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
          >
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cheque">Cheque</option>
          </select>
        </Field>

        <Field label="Transaction / Cheque Reference #">
          <TextField v-model="payRef" placeholder="e.g. TRN-99882" />
        </Field>
      </div>

      <template #footer>
        <AppButton variant="ghost" size="sm" @click="isPaymentModalOpen = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" :loading="actionLoading" @click="handleRecordPayment">
          Confirm Payment Entry
        </AppButton>
      </template>
    </Modal>

    <!-- Modal: Advance Payment for Sales Order -->
    <Modal
      :is-open="isAdvanceModalOpen"
      title="Record Advance Deposit"
      subtitle="Record an advance payment against this Sales Order before dispatch."
      max-width="md"
      @close="isAdvanceModalOpen = false"
    >
      <div class="space-y-4 text-xs">
        <Field label="Deposit Amount" required>
          <TextField v-model="advanceAmount" type="number" step="0.01" />
        </Field>

        <Field label="Payment Method" required>
          <select
            v-model="advanceMode"
            class="block w-full rounded-xl border border-stone-border bg-white px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
          >
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cheque">Cheque</option>
          </select>
        </Field>

        <Field label="Reference / Cheque #">
          <TextField v-model="advanceRef" placeholder="e.g. ADV-REF-101" />
        </Field>
      </div>

      <template #footer>
        <AppButton variant="ghost" size="sm" @click="isAdvanceModalOpen = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" :loading="actionLoading" @click="handleRecordAdvance">
          Post Advance Receipt
        </AppButton>
      </template>
    </Modal>

    <!-- Modal: Quick Sale (Hand over and pay now) -->
    <Modal
      :is-open="isQuickSaleModalOpen"
      title="Quick Sale: Hand Over & Pay Now"
      subtitle="Generates one Sales Invoice with direct stock update and optional cash payment."
      max-width="md"
      @close="isQuickSaleModalOpen = false"
    >
      <div class="space-y-4 text-xs">
        <div class="p-3 rounded-xl bg-status-amber-bg/50 border border-status-amber/20 text-ink">
          <p class="font-bold text-status-amber">Double-deduction Guard:</p>
          <p class="text-[11px] text-ink-muted">
            Stock will be deducted once directly on the Sales Invoice. Never combined with a Delivery Note.
          </p>
        </div>

        <Field label="Collected Payment Amount" hint="Leave at full amount or adjust if partial">
          <TextField v-model="quickSaleAmount" type="number" step="0.01" />
        </Field>

        <Field label="Payment Mode">
          <select
            v-model="quickSaleMode"
            class="block w-full rounded-xl border border-stone-border bg-white px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
          >
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cheque">Cheque</option>
          </select>
        </Field>

        <Field label="Receipt Reference">
          <TextField v-model="quickSaleRef" placeholder="e.g. COUNTER-SALE-01" />
        </Field>
      </div>

      <template #footer>
        <AppButton variant="ghost" size="sm" @click="isQuickSaleModalOpen = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" :loading="actionLoading" @click="handleQuickSaleSubmit">
          Confirm Quick Sale
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
