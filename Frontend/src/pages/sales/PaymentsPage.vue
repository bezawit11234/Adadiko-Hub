<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import { useToast } from '@/composables/useToast'
import type { Payment, SalesInvoice } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import TextField from '@/components/common/TextField.vue'
import Modal from '@/components/common/Modal.vue'
import Field from '@/components/common/Field.vue'
import { formatCurrency, formatDate } from '@/utils/format'

const router = useRouter()
const salesApi = getSalesApi()
const toast = useToast()

const payments = ref<Payment[]>([])
const invoices = ref<SalesInvoice[]>([])
const loading = ref(true)
const search = ref('')
const activeFilter = ref<'all' | 'Bank Transfer' | 'Cash' | 'Credit Card' | 'Cheque'>('all')

// Record Payment Modal State
const isPaymentModalOpen = ref(false)
const selectedInvoiceId = ref('')
const payAmount = ref(0)
const payMode = ref<'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash'>('Bank Transfer')
const payRef = ref('')
const recordingPayment = ref(false)

const columns: Column[] = [
  { key: 'id', label: 'Payment Voucher #' },
  { key: 'customerName', label: 'Customer' },
  { key: 'invoiceId', label: 'Against Invoice' },
  { key: 'date', label: 'Payment Date' },
  { key: 'modeOfPayment', label: 'Payment Mode' },
  { key: 'referenceNo', label: 'Reference #' },
  { key: 'amount', label: 'Amount Paid', align: 'right' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

async function loadData() {
  loading.value = true
  try {
    const [payRes, invRes] = await Promise.all([
      salesApi.listPayments ? salesApi.listPayments() : { ok: true, data: [] },
      salesApi.listSalesInvoices(),
    ])
    if (payRes.ok && payRes.data) {
      payments.value = payRes.data
    }
    if (invRes.ok && invRes.data) {
      invoices.value = invRes.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const filteredPayments = computed(() => {
  let list = payments.value
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.referenceNo.toLowerCase().includes(q) ||
        p.invoiceId.toLowerCase().includes(q)
    )
  }

  if (activeFilter.value !== 'all') {
    list = list.filter((p) => p.modeOfPayment === activeFilter.value)
  }

  return list.slice().sort((a, b) => {
    const dateA = a.date || ''
    const dateB = b.date || ''
    if (dateA !== dateB) return dateB.localeCompare(dateA)
    return b.id.localeCompare(a.id)
  })
})

const totalCollected = computed(() => {
  return payments.value.reduce((acc, p) => acc + (p.amount || 0), 0)
})

const unpaidInvoices = computed(() => {
  return invoices.value.filter((i) => i.outstandingAmount > 0)
})

function openNewPaymentModal() {
  if (unpaidInvoices.value.length > 0) {
    selectedInvoiceId.value = unpaidInvoices.value[0].id
    payAmount.value = unpaidInvoices.value[0].outstandingAmount
  } else {
    selectedInvoiceId.value = ''
    payAmount.value = 100
  }
  payMode.value = 'Bank Transfer'
  payRef.value = 'WIRE-' + Math.floor(Math.random() * 900000 + 100000)
  isPaymentModalOpen.value = true
}

function onInvoiceSelectChange() {
  const inv = invoices.value.find((i) => i.id === selectedInvoiceId.value)
  if (inv) {
    payAmount.value = inv.outstandingAmount
  }
}

async function handleRecordPayment() {
  if (!selectedInvoiceId.value) {
    toast.error('Validation', 'Please select an invoice to record payment against.')
    return
  }
  if (payAmount.value <= 0) {
    toast.error('Validation', 'Payment amount must be greater than zero.')
    return
  }

  recordingPayment.value = true
  try {
    const res = await salesApi.recordPayment(
      selectedInvoiceId.value,
      payAmount.value,
      payMode.value,
      payRef.value.trim() || 'REF-DIRECT'
    )

    if (res.ok && res.data) {
      toast.success('Payment Recorded', `Voucher ${res.data.id} created for ${formatCurrency(res.data.amount)}.`)
      isPaymentModalOpen.value = false
      await loadData()
    } else {
      toast.error('Payment Failed', res.error || 'Failed to record payment.')
    }
  } finally {
    recordingPayment.value = false
  }
}
</script>

<template>
  <PageContainer>
    <SectionHeading
      title="Payments & Receipts"
      description="Track customer payments, settlement vouchers, and reconcile outstanding invoices with ERPNext."
    >
      <template #actions>
        <AppButton variant="primary" size="sm" @click="openNewPaymentModal">
          <AppIcon name="plus" :size="14" class="mr-1.5" />
          Record Payment
        </AppButton>
      </template>
    </SectionHeading>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="p-4 rounded-2xl bg-white border border-stone-border shadow-soft flex items-center justify-between">
        <div>
          <div class="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Total Collected</div>
          <div class="text-xl font-bold font-heading text-status-green mt-0.5">
            {{ formatCurrency(totalCollected) }}
          </div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-status-green/10 text-status-green flex items-center justify-center">
          <AppIcon name="credit-card" :size="20" />
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-white border border-stone-border shadow-soft flex items-center justify-between">
        <div>
          <div class="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Settled Payments</div>
          <div class="text-xl font-bold font-heading text-ink mt-0.5">
            {{ payments.length }}
          </div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-signal-subtle text-signal flex items-center justify-center">
          <AppIcon name="check-circle" :size="20" />
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-white border border-stone-border shadow-soft flex items-center justify-between">
        <div>
          <div class="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Unpaid Invoices</div>
          <div class="text-xl font-bold font-heading text-status-red mt-0.5">
            {{ unpaidInvoices.length }}
          </div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-status-red/10 text-status-red flex items-center justify-center">
          <AppIcon name="invoices" :size="20" />
        </div>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
      <div class="w-full sm:w-72">
        <TextField
          v-model="search"
          placeholder="Search voucher, customer, ref..."
          clearable
        >
          <template #prefix>
            <AppIcon name="search" :size="14" class="text-ink-muted" />
          </template>
        </TextField>
      </div>

      <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
        <button
          type="button"
          @click="activeFilter = 'all'"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
            activeFilter === 'all'
              ? 'bg-ink text-white font-semibold'
              : 'bg-white border border-stone-border text-ink hover:bg-stone-subtle'
          ]"
        >
          All ({{ payments.length }})
        </button>
        <button
          type="button"
          @click="activeFilter = 'Bank Transfer'"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
            activeFilter === 'Bank Transfer'
              ? 'bg-ink text-white font-semibold'
              : 'bg-white border border-stone-border text-ink hover:bg-stone-subtle'
          ]"
        >
          Bank Transfer
        </button>
        <button
          type="button"
          @click="activeFilter = 'Cash'"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
            activeFilter === 'Cash'
              ? 'bg-ink text-white font-semibold'
              : 'bg-white border border-stone-border text-ink hover:bg-stone-subtle'
          ]"
        >
          Cash
        </button>
        <button
          type="button"
          @click="activeFilter = 'Credit Card'"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
            activeFilter === 'Credit Card'
              ? 'bg-ink text-white font-semibold'
              : 'bg-white border border-stone-border text-ink hover:bg-stone-subtle'
          ]"
        >
          Credit Card
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <DataTable
      :columns="columns"
      :rows="filteredPayments"
      :loading="loading"
      row-key="id"
      empty-title="No payments found"
      empty-description="Record your first incoming customer payment receipt."
    >
      <template #cell-id="{ row }">
        <span class="font-mono text-xs font-bold text-signal">
          {{ row.id }}
        </span>
      </template>

      <template #cell-customerName="{ row }">
        <span class="font-medium text-xs text-ink">{{ row.customerName }}</span>
      </template>

      <template #cell-invoiceId="{ row }">
        <RouterLink
          :to="`/app/sales/invoices/${encodeURIComponent(row.invoiceId)}`"
          class="font-mono text-xs text-signal hover:underline"
          v-if="row.invoiceId"
        >
          {{ row.invoiceId }}
        </RouterLink>
        <span v-else class="text-ink-muted text-xs">—</span>
      </template>

      <template #cell-date="{ row }">
        <span class="font-mono text-xs text-ink-muted">
          {{ row.date ? formatDate(row.date) : '—' }}
        </span>
      </template>

      <template #cell-modeOfPayment="{ row }">
        <Badge variant="neutral" size="sm">
          {{ row.modeOfPayment }}
        </Badge>
      </template>

      <template #cell-referenceNo="{ row }">
        <span class="font-mono text-xs text-ink">
          {{ row.referenceNo || '—' }}
        </span>
      </template>

      <template #cell-amount="{ row }">
        <span class="font-mono text-xs font-bold text-status-green">
          {{ formatCurrency(row.amount) }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <RouterLink
          v-if="row.invoiceId"
          :to="`/app/sales/invoices/${encodeURIComponent(row.invoiceId)}`"
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-border bg-white text-ink hover:bg-stone-subtle transition-colors"
        >
          <AppIcon name="receipt" :size="12" />
          <span>View Invoice</span>
        </RouterLink>
      </template>
    </DataTable>

    <!-- Record Payment Modal -->
    <Modal
      :is-open="isPaymentModalOpen"
      title="Record Customer Payment"
      @close="isPaymentModalOpen = false"
    >
      <div class="space-y-4 text-xs">
        <Field label="Invoice to Settle" required>
          <select
            v-model="selectedInvoiceId"
            @change="onInvoiceSelectChange"
            class="w-full px-3 py-2 text-xs rounded-xl border border-stone-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
          >
            <option value="" disabled>Select an invoice...</option>
            <option
              v-for="inv in invoices"
              :key="inv.id"
              :value="inv.id"
            >
              {{ inv.id }} — {{ inv.customerName }} (Owes: {{ formatCurrency(inv.outstandingAmount) }})
            </option>
          </select>
        </Field>

        <Field label="Payment Amount" required>
          <TextField
            v-model.number="payAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </Field>

        <Field label="Payment Mode" required>
          <select
            v-model="payMode"
            class="w-full px-3 py-2 text-xs rounded-xl border border-stone-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
          >
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cheque">Cheque</option>
          </select>
        </Field>

        <Field label="Reference / Transaction Number">
          <TextField
            v-model="payRef"
            placeholder="e.g. WIRE-849201 or Check #44"
          />
        </Field>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="isPaymentModalOpen = false">
          Cancel
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          @click="handleRecordPayment"
          :loading="recordingPayment"
        >
          Confirm Payment
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
