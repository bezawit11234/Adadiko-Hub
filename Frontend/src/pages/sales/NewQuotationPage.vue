<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import { useToast } from '@/composables/useToast'
import { useSession } from '@/composables/useSession'
import type { Customer, OrderItem } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import Field from '@/components/common/Field.vue'
import TextField from '@/components/common/TextField.vue'
import Modal from '@/components/common/Modal.vue'
import { formatCurrency } from '@/utils/format'

interface CatalogItem {
  itemCode: string
  itemName: string
  rate: number
  stockAvailable: number
  warehouse: string
}

interface FormItemRow {
  id: string
  itemCode: string
  itemName: string
  qty: number
  rate: number
  stockAvailable: number
  warehouse: string
  isCustom?: boolean
}

const router = useRouter()
const route = useRoute()
const salesApi = getSalesApi()
const toast = useToast()
const { currentUser } = useSession()

const customers = ref<Customer[]>([])
const availableItems = ref<CatalogItem[]>([])
const loadingData = ref(true)
const submitting = ref(false)

// Form fields
const selectedCustomerId = ref<string>('')
const quoteDate = ref(new Date().toISOString().split('T')[0])
const validTill = ref(
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
)
const quotationNotes = ref('Proposal valid for 30 calendar days from issue date.')

// Line Items
const itemRows = ref<FormItemRow[]>([
  {
    id: 'qrow-1',
    itemCode: 'ITEM-SOLAR-PANEL',
    itemName: 'Solar Panel 400W Monocrystalline',
    qty: 1,
    rate: 180,
    stockAvailable: 50,
    warehouse: 'Main Warehouse',
  },
])

// Quick Customer Modal
const isCustomerModalOpen = ref(false)
const quickCustomerName = ref('')
const quickCustomerEmail = ref('')
const quickCustomerPhone = ref('')
const quickCustomerTerritory = ref('All Territories')
const quickCustomerGroup = ref('Commercial')
const creatingCustomer = ref(false)

onMounted(async () => {
  loadingData.value = true
  try {
    const [custRes, itemsRes] = await Promise.all([
      salesApi.listCustomers(),
      salesApi.listItems(),
    ])

    if (custRes.ok && custRes.data) {
      customers.value = custRes.data
      const queryCust = route.query.customer as string
      if (queryCust) {
        selectedCustomerId.value = queryCust
      } else if (customers.value.length > 0) {
        selectedCustomerId.value = customers.value[0].id
      }
    }

    if (itemsRes.ok && itemsRes.data && itemsRes.data.length > 0) {
      availableItems.value = itemsRes.data
      const first = itemsRes.data[0]
      itemRows.value = [
        {
          id: 'qrow-1',
          itemCode: first.itemCode,
          itemName: first.itemName,
          qty: 1,
          rate: first.rate || 100,
          stockAvailable: first.stockAvailable || 100,
          warehouse: first.warehouse || 'Main Warehouse',
        },
      ]
    }
  } finally {
    loadingData.value = false
  }
})

const selectedCustomer = computed(() => {
  return customers.value.find((c) => c.id === selectedCustomerId.value)
})

function addItemRow() {
  const fallback = availableItems.value[0] || {
    itemCode: `ITEM-${itemRows.value.length + 1}`,
    itemName: 'New Line Item',
    rate: 100,
    stockAvailable: 100,
    warehouse: 'Main Warehouse',
  }

  itemRows.value.push({
    id: 'qrow-' + Date.now(),
    itemCode: fallback.itemCode,
    itemName: fallback.itemName,
    qty: 1,
    rate: fallback.rate,
    stockAvailable: fallback.stockAvailable,
    warehouse: fallback.warehouse,
  })
}

function removeItemRow(idx: number) {
  if (itemRows.value.length > 1) {
    itemRows.value.splice(idx, 1)
  }
}

