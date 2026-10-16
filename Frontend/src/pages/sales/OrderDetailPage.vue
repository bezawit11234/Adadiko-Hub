<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import { useToast } from '@/composables/useToast'
import type { SalesOrder } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import StepTracker from '@/components/common/StepTracker.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
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

// Payment modal state if paying directly from order detail
const isPaymentModalOpen = ref(false)
const payAmount = ref(0)
const payMode = ref<'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash'>('Bank Transfer')
const payRef = ref('')

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

// Prominent Next Step Computation
interface NextStepAction {
  label: string
  action: () => void
  icon: string
  badgeText: string
  description: string
}

const nextStepInfo = computed<NextStepAction | null>(() => {
  if (!order.value) return null
  const o = order.value

  // If order needs delivery
  if (o.deliveryStatus === 'Not Delivered') {
    return {
      label: 'Create Delivery',
      action: handleCreateDelivery,
      icon: 'truck',
      badgeText: 'Fulfillment Pending',
      description: 'Generate a delivery note for storekeeper dispatch and update stock levels.',
    }
  }

  // If delivered but needs invoice
  if (o.billingStatus === 'Not Billed' || !o.invoiceId) {
    return {
      label: 'Create Invoice',
      action: handleCreateInvoice,
      icon: 'receipt',
      badgeText: 'Billing Pending',
      description: 'Generate customer sales invoice and post outstanding debt to accounts receivable.',
    }
  }

  // If invoiced but needs payment
  if (o.billingStatus !== 'Paid' && o.invoiceId) {
    return {
      label: 'Record Payment',
      action: () => { isPaymentModalOpen.value = true },
      icon: 'credit-card',
      badgeText: 'Payment Pending',
      description: 'Log received customer wire or card receipt to complete transaction.',
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
      toast.success('Delivery Note Created', `Dispatched note ${res.data.id} created! Stock reserved.`)
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
      toast.success('Invoice Created', `Sales Invoice ${res.data.id} generated! Customer owes ${formatCurrency(res.data.grandTotal)}.`)
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
      payRef.value || 'WIRE-' + Math.floor(Math.random() * 900000 + 100000)
    )
    if (res.ok) {
      toast.success('Payment Recorded', `Payment of ${formatCurrency(payAmount.value)} recorded successfully!`)
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

    <SampleNotice text="Sales Order Lifecycle: Step tracker guides document transitions to Delivery Note and Sales Invoice." />

    <div v-if="order" class="space-y-6">
      <!-- Order Header Card -->
      <div class="bg-white rounded-3xl border border-stone-border shadow-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1.5">
          <div class="flex items-center gap-2.5">
            <span class="text-xs font-mono font-bold text-signal bg-signal-subtle px-2 py-0.5 rounded border border-signal/20">
              {{ order.id }}
            </span>
            <Badge :variant="order.status === 'Completed' ? 'success' : 'signal'" size="sm" dot>
              {{ order.status }}
            </Badge>
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
            {{ order.billingStatus }}
          </span>
        </div>
      </div>

      <!-- STEP TRACKER -->
      <StepTracker :current-stage="order.stage" />

      <!-- PROMINENT NEXT STEP CALLOUT BANNER -->
      <div
        v-if="nextStepInfo"
        class="bg-gradient-to-r from-signal-subtle/80 via-white to-stone-bg border-2 border-signal/40 p-6 rounded-3xl shadow-card flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div class="space-y-1 text-center sm:text-left">
          <div class="flex items-center justify-center sm:justify-start gap-2">
            <Badge variant="signal" size="sm" dot>{{ nextStepInfo.badgeText }}</Badge>
            <span class="text-xs font-bold uppercase tracking-wider text-ink font-heading">
              Recommended Next Action:
            </span>
          </div>
          <p class="text-sm font-semibold text-ink">
            {{ nextStepInfo.description }}
          </p>
        </div>

        <!-- Prominent Button -->
        <AppButton
          variant="primary"
          size="lg"
          :loading="actionLoading"
          class="font-extrabold px-8 py-3.5 shadow-lift text-base shrink-0"
          @click="nextStepInfo.action"
        >
          <AppIcon :name="nextStepInfo.icon" :size="20" />
          <span>{{ nextStepInfo.label }}</span>
        </AppButton>
      </div>

      <div
        v-else
        class="bg-status-green-bg/60 border border-status-green/30 p-5 rounded-2xl flex items-center gap-3 text-status-green"
      >
        <AppIcon name="check-circle" :size="24" />
        <div>
          <h4 class="text-sm font-bold">This Order is Completed!</h4>
          <p class="text-xs text-ink-muted">All goods have been delivered and full payment was received.</p>
        </div>
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
        <div class="bg-white p-5 rounded-2xl border border-stone-border shadow-2xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase text-ink-muted flex items-center gap-1.5">
              <AppIcon name="truck" :size="14" className="text-signal" />
              <span>Delivery Dispatch Note</span>
            </span>
            <Badge :variant="order.deliveryStatus === 'Fully Delivered' ? 'success' : 'neutral'" size="sm">
              {{ order.deliveryStatus }}
            </Badge>
          </div>
          <p v-if="order.deliveryNoteId" class="text-xs text-ink font-bold">
            Doc Ref: {{ order.deliveryNoteId }}
          </p>
          <p v-else class="text-xs text-ink-muted">No dispatch created yet.</p>
        </div>

        <!-- Invoice Card -->
        <div class="bg-white p-5 rounded-2xl border border-stone-border shadow-2xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase text-ink-muted flex items-center gap-1.5">
              <AppIcon name="receipt" :size="14" className="text-signal" />
              <span>Sales Invoice</span>
            </span>
            <Badge :variant="order.billingStatus === 'Paid' ? 'success' : 'neutral'" size="sm">
              {{ order.billingStatus }}
            </Badge>
          </div>
          <p v-if="order.invoiceId" class="text-xs text-ink font-bold">
            Doc Ref: {{ order.invoiceId }}
          </p>
          <p v-else class="text-xs text-ink-muted">No invoice generated yet.</p>
        </div>
      </div>
    </div>

    <!-- Record Payment Modal -->
    <Modal
      :is-open="isPaymentModalOpen"
      title="Record Customer Payment"
      subtitle="Log incoming customer funds against this order's invoice."
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
            <option value="Bank Transfer">Bank Wire Transfer</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cheque">Cheque</option>
            <option value="Cash">Cash Receipt</option>
          </select>
        </Field>

        <Field label="Bank Reference / Transaction #">
          <TextField v-model="payRef" placeholder="e.g. STANBIC-FT-88912" />
        </Field>
      </div>

      <template #footer>
        <AppButton variant="ghost" size="sm" @click="isPaymentModalOpen = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" :loading="actionLoading" @click="handleRecordPayment">
          Confirm Payment
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
