<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import { useToast } from '@/composables/useToast'
import type { SalesInvoice } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Modal from '@/components/common/Modal.vue'
import Field from '@/components/common/Field.vue'
import TextField from '@/components/common/TextField.vue'
import { formatCurrency, formatDate } from '@/utils/format'

const route = useRoute()
const invoiceId = computed(() => route.params.id as string)
const salesApi = getSalesApi()
const toast = useToast()

const invoice = ref<SalesInvoice | null>(null)
const loading = ref(true)

// Payment Dialog
const isPaymentModalOpen = ref(false)
const payAmount = ref(0)
const payMode = ref<'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash'>('Bank Transfer')
const payRef = ref('')
const recordingPayment = ref(false)

async function loadInvoice() {
  loading.value = true
  try {
    const res = await salesApi.getSalesInvoice(invoiceId.value)
    if (res.ok && res.data) {
      invoice.value = res.data
      payAmount.value = res.data.outstandingAmount
      payRef.value = 'WIRE-' + Math.floor(Math.random() * 900000 + 100000)
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadInvoice()
})

async function handleRecordPayment() {
  if (!invoice.value || payAmount.value <= 0) return
  recordingPayment.value = true
  try {
    const res = await salesApi.recordPayment(
      invoice.value.id,
      payAmount.value,
      payMode.value,
      payRef.value
    )
    if (res.ok) {
      toast.success('Payment Recorded', `Payment of ${formatCurrency(payAmount.value)} recorded!`)
      isPaymentModalOpen.value = false
      await loadInvoice()
    } else {
      toast.error('Payment Error', res.error)
    }
  } finally {
    recordingPayment.value = false
  }
}
</script>

<template>
  <PageContainer max-width="2xl">
    <div class="flex items-center gap-2 text-xs text-ink-muted">
      <RouterLink to="/app/sales/invoices" class="hover:text-ink">Invoices</RouterLink>
      <span>/</span>
      <span class="text-ink font-semibold">{{ invoiceId }}</span>
    </div>

    <SampleNotice text="Sales Invoice DocType: Detailed breakdown of charges, customer debt balance, and payment settlement actions." />

    <div v-if="invoice" class="space-y-6">
      <!-- Invoice Header Card -->
      <div class="bg-white rounded-3xl border border-stone-border shadow-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1.5">
          <div class="flex items-center gap-2.5">
            <span class="text-xs font-mono font-bold text-signal bg-signal-subtle px-2 py-0.5 rounded border border-signal/20">
              {{ invoice.id }}
            </span>
            <Badge
              :variant="invoice.status === 'Paid' ? 'success' : invoice.status === 'Overdue' ? 'danger' : 'warning'"
              size="sm"
              dot
            >
              {{ invoice.status }}
            </Badge>
          </div>
          <h1 class="text-2xl font-black text-ink font-heading">
            {{ invoice.customerName }}
          </h1>
          <p class="text-xs text-ink-muted flex items-center gap-3">
            <span>Invoice Date: <strong>{{ formatDate(invoice.postingDate) }}</strong></span>
            <span>•</span>
            <span>Due Date: <strong>{{ formatDate(invoice.dueDate) }}</strong></span>
          </p>
        </div>

        <div class="text-right shrink-0">
          <span class="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
            Customer Owes
          </span>
          <span
            :class="[
              'text-3xl font-black font-heading num-tabular block',
              invoice.outstandingAmount > 0 ? 'text-status-red' : 'text-status-green',
            ]"
          >
            {{ formatCurrency(invoice.outstandingAmount) }}
          </span>
          <span class="text-xs text-ink-light block mt-0.5">
            Total Billed: {{ formatCurrency(invoice.grandTotal) }}
          </span>
        </div>
      </div>

      <!-- Action Banner: If customer owes balance -->
      <div
        v-if="invoice.outstandingAmount > 0"
        class="bg-white border-2 border-signal/30 p-6 rounded-3xl shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div>
          <h3 class="text-base font-bold text-ink font-heading">
            Payment Pending Settlement
          </h3>
          <p class="text-xs text-ink-muted">
            The customer owes {{ formatCurrency(invoice.outstandingAmount) }}. Click below once bank wire or cash receipt is confirmed.
          </p>
        </div>
        <AppButton variant="primary" size="md" @click="isPaymentModalOpen = true">
          <AppIcon name="credit-card" :size="16" />
          <span>Record Payment</span>
        </AppButton>
      </div>

      <!-- Line Items Breakdown -->
      <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 space-y-4">
        <h3 class="text-base font-bold text-ink font-heading pb-2 border-b border-stone-border">
          Billed Items
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-xs uppercase tracking-wider text-ink-muted bg-stone-bg/50 border-b border-stone-border">
              <tr>
                <th class="px-4 py-2.5 font-semibold">Item & Code</th>
                <th class="px-4 py-2.5 font-semibold text-center">Quantity</th>
                <th class="px-4 py-2.5 font-semibold text-right">Unit Rate</th>
                <th class="px-4 py-2.5 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-border/60">
              <tr v-for="item in invoice.items" :key="item.id">
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

        <div class="pt-4 border-t border-stone-border flex justify-end">
          <div class="w-72 space-y-2 text-xs">
            <div class="flex justify-between text-ink-muted">
              <span>Amount Paid:</span>
              <span class="font-bold text-status-green num-tabular">{{ formatCurrency(invoice.amountPaid) }}</span>
            </div>
            <div class="flex justify-between text-ink-muted">
              <span>Outstanding Debt:</span>
              <span class="font-bold text-status-red num-tabular">{{ formatCurrency(invoice.outstandingAmount) }}</span>
            </div>
            <div class="pt-2 border-t border-stone-border flex justify-between text-base font-black text-ink">
              <span>Grand Total:</span>
              <span class="text-signal font-heading num-tabular">{{ formatCurrency(invoice.grandTotal) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State if invoice not found -->
    <div v-else-if="!loading" class="bg-white rounded-3xl border border-stone-border shadow-soft p-12 text-center">
      <EmptyState
        title="Sales invoice not found"
        description="The requested sales invoice does not exist in this workspace or has been removed."
      >
        <template #action>
          <RouterLink to="/app/sales/invoices">
            <AppButton variant="primary" size="sm">
              <AppIcon name="invoices" :size="16" />
              <span>Back to Invoices</span>
            </AppButton>
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <!-- Record Payment Modal -->
    <Modal
      :is-open="isPaymentModalOpen"
      title="Record Customer Payment"
      :subtitle="`Applying funds against Invoice ${invoice?.id}`"
      max-width="md"
      @close="isPaymentModalOpen = false"
    >
      <div v-if="invoice" class="space-y-4 text-xs">
        <Field label="Amount to Pay ($)" required>
          <TextField v-model="payAmount" type="number" tabular />
        </Field>

        <Field label="Payment Mode" required>
          <select
            v-model="payMode"
            class="block w-full rounded-xl border border-stone-border bg-white px-3.5 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
          >
            <option value="Bank Transfer">Bank Wire Transfer</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cheque">Cheque</option>
            <option value="Cash">Cash</option>
          </select>
        </Field>

        <Field label="Bank / Transaction Reference #" required>
          <TextField v-model="payRef" placeholder="e.g. STANBIC-WIRE-881204" />
        </Field>
      </div>

      <template #footer>
        <AppButton variant="ghost" size="sm" @click="isPaymentModalOpen = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" :loading="recordingPayment" @click="handleRecordPayment">
          Confirm Payment
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