function onItemSelect(row: FormItemRow, code: string) {
  if (code === '__custom__') {
    row.isCustom = true
    row.itemCode = `ITEM-${Date.now().toString().slice(-4)}`
    row.itemName = 'Custom Product'
    row.rate = 100
    return
  }

  row.isCustom = false
  const match = availableItems.value.find((i) => i.itemCode === code)
  if (match) {
    row.itemCode = match.itemCode
    row.itemName = match.itemName
    row.rate = match.rate
    row.stockAvailable = match.stockAvailable
    row.warehouse = match.warehouse
  }
}

async function handleCreateQuickCustomer() {
  if (!quickCustomerName.value.trim()) {
    toast.error('Validation error', 'Please enter a customer name.')
    return
  }

  creatingCustomer.value = true
  try {
    const res = await salesApi.createCustomer({
      name: quickCustomerName.value.trim(),
      email: quickCustomerEmail.value.trim() || 'info@customer.example',
      phone: quickCustomerPhone.value.trim() || '+254 700 000000',
      territory: quickCustomerTerritory.value.trim() || 'All Territories',
      group: quickCustomerGroup.value.trim() || 'Commercial',
      status: 'Active',
      amountOwed: 0,
      assignedTo: currentUser.value?.id || 'usr_rep_1',
    })

    if (res.ok && res.data) {
      toast.success('Customer Registered', `${res.data.name} is now available.`)
      customers.value.unshift(res.data)
      selectedCustomerId.value = res.data.id
      isCustomerModalOpen.value = false
      quickCustomerName.value = ''
      quickCustomerEmail.value = ''
      quickCustomerPhone.value = ''
    } else {
      toast.error('Failed to create customer', res.error)
    }
  } finally {
    creatingCustomer.value = false
  }
}

// Live Financial Calculations
const subtotal = computed(() => {
  return itemRows.value.reduce((acc, row) => acc + (Number(row.qty) * Number(row.rate) || 0), 0)
})

const taxAmount = computed(() => {
  return subtotal.value * 0.15 // 15% VAT
})

const grandTotal = computed(() => {
  return subtotal.value + taxAmount.value
})

