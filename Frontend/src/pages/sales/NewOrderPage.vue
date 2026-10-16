<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import { useToast } from '@/composables/useToast'
import { useSession } from '@/composables/useSession'
import { MOCK_CATALOG_ITEMS } from '@/data/mockSales'
import type { Customer, OrderItem } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import Field from '@/components/common/Field.vue'
import TextField from '@/components/common/TextField.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatCurrency } from '@/utils/format'

const router = useRouter()
const route = useRoute()
const salesApi = getSalesApi()
const toast = useToast()
const { currentUser } = useSession()

const customers = ref<Customer[]>([])
const loadingCustomers = ref(true)
const submitting = ref(false)

// Form fields
const selectedCustomerId = ref<string>('')
const deliveryDate = ref(
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
)
const internalNotes = ref('')
const shippingInstructions = ref('')
const showMoreOptions = ref(false)

// Line Items
interface FormItemRow {
  id: string
  itemCode: string
  itemName: string
  qty: number
  rate: number
  stockAvailable: number
  warehouse: string
}

const itemRows = ref<FormItemRow[]>([
  {
    id: 'row-1',
    itemCode: MOCK_CATALOG_ITEMS[0].itemCode,
    itemName: MOCK_CATALOG_ITEMS[0].itemName,
    qty: 2,
    rate: MOCK_CATALOG_ITEMS[0].rate,
    stockAvailable: MOCK_CATALOG_ITEMS[0].stockAvailable,
    warehouse: MOCK_CATALOG_ITEMS[0].warehouse,
  },
])

onMounted(async () => {
  loadingCustomers.value = true
  try {
    const res = await salesApi.listCustomers()
    if (res.ok && res.data) {
      customers.value = res.data
      // If customer query param was passed, select it
      const queryCust = route.query.customer as string
      if (queryCust) {
        selectedCustomerId.value = queryCust
      } else if (customers.value.length > 0) {
        selectedCustomerId.value = customers.value[0].id
      }
    }
  } finally {
    loadingCustomers.value = false
  }
})

const selectedCustomer = computed(() => {
  return customers.value.find((c) => c.id === selectedCustomerId.value)
})

function addItemRow() {
  const defaultItem = MOCK_CATALOG_ITEMS[1] // Hybrid Inverter with 3 in stock
  itemRows.value.push({
    id: 'row-' + Date.now(),
    itemCode: defaultItem.itemCode,
    itemName: defaultItem.itemName,
    qty: 1,
    rate: defaultItem.rate,
    stockAvailable: defaultItem.stockAvailable,
    warehouse: defaultItem.warehouse,
  })
}

function removeItemRow(idx: number) {
  if (itemRows.value.length > 1) {
    itemRows.value.splice(idx, 1)
  }
}

function onItemCodeChange(row: FormItemRow, code: string) {
  const match = MOCK_CATALOG_ITEMS.find((i) => i.itemCode === code)
  if (match) {
    row.itemCode = match.itemCode
    row.itemName = match.itemName
    row.rate = match.rate
    row.stockAvailable = match.stockAvailable
    row.warehouse = match.warehouse
  }
}

// Live Financial Calculations
const subtotal = computed(() => {
  return itemRows.value.reduce((acc, row) => acc + (row.qty * row.rate || 0), 0)
})

const taxAmount = computed(() => {
  return subtotal.value * 0.15 // 15% VAT
})

const grandTotal = computed(() => {
  return subtotal.value + taxAmount.value
})

