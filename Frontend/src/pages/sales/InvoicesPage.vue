<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import { useToast } from '@/composables/useToast'
import type { SalesInvoice } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import TextField from '@/components/common/TextField.vue'
import Modal from '@/components/common/Modal.vue'
import Field from '@/components/common/Field.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatCurrency, formatDate } from '@/utils/format'

const router = useRouter()
const salesApi = getSalesApi()
const toast = useToast()

const invoices = ref<SalesInvoice[]>([])
const loading = ref(true)
const search = ref('')
const activeFilter = ref<'all' | 'unpaid' | 'overdue' | 'paid'>('all')

// Record Payment Modal State
const isPaymentModalOpen = ref(false)
const selectedInvoice = ref<SalesInvoice | null>(null)
const payAmount = ref(0)
const payMode = ref<'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash'>('Bank Transfer')
const payRef = ref('')
const recordingPayment = ref(false)

const columns: Column[] = [
  { key: 'id', label: 'Invoice #' },
  { key: 'customerName', label: 'Customer' },
  { key: 'postingDate', label: 'Invoice Date' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'status', label: 'Payment Status' },
  { key: 'grandTotal', label: 'Total Billed', align: 'right' },
  { key: 'outstandingAmount', label: 'Customer Owes', align: 'right' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

async function loadInvoices() {
  loading.value = true
  try {
    const res = await salesApi.listSalesInvoices()
    if (res.ok && res.data) {
      invoices.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadInvoices()
})

const filteredInvoices = computed(() => {
  let list = invoices.value
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (inv) =>
        inv.id.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q)
    )
  }

  if (activeFilter.value === 'unpaid') {
    list = list.filter((i) => i.status === 'Unpaid')
  } else if (activeFilter.value === 'overdue') {
    list = list.filter((i) => i.status === 'Overdue')
  } else if (activeFilter.value === 'paid') {
    list = list.filter((i) => i.status === 'Paid')
  }

  return list
})

const totalOwedAll = computed(() => {
  return invoices.value.reduce((acc, i) => acc + (i.outstandingAmount || 0), 0)
})

function openPaymentDialog(inv: SalesInvoice) {
  selectedInvoice.value = inv
  payAmount.value = inv.outstandingAmount
  payRef.value = 'WIRE-' + Math.floor(Math.random() * 900000 + 100000)
  isPaymentModalOpen.value = true
}

async function handleRecordPayment() {
  if (!selectedInvoice.value || payAmount.value <= 0) return
  recordingPayment.value = true
  try {
    const res = await salesApi.recordPayment(
      selectedInvoice.value.id,
      payAmount.value,
      payMode.value,
      payRef.value
    )
    if (res.ok) {
      toast.success(
        'Payment Recorded',
        `Recorded ${formatCurrency(payAmount.value)} for Invoice ${selectedInvoice.value.id}.`
      )
      isPaymentModalOpen.value = false
      await loadInvoices()
    } else {
      toast.error('Payment Error', res.error)
    }
  } finally {
    recordingPayment.value = false
  }
}

function onRowClick(row: SalesInvoice) {
  router.push(`/app/sales/invoices/${row.id}`)
}
</script>