async function handleSubmitQuotation() {
  if (!selectedCustomerId.value) {
    toast.error('Validation Error', 'Please select or register a customer for this quotation.')
    return
  }
  if (itemRows.value.length === 0 || subtotal.value <= 0) {
    toast.error('Validation Error', 'Please specify at least one line item with a valid quantity and rate.')
    return
  }

  submitting.value = true
  try {
    const itemsPayload: OrderItem[] = itemRows.value.map((r, idx) => ({
      id: `qti-${idx + 1}`,
      itemCode: r.itemCode.trim() || `ITEM-${idx + 1}`,
      itemName: r.itemName.trim() || r.itemCode,
      qty: Number(r.qty) || 1,
      rate: Number(r.rate) || 0,
      amount: (Number(r.qty) || 1) * (Number(r.rate) || 0),
      stockAvailable: r.stockAvailable || 100,
      warehouse: r.warehouse || 'Main Warehouse',
    }))

    const res = await salesApi.createQuotation({
      customerName: selectedCustomer.value?.name || 'Customer',
      customerId: selectedCustomerId.value,
      date: quoteDate.value,
      validTill: validTill.value,
      items: itemsPayload,
      subtotal: subtotal.value,
      taxAmount: taxAmount.value,
      grandTotal: grandTotal.value,
      status: 'Submitted',
      createdBy: currentUser.value?.id || 'usr_rep_1',
    })

    if (res.ok && res.data) {
      toast.success(
        'Quotation Created!',
        `Quotation ${res.data.id} has been submitted for ${res.data.customerName}.`
      )
      router.push('/app/sales/quotations')
    } else {
      toast.error('Submission Failed', res.error)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <PageContainer max-width="2xl">
    <div class="flex items-center gap-2 text-xs text-ink-muted">
      <RouterLink to="/app/sales/quotations" class="hover:text-ink">Quotations</RouterLink>
      <span>/</span>
      <span class="text-ink font-semibold">New Quotation</span>
    </div>

    <SectionHeading
      title="Create Commercial Quotation"
      description="Draft and generate a formal commercial quote for a prospect or existing customer."
    />

    <form class="space-y-6" @submit.prevent="handleSubmitQuotation">
      <!-- SECTION 1: ESSENTIALS -->
      <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 sm:p-8 space-y-6">
        <h2 class="text-base font-bold text-ink font-heading pb-2 border-b border-stone-border">
          1. Customer & Validity Window
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <!-- Customer Selection with Quick-Add -->
          <div class="sm:col-span-1">
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold text-ink">
                Customer <span class="text-signal">*</span>
              </label>
              <button
                type="button"
                class="text-xs text-signal hover:underline font-semibold flex items-center gap-1"
                @click="isCustomerModalOpen = true"
              >
                <AppIcon name="plus" :size="12" />
                <span>Add New</span>
              </button>
            </div>

            <select
              v-if="customers.length > 0"
              v-model="selectedCustomerId"
              class="block w-full rounded-xl border border-stone-border bg-white px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
            >
              <option v-for="c in customers" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>

            <div
              v-else
              class="p-3 rounded-xl bg-stone-bg border border-stone-border flex items-center justify-between text-xs"
            >
              <span class="text-ink-muted">No customers yet.</span>
              <button
                type="button"
                class="px-2.5 py-1 bg-signal text-white rounded-lg font-bold text-xs"
                @click="isCustomerModalOpen = true"
              >
                + Register
              </button>
            </div>
          </div>

          <!-- Quotation Date -->
          <Field label="Quotation Date" required hint="Effective proposal date">
            <TextField v-model="quoteDate" type="date" />
          </Field>

          <!-- Valid Until Date -->
          <Field label="Valid Until" required hint="Price validity expiry">
            <TextField v-model="validTill" type="date" />
          </Field>
        </div>
      </div>

      <!-- SECTION 2: LINE ITEMS -->
      <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 sm:p-8 space-y-6">
        <div class="flex items-center justify-between pb-2 border-b border-stone-border">
          <div>
            <h2 class="text-base font-bold text-ink font-heading">
              2. Quotation Line Items
            </h2>
            <p class="text-xs text-ink-muted">Specify products, unit prices, and quantities offered to customer</p>
          </div>
          <AppButton variant="outline" size="sm" type="button" @click="addItemRow">
            <AppIcon name="plus" :size="14" />
            <span>Add Item Row</span>
          </AppButton>
        </div>

        <div class="space-y-4">
          <div
            v-for="(row, idx) in itemRows"
            :key="row.id"
            class="p-4 rounded-2xl bg-stone-bg/40 border border-stone-border space-y-3"
          >
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <!-- Item Selector / Name (col-span-6) -->
              <div class="sm:col-span-6">
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    Product / Item #{{ idx + 1 }}
                  </label>
                  <button
                    type="button"
                    class="text-[11px] text-signal hover:underline"
                    @click="row.isCustom = !row.isCustom"
                  >
                    {{ row.isCustom ? 'Pick from catalog' : 'Enter custom item' }}
                  </button>
                </div>

                <div v-if="!row.isCustom">
                  <select
                    :value="row.itemCode"
                    class="block w-full rounded-xl border border-stone-border bg-white px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
                    @change="onItemSelect(row, ($event.target as HTMLSelectElement).value)"
                  >
                    <option v-for="catItem in availableItems" :key="catItem.itemCode" :value="catItem.itemCode">
                      {{ catItem.itemName }} ({{ catItem.itemCode }}) — {{ formatCurrency(catItem.rate) }}
                    </option>
                    <option value="__custom__">+ Enter custom item...</option>
                  </select>
                </div>
                <div v-else class="grid grid-cols-2 gap-2">
                  <TextField v-model="row.itemCode" placeholder="Code (e.g. SRV-01)" />
                  <TextField v-model="row.itemName" placeholder="Item Name" />
                </div>
              </div>

              <!-- Quantity (col-span-2) -->
              <div class="sm:col-span-2">
                <label class="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Quantity
                </label>
                <TextField v-model="row.qty" type="number" tabular min="1" />
              </div>

              <!-- Rate (col-span-2) -->
              <div class="sm:col-span-2">
                <label class="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Unit Rate ($)
                </label>
                <TextField v-model="row.rate" type="number" tabular min="0" step="0.01" />
              </div>

              <!-- Line Total & Delete (col-span-2) -->
              <div class="sm:col-span-2 flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                <div class="text-right">
                  <span class="block text-[10px] text-ink-light uppercase">Line Total</span>
                  <span class="font-extrabold text-sm text-ink num-tabular font-heading">
                    {{ formatCurrency((Number(row.qty) || 0) * (Number(row.rate) || 0)) }}
                  </span>
                </div>
                <button
                  v-if="itemRows.length > 1"
                  type="button"
                  class="p-1.5 text-ink-light hover:text-status-red rounded-lg transition-colors"
                  title="Remove Item"
                  @click="removeItemRow(idx)"
                >
                  <AppIcon name="trash" :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Totals Summary Card -->
        <div class="p-5 rounded-2xl bg-stone-bg/70 border border-stone-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="text-xs text-ink-muted space-y-1">
            <p>• Standard 15% VAT computed on quotation total.</p>
            <p>• Converts into an official Sales Order upon customer acceptance.</p>
          </div>
          <div class="w-full sm:w-64 space-y-2 text-xs">
            <div class="flex justify-between text-ink-muted">
              <span>Subtotal:</span>
              <span class="font-mono text-ink font-semibold">{{ formatCurrency(subtotal) }}</span>
            </div>
            <div class="flex justify-between text-ink-muted">
              <span>VAT (15%):</span>
              <span class="font-mono text-ink font-semibold">{{ formatCurrency(taxAmount) }}</span>
            </div>
            <div class="flex justify-between text-sm font-extrabold text-ink pt-2 border-t border-stone-border font-heading">
              <span>Grand Total:</span>
              <span class="font-mono text-signal text-base">{{ formatCurrency(grandTotal) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 3: COMMERCIAL TERMS -->
      <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 sm:p-8 space-y-4">
        <h2 class="text-base font-bold text-ink font-heading pb-2 border-b border-stone-border">
          3. Commercial Terms & Quotation Remarks
        </h2>
        <Field label="Terms & Conditions / Customer Remarks">
          <TextField v-model="quotationNotes" placeholder="Payment terms, delivery guarantees, or warranty information" />
        </Field>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-between pt-4">
        <RouterLink to="/app/sales/quotations">
          <AppButton variant="ghost" size="md" type="button">
            Cancel
          </AppButton>
        </RouterLink>

        <AppButton
          variant="primary"
          size="md"
          type="submit"
          :loading="submitting"
          :disabled="itemRows.length === 0 || subtotal <= 0"
        >
          <AppIcon name="check" :size="16" />
          <span>Submit Commercial Quotation</span>
        </AppButton>
      </div>
    </form>

    <!-- Modal: Quick Add Customer -->
    <Modal
      :is-open="isCustomerModalOpen"
      title="Register New Customer"
      subtitle="Quickly add a customer to associate with this quotation."
      max-width="md"
      @close="isCustomerModalOpen = false"
    >
      <div class="space-y-4 text-xs">
        <Field label="Customer or Company Name" required>
          <TextField v-model="quickCustomerName" placeholder="e.g. Serengeti Agro Mills Ltd" />
        </Field>

        <div class="grid grid-cols-2 gap-3">
          <Field label="Email Address">
            <TextField v-model="quickCustomerEmail" type="email" placeholder="contact@company.example" />
          </Field>
          <Field label="Phone Number">
            <TextField v-model="quickCustomerPhone" placeholder="+254 700 000 000" />
          </Field>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <Field label="Sales Territory">
            <TextField v-model="quickCustomerTerritory" placeholder="All Territories" />
          </Field>
          <Field label="Customer Group">
            <TextField v-model="quickCustomerGroup" placeholder="Commercial" />
          </Field>
        </div>
      </div>

      <template #footer>
        <AppButton variant="ghost" size="sm" @click="isCustomerModalOpen = false">
          Cancel
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          :loading="creatingCustomer"
          @click="handleCreateQuickCustomer"
        >
          Save & Select Customer
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