async function handleSubmitOrder() {
  if (!selectedCustomerId.value) {
    toast.error('Validation Error', 'Please select a customer for this order.')
    return
  }
  if (itemRows.value.length === 0 || subtotal.value <= 0) {
    toast.error('Validation Error', 'Please specify at least one item with a valid quantity.')
    return
  }

  submitting.value = true
  try {
    const itemsPayload: OrderItem[] = itemRows.value.map((r, idx) => ({
      id: `soi-new-${idx + 1}`,
      itemCode: r.itemCode,
      itemName: r.itemName,
      qty: r.qty,
      rate: r.rate,
      amount: r.qty * r.rate,
      stockAvailable: r.stockAvailable,
      warehouse: r.warehouse,
    }))

    const res = await salesApi.createSalesOrder({
      customerName: selectedCustomer.value?.name || 'Customer',
      customerId: selectedCustomerId.value,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: deliveryDate.value,
      items: itemsPayload,
      subtotal: subtotal.value,
      taxAmount: taxAmount.value,
      grandTotal: grandTotal.value,
      assignedTo: currentUser.value?.id || 'usr_rep_1',
      notes: shippingInstructions.value || internalNotes.value,
    })

    if (res.ok && res.data) {
      toast.success(
        'Sales Order Created!',
        `Order ${res.data.id} registered for ${res.data.customerName}.`
      )
      router.push(`/app/sales/orders/${res.data.id}`)
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
      <RouterLink to="/app/sales/orders" class="hover:text-ink">Sales Orders</RouterLink>
      <span>/</span>
      <span class="text-ink font-semibold">New Sales Order</span>
    </div>

    <SampleNotice text="New Order Form: Essentials first, live totals, automatic stock level alerts, and collapsible advanced options." />

    <SectionHeading
      title="Create New Sales Order"
      description="Create a commercial sales order. Stock reservations and delivery workflows will be initiated automatically."
    />

    <form class="space-y-6" @submit.prevent="handleSubmitOrder">
      <!-- SECTION 1: ESSENTIALS (Customer & Target Date) -->
      <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 sm:p-8 space-y-6">
        <h2 class="text-base font-bold text-ink font-heading pb-2 border-b border-stone-border">
          1. Essentials
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <!-- Customer Dropdown -->
          <Field label="Customer Account" required hint="Select who will be billed for this order">
            <select
              v-model="selectedCustomerId"
              class="block w-full rounded-xl border border-stone-border bg-white px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
            >
              <option v-for="c in customers" :key="c.id" :value="c.id">
                {{ c.name }} ({{ c.territory }})
              </option>
            </select>
          </Field>

          <!-- Target Delivery Date -->
          <Field label="Target Delivery Date" required hint="Expected date goods will reach the customer">
            <TextField v-model="deliveryDate" type="date" />
          </Field>
        </div>

        <!-- Customer Balance Banner (if selected) -->
        <div
          v-if="selectedCustomer && selectedCustomer.amountOwed > 0"
          class="p-3.5 rounded-2xl bg-status-amber-bg/60 border border-status-amber/20 flex items-center justify-between text-xs"
        >
          <div class="flex items-center gap-2 text-status-amber">
            <AppIcon name="alert-triangle" :size="16" />
            <span><strong>Notice:</strong> This customer currently owes <strong>{{ formatCurrency(selectedCustomer.amountOwed) }}</strong> from past invoices.</span>
          </div>
          <RouterLink :to="`/app/sales/customers/${selectedCustomer.id}`" class="text-signal hover:underline font-semibold shrink-0">
            View Ledger →
          </RouterLink>
        </div>
      </div>

      <!-- SECTION 2: LINE ITEMS WITH LIVE TOTALS & STOCK WARNING -->
      <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 sm:p-8 space-y-6">
        <div class="flex items-center justify-between pb-2 border-b border-stone-border">
          <div>
            <h2 class="text-base font-bold text-ink font-heading">
              2. Order Line Items
            </h2>
            <p class="text-xs text-ink-muted">Add catalog products, set quantities, and review warehouse stock</p>
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
              <!-- Item Selector (col-span-6) -->
              <div class="sm:col-span-6">
                <label class="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Product / Item #{{ idx + 1 }}
                </label>
                <select
                  :value="row.itemCode"
                  class="block w-full rounded-xl border border-stone-border bg-white px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
                  @change="onItemCodeChange(row, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="catItem in MOCK_CATALOG_ITEMS" :key="catItem.itemCode" :value="catItem.itemCode">
                    {{ catItem.itemName }} ({{ catItem.itemCode }})
                  </option>
                </select>
              </div>

              <!-- Quantity (col-span-2) -->
              <div class="sm:col-span-2">
                <label class="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Quantity
                </label>
                <TextField v-model="row.qty" type="number" tabular />
              </div>

              <!-- Rate (col-span-2) -->
              <div class="sm:col-span-2">
                <label class="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Unit Rate ($)
                </label>
                <TextField v-model="row.rate" type="number" tabular />
              </div>

              <!-- Line Total & Delete (col-span-2) -->
              <div class="sm:col-span-2 flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                <div class="text-right">
                  <span class="block text-[10px] text-ink-light uppercase">Line Total</span>
                  <span class="font-extrabold text-sm text-ink num-tabular font-heading">
                    {{ formatCurrency(row.qty * row.rate) }}
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

            <!-- FRIENDLY STOCK WARNING (e.g. "Only 3 left in Main Store") -->
            <div class="flex items-center gap-2 pt-1 text-xs">
              <span class="text-ink-muted">Stock Status:</span>

              <!-- Low stock alert -->
              <span
                v-if="row.stockAvailable <= 3"
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-amber-bg text-status-amber text-[11px] font-bold border border-status-amber/20"
              >
                <AppIcon name="alert-triangle" :size="12" />
                <span>Only {{ row.stockAvailable }} left in {{ row.warehouse }}</span>
              </span>

              <!-- Plentiful stock -->
              <span
                v-else
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-green-bg text-status-green text-[11px] font-semibold"
              >
                <AppIcon name="check" :size="12" />
                <span>{{ row.stockAvailable }} units available in {{ row.warehouse }}</span>
              </span>

              <!-- Warning if order quantity exceeds available stock -->
              <span
                v-if="row.qty > row.stockAvailable"
                class="text-status-red font-semibold text-[11px] ml-2"
              >
                (Warning: Exceeds current stock; backorder will be initiated)
              </span>
            </div>
          </div>
        </div>

        <!-- Live Totals Panel -->
        <div class="pt-4 border-t border-stone-border flex justify-end">
          <div class="w-full sm:w-80 space-y-2 text-xs bg-stone-bg/50 p-4 rounded-2xl border border-stone-border">
            <div class="flex justify-between text-ink-muted">
              <span>Items Subtotal:</span>
              <span class="font-bold text-ink num-tabular">{{ formatCurrency(subtotal) }}</span>
            </div>
            <div class="flex justify-between text-ink-muted">
              <span>Standard Tax (15% VAT):</span>
              <span class="font-bold text-ink num-tabular">{{ formatCurrency(taxAmount) }}</span>
            </div>
            <div class="pt-2 border-t border-stone-border flex justify-between text-sm font-black text-ink">
              <span>Order Grand Total:</span>
              <span class="text-signal font-heading text-lg num-tabular">{{ formatCurrency(grandTotal) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 3: MORE OPTIONS (COLLAPSED BY DEFAULT) -->
      <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6">
        <button
          type="button"
          class="w-full flex items-center justify-between text-sm font-bold text-ink font-heading"
          @click="showMoreOptions = !showMoreOptions"
        >
          <div class="flex items-center gap-2">
            <AppIcon name="settings" :size="16" className="text-signal" />
            <span>More Options & Delivery Instructions (Optional)</span>
          </div>
          <AppIcon :name="showMoreOptions ? 'chevron-up' : 'chevron-down'" :size="18" />
        </button>

        <div v-if="showMoreOptions" class="mt-4 pt-4 border-t border-stone-border space-y-4">
          <Field label="Special Shipping / Freight Instructions">
            <TextField v-model="shippingInstructions" placeholder="e.g. Gate 4 delivery, require driver badge identification." />
          </Field>
          <Field label="Internal Sales Team Notes">
            <TextField v-model="internalNotes" placeholder="e.g. Authorized under special regional promotion." />
          </Field>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-between pt-2">
        <RouterLink to="/app/sales/orders">
          <AppButton variant="ghost" size="md">
            Discard & Return
          </AppButton>
        </RouterLink>

        <AppButton variant="primary" size="lg" :loading="submitting" type="submit" class="shadow-lift px-8">
          <AppIcon name="check" :size="18" />
          <span>Confirm & Create Sales Order</span>
        </AppButton>
      </div>
    </form>
  </PageContainer>
</template>