<template>
  <PageContainer max-width="2xl">
    <SampleNotice text="ERPNext Sales Invoice & Payment Entry DocTypes: Accounts receivable records with plain 'Customer owes' terminology." />

    <SectionHeading
      title="Sales Invoices & Customer Receivables"
      description="Track billed orders, unpaid balances, overdue collections, and record incoming wire transfers."
    >
      <template #badge>
        <Badge variant="signal" size="sm">{{ invoices.length }} Total Invoices</Badge>
      </template>
    </SectionHeading>

    <!-- Top Receivables Summary Banner -->
    <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <span class="text-xs font-bold uppercase tracking-wider text-ink-muted">
          Total Customer Debt Pending
        </span>
        <div class="text-3xl font-black text-status-red font-heading num-tabular">
          {{ formatCurrency(totalOwedAll) }}
        </div>
        <p class="text-xs text-ink-muted">
          Customer debt across all active and overdue accounts.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs text-ink-muted">Status breakdown:</span>
        <Badge variant="danger" size="sm" dot>
          {{ invoices.filter(i => i.status === 'Overdue').length }} Overdue
        </Badge>
        <Badge variant="warning" size="sm" dot>
          {{ invoices.filter(i => i.status === 'Unpaid').length }} Unpaid
        </Badge>
        <Badge variant="success" size="sm" dot>
          {{ invoices.filter(i => i.status === 'Paid').length }} Paid
        </Badge>
      </div>
    </div>

    <!-- Search & Filter Chips -->
    <div class="bg-white p-4 rounded-2xl border border-stone-border shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="max-w-md w-full">
        <TextField v-model="search" placeholder="Search by invoice # or customer name...">
          <template #prefix>
            <AppIcon name="search" :size="16" />
          </template>
        </TextField>
      </div>

      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
            activeFilter === 'all' ? 'bg-ink-navy text-white' : 'bg-stone-bg text-ink-muted hover:text-ink',
          ]"
          @click="activeFilter = 'all'"
        >
          All
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
            activeFilter === 'unpaid' ? 'bg-ink-navy text-white' : 'bg-stone-bg text-ink-muted hover:text-ink',
          ]"
          @click="activeFilter = 'unpaid'"
        >
          Unpaid
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
            activeFilter === 'overdue' ? 'bg-ink-navy text-white' : 'bg-stone-bg text-ink-muted hover:text-ink',
          ]"
          @click="activeFilter = 'overdue'"
        >
          Overdue
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
            activeFilter === 'paid' ? 'bg-ink-navy text-white' : 'bg-stone-bg text-ink-muted hover:text-ink',
          ]"
          @click="activeFilter = 'paid'"
        >
          Paid
        </button>
      </div>
    </div>

    <!-- Invoices Table -->
    <DataTable
      :columns="columns"
      :rows="filteredInvoices"
      :loading="loading"
      row-clickable
      empty-title="No invoices found"
      empty-description="Invoices created from fulfilled sales orders will be listed here."
      @row-click="onRowClick"
    >
      <template #id="{ value }">
        <span class="font-mono font-bold text-ink hover:text-signal transition-colors">{{ value }}</span>
      </template>

      <template #customerName="{ value }">
        <span class="font-bold text-ink">{{ value }}</span>
      </template>

      <template #postingDate="{ value }">
        <span class="text-xs text-ink-muted">{{ formatDate(value) }}</span>
      </template>

      <template #dueDate="{ value }">
        <span class="text-xs text-ink-muted">{{ formatDate(value) }}</span>
      </template>

      <template #status="{ value }">
        <!-- Badges: Paid, Unpaid, Overdue -->
        <Badge
          :variant="value === 'Paid' ? 'success' : value === 'Overdue' ? 'danger' : 'warning'"
          size="sm"
          dot
        >
          {{ value }}
        </Badge>
      </template>

      <template #grandTotal="{ value }">
        <span class="font-bold text-ink num-tabular">{{ formatCurrency(value) }}</span>
      </template>

      <template #outstandingAmount="{ value }">
        <span
          :class="[
            'font-extrabold num-tabular',
            value > 0 ? 'text-status-red' : 'text-status-green',
          ]"
        >
          {{ formatCurrency(value) }}
        </span>
      </template>

      <template #actions="{ row }">
        <AppButton
          v-if="row.outstandingAmount > 0"
          variant="primary"
          size="sm"
          @click.stop="openPaymentDialog(row)"
        >
          <AppIcon name="credit-card" :size="12" />
          <span>Record Payment</span>
        </AppButton>
        <span v-else class="text-xs text-status-green font-semibold">
          Fully Paid
        </span>
      </template>
    </DataTable>

    <!-- RECORD PAYMENT DIALOG -->
    <Modal
      :is-open="isPaymentModalOpen"
      title="Record Customer Payment"
      :subtitle="`Applying funds against Invoice ${selectedInvoice?.id} (${selectedInvoice?.customerName})`"
      max-width="md"
      @close="isPaymentModalOpen = false"
    >
      <div v-if="selectedInvoice" class="space-y-4 text-xs">
        <div class="p-3.5 rounded-2xl bg-stone-bg border border-stone-border flex justify-between">
          <span class="text-ink-muted">Currently owed by customer:</span>
          <span class="font-black text-status-red num-tabular font-heading">
            {{ formatCurrency(selectedInvoice.outstandingAmount) }}
          </span>
        </div>

        <Field label="Payment Amount ($)" required>
          <TextField v-model="payAmount" type="number" tabular />
        </Field>

        <Field label="Mode of Payment" required>
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
          <TextField v-model="payRef" placeholder="e.g. WIRE-881204" />
        </Field>
      </div>

      <template #footer>
        <AppButton variant="ghost" size="sm" @click="isPaymentModalOpen = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" :loading="recordingPayment" @click="handleRecordPayment">
          Save Payment Entry
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
