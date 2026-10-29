<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import { useToast } from '@/composables/useToast'
import type { Customer } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import TextField from '@/components/common/TextField.vue'
import Field from '@/components/common/Field.vue'
import Modal from '@/components/common/Modal.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatCurrency } from '@/utils/format'

const router = useRouter()
const salesApi = getSalesApi()
const toast = useToast()

const customers = ref<Customer[]>([])
const loading = ref(true)
const search = ref('')
const activeFilter = ref<'all' | 'has_debt' | 'active' | 'prospect'>('all')

// New Customer Modal State
const isNewModalOpen = ref(false)
const newName = ref('')
const newEmail = ref('')
const newPhone = ref('')
const newTerritory = ref('All Territories')
const newGroup = ref('Commercial')
const newNotes = ref('')
const saving = ref(false)

const columns: Column[] = [
  { key: 'name', label: 'Customer / Company' },
  { key: 'territory', label: 'Territory' },
  { key: 'group', label: 'Customer Group' },
  { key: 'status', label: 'Status' },
  { key: 'amountOwed', label: 'Customer Owes', align: 'right' },
]

async function loadCustomers() {
  loading.value = true
  try {
    const res = await salesApi.listCustomers()
    if (res.ok && res.data) {
      customers.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCustomers()
})

const filteredCustomers = computed(() => {
  let list = customers.value
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.territory.toLowerCase().includes(q)
    )
  }

  if (activeFilter.value === 'has_debt') {
    list = list.filter((c) => c.amountOwed > 0)
  } else if (activeFilter.value === 'active') {
    list = list.filter((c) => c.status === 'Active')
  } else if (activeFilter.value === 'prospect') {
    list = list.filter((c) => c.status === 'Prospect')
  }

  return list
})

function onRowClick(row: Customer) {
  router.push(`/app/sales/customers/${row.id}`)
}

async function handleCreateCustomer() {
  if (!newName.value.trim()) {
    toast.error('Validation error', 'Please enter a customer name.')
    return
  }
  saving.value = true
  try {
    const res = await salesApi.createCustomer({
      name: newName.value.trim(),
      email: newEmail.value.trim() || 'info@customer.example',
      phone: newPhone.value.trim() || '+254 700 000000',
      territory: newTerritory.value.trim() || 'All Territories',
      group: newGroup.value.trim() || 'Commercial',
      status: 'Active',
      amountOwed: 0,
      assignedTo: 'usr_rep_1',
      notes: newNotes.value,
    })

    if (res.ok && res.data) {
      toast.success('Customer Created', `${res.data.name} has been added to customer directory.`)
      isNewModalOpen.value = false
      newName.value = ''
      newEmail.value = ''
      newPhone.value = ''
      newTerritory.value = 'All Territories'
      newGroup.value = 'Commercial'
      newNotes.value = ''
      loadCustomers()
    } else {
      toast.error('Error', res.error)
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <PageContainer max-width="2xl">
    <SectionHeading
      title="Customer Accounts"
      description="Manage customer profiles, credit balances owed, contact details, and order history."
    >
      <template #badge>
        <Badge variant="signal" size="sm">{{ customers.length }} Total Accounts</Badge>
      </template>
      <template #actions>
        <AppButton variant="primary" size="sm" @click="isNewModalOpen = true">
          <AppIcon name="plus" :size="16" />
          <span>New Customer</span>
        </AppButton>
      </template>
    </SectionHeading>

    <!-- Search & Filter Chips Bar -->
    <div class="bg-white p-4 rounded-2xl border border-stone-border shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="max-w-md w-full">
        <TextField v-model="search" placeholder="Search by name, email, or territory...">
          <template #prefix>
            <AppIcon name="search" :size="16" />
          </template>
        </TextField>
      </div>

      <!-- Filter chips -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
            activeFilter === 'all' ? 'bg-ink-navy text-white' : 'bg-stone-bg text-ink-muted hover:text-ink',
          ]"
          @click="activeFilter = 'all'"
        >
          All ({{ customers.length }})
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
            activeFilter === 'has_debt' ? 'bg-ink-navy text-white' : 'bg-stone-bg text-ink-muted hover:text-ink',
          ]"
          @click="activeFilter = 'has_debt'"
        >
          Customer Owes Balance
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
            activeFilter === 'active' ? 'bg-ink-navy text-white' : 'bg-stone-bg text-ink-muted hover:text-ink',
          ]"
          @click="activeFilter = 'active'"
        >
          Active Accounts
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
            activeFilter === 'prospect' ? 'bg-ink-navy text-white' : 'bg-stone-bg text-ink-muted hover:text-ink',
          ]"
          @click="activeFilter = 'prospect'"
        >
          Prospects
        </button>
      </div>
    </div>

    <!-- Customers Table -->
    <DataTable
      :columns="columns"
      :rows="filteredCustomers"
      :loading="loading"
      row-clickable
      empty-title="No customers match your criteria"
      empty-description="Adjust your search or filter chips, or register a new customer account."
      @row-click="onRowClick"
    >
      <template #name="{ row }">
        <div>
          <span class="font-bold text-ink hover:text-signal transition-colors">
            {{ row.name }}
          </span>
          <p class="text-xs text-ink-muted truncate">
            {{ row.email }}
          </p>
        </div>
      </template>

      <template #status="{ value }">
        <Badge :variant="value === 'Active' ? 'success' : 'neutral'" size="sm" dot>
          {{ value }}
        </Badge>
      </template>

      <template #amountOwed="{ value }">
        <span
          :class="[
            'font-bold num-tabular',
            value > 0 ? 'text-status-red' : 'text-status-green',
          ]"
        >
          {{ formatCurrency(value) }}
        </span>
      </template>
    </DataTable>

    <!-- Modal: New Customer -->
    <Modal
      :is-open="isNewModalOpen"
      title="Create New Customer Account"
      subtitle="Register a new customer profile into your verified directory."
      max-width="md"
      @close="isNewModalOpen = false"
    >
      <div class="space-y-4 text-xs">
        <Field label="Customer or Company Name" required>
          <TextField v-model="newName" placeholder="e.g. Serengeti Agro Mills Ltd" />
        </Field>

        <div class="grid grid-cols-2 gap-3">
          <Field label="Email Address">
            <TextField v-model="newEmail" type="email" placeholder="contact@company.example" />
          </Field>
          <Field label="Phone Number">
            <TextField v-model="newPhone" placeholder="+254 700 000 000" />
          </Field>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <Field label="Sales Territory">
            <TextField v-model="newTerritory" placeholder="e.g. Mombasa Port Zone" />
          </Field>
          <Field label="Customer Group">
            <TextField v-model="newGroup" placeholder="Commercial Distributor" />
          </Field>
        </div>

        <Field label="Notes & Payment Terms">
          <TextField v-model="newNotes" placeholder="e.g. Standard Net-30 payment agreement." />
        </Field>
      </div>

      <template #footer>
        <AppButton variant="ghost" size="sm" @click="isNewModalOpen = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" :loading="saving" @click="handleCreateCustomer">
          Save Customer
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
