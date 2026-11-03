<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import { useSession } from '@/composables/useSession'
import { useToast } from '@/composables/useToast'
import type { Lead } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import TextField from '@/components/common/TextField.vue'
import Modal from '@/components/common/Modal.vue'
import Field from '@/components/common/Field.vue'
import DocumentStepTracker from '@/components/common/DocumentStepTracker.vue'
import { formatDate } from '@/utils/format'

const router = useRouter()
const salesApi = getSalesApi()
const toast = useToast()
const { currentUser, currentRole } = useSession()

const leads = ref<Lead[]>([])
const loading = ref(true)
const search = ref('')
const activeFilter = ref<'all' | 'Open' | 'Replied' | 'Converted' | 'Lost'>('all')

// New Lead Modal State
const isNewLeadOpen = ref(false)
const leadName = ref('')
const companyName = ref('')
const leadPhone = ref('')
const leadEmail = ref('')
const leadSource = ref('Direct Contact')
const creatingLead = ref(false)

// Lead Detail / Actions Modal State
const isDetailOpen = ref(false)
const selectedLead = ref<Lead | null>(null)
const actionLoading = ref(false)

const columns: Column[] = [
  { key: 'name', label: 'Lead Name' },
  { key: 'companyName', label: 'Organization / Company' },
  { key: 'status', label: 'Status' },
  { key: 'contact', label: 'Email & Phone' },
  { key: 'source', label: 'Source' },
  { key: 'createdDate', label: 'Created' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

async function loadLeads() {
  loading.value = true
  try {
    const res = await salesApi.listLeads()
    if (res.ok && res.data) {
      leads.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLeads()
})

const visibleLeads = computed(() => {
  let list = leads.value

  // Rep sees own leads; Sales Manager and Admin see all
  if (currentRole.value === 'sales_rep') {
    const repEmail = currentUser.value?.email || ''
    const repName = currentUser.value?.name || ''
    list = list.filter(
      (l) =>
        !l.owner ||
        l.owner === repEmail ||
        l.owner === repName ||
        l.owner.toLowerCase().includes('rep')
    )
  }

  // Text search
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.companyName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
    )
  }

  // Status Filter chips
  if (activeFilter.value !== 'all') {
    list = list.filter((l) => l.status.toLowerCase() === activeFilter.value.toLowerCase())
  }

  return list
})

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case 'open':
      return { variant: 'signal' as const, label: 'Open' }
    case 'replied':
      return { variant: 'info' as const, label: 'Replied' }
    case 'converted':
      return { variant: 'success' as const, label: 'Converted' }
    case 'lost':
      return { variant: 'danger' as const, label: 'Lost' }
    default:
      return { variant: 'neutral' as const, label: status || 'Lead' }
  }
}

function openLeadDetail(lead: Lead) {
  selectedLead.value = lead
  isDetailOpen.value = true
}

async function handleCreateLead() {
  if (!leadName.value.trim()) {
    toast.error('Validation', 'Lead contact name is required.')
    return
  }

  creatingLead.value = true
  try {
    const res = await salesApi.createLead({
      name: leadName.value.trim(),
      companyName: companyName.value.trim(),
      email: leadEmail.value.trim(),
      phone: leadPhone.value.trim(),
      source: leadSource.value,
    })

    if (res.ok && res.data) {
      toast.success('Lead Created', `Added ${res.data.name} to sales pipeline.`)
      isNewLeadOpen.value = false
      leadName.value = ''
      companyName.value = ''
      leadEmail.value = ''
      leadPhone.value = ''
      await loadLeads()
    } else {
      toast.error('Error', res.error || 'Failed to create lead.')
    }
  } finally {
    creatingLead.value = false
  }
}

async function handleConvertToCustomer() {
  if (!selectedLead.value) return
  actionLoading.value = true
  try {
    const res = await salesApi.convertLeadToCustomer(selectedLead.value.id)
    if (res.ok && res.data) {
      toast.success('Customer Created', `Converted lead to Customer ${res.data.name}.`)
      selectedLead.value.status = 'Converted'
      selectedLead.value.customer = res.data.id || res.data.name
      await loadLeads()
    } else {
      toast.error('Conversion Failed', res.error || 'Failed to convert lead.')
    }
  } finally {
    actionLoading.value = false
  }
}

async function handleCreateOpportunity() {
  if (!selectedLead.value) return
  actionLoading.value = true
  try {
    const res = await salesApi.convertLeadToOpportunity(selectedLead.value.id)
    if (res.ok && res.data) {
      toast.success('Opportunity Created', `Qualified lead as Opportunity ${res.data.id}.`)
      isDetailOpen.value = false
      router.push(`/app/sales/opportunities`)
    } else {
      toast.error('Failed', res.error || 'Could not create opportunity.')
    }
  } finally {
    actionLoading.value = false
  }
}

async function handleCreateQuotation() {
  if (!selectedLead.value) return
  actionLoading.value = true
  try {
    const res = await salesApi.convertLeadToQuotation(selectedLead.value.id)
    if (res.ok && res.data) {
      isDetailOpen.value = false
      router.push(`/app/sales/quotations/new?party=${encodeURIComponent(selectedLead.value.name)}&partyType=Lead`)
    } else {
      toast.error('Failed', res.error || 'Could not initialize quotation.')
    }
  } finally {
    actionLoading.value = false
  }
}

const leadStepData = computed(() => {
  if (!selectedLead.value) return {}
  const l = selectedLead.value
  return {
    'Lead': {
      docId: l.id,
      status: l.status,
    },
    'Opportunity': {
      notUsed: l.status !== 'Replied',
    },
    'Quotation': {
      notUsed: l.status !== 'Converted',
    },
    'Sales Order': { notUsed: true },
    'Delivery': { notUsed: true },
    'Invoice': { notUsed: true },
    'Payment': { notUsed: true },
  }
})
</script>

<template>
  <PageContainer>
    <SectionHeading
      title="Leads Pipeline"
      description="Capture incoming business inquiries, qualify prospects into Opportunities, and convert to Customers."
    >
      <template #actions>
        <AppButton variant="primary" size="sm" @click="isNewLeadOpen = true">
          <AppIcon name="user-plus" :size="14" class="mr-1.5" />
          New Lead
        </AppButton>
      </template>
    </SectionHeading>

    <!-- Filter chips and search bar -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
      <div class="w-full sm:w-72">
        <TextField
          v-model="search"
          placeholder="Search lead, company, email..."
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
          All ({{ leads.length }})
        </button>
        <button
          type="button"
          @click="activeFilter = 'Open'"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
            activeFilter === 'Open'
              ? 'bg-signal text-white font-semibold'
              : 'bg-white border border-stone-border text-ink hover:bg-stone-subtle'
          ]"
        >
          Open
        </button>
        <button
          type="button"
          @click="activeFilter = 'Replied'"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
            activeFilter === 'Replied'
              ? 'bg-status-blue text-white font-semibold'
              : 'bg-white border border-stone-border text-ink hover:bg-stone-subtle'
          ]"
        >
          Replied
        </button>
        <button
          type="button"
          @click="activeFilter = 'Converted'"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
            activeFilter === 'Converted'
              ? 'bg-status-green text-white font-semibold'
              : 'bg-white border border-stone-border text-ink hover:bg-stone-subtle'
          ]"
        >
          Converted
        </button>
        <button
          type="button"
          @click="activeFilter = 'Lost'"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
            activeFilter === 'Lost'
              ? 'bg-status-red text-white font-semibold'
              : 'bg-white border border-stone-border text-ink hover:bg-stone-subtle'
          ]"
        >
          Lost
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <DataTable
      :columns="columns"
      :rows="visibleLeads"
      :loading="loading"
      row-key="id"
      empty-title="No leads found"
      empty-description="Capture new incoming prospects with the New Lead button."
    >
      <template #cell-name="{ row }">
        <button
          type="button"
          @click="openLeadDetail(row)"
          class="text-left font-bold text-xs text-signal hover:underline cursor-pointer"
        >
          {{ row.name }}
        </button>
        <div class="text-[10px] font-mono text-ink-muted">{{ row.id }}</div>
      </template>

      <template #cell-companyName="{ row }">
        <span class="font-medium text-xs text-ink">{{ row.companyName || '—' }}</span>
        <div v-if="row.customer" class="mt-0.5">
          <RouterLink
            :to="`/app/sales/customers/${encodeURIComponent(row.customer)}`"
            class="inline-flex items-center gap-1 text-[10px] text-status-green hover:underline font-semibold"
          >
            <AppIcon name="users" :size="10" />
            <span>Customer: {{ row.customer }}</span>
          </RouterLink>
        </div>
      </template>

      <template #cell-status="{ row }">
        <Badge :variant="getStatusBadge(row.status).variant" size="sm" dot>
          {{ getStatusBadge(row.status).label }}
        </Badge>
      </template>

      <template #cell-contact="{ row }">
        <div class="text-xs text-ink">{{ row.email || '—' }}</div>
        <div class="text-[10px] font-mono text-ink-muted">{{ row.phone || '' }}</div>
      </template>

      <template #cell-source="{ row }">
        <Badge variant="neutral" size="sm">
          {{ row.source }}
        </Badge>
      </template>

      <template #cell-createdDate="{ row }">
        <span class="text-xs font-mono text-ink-muted">
          {{ row.createdDate ? formatDate(row.createdDate) : '—' }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <button
          type="button"
          @click="openLeadDetail(row)"
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-border bg-white text-ink hover:bg-stone-subtle transition-colors cursor-pointer"
        >
          <span>View / Qualify</span>
          <AppIcon name="arrow-right" :size="12" />
        </button>
      </template>
    </DataTable>

    <!-- New Lead Modal -->
    <Modal
      :is-open="isNewLeadOpen"
      title="Create New Lead"
      @close="isNewLeadOpen = false"
    >
      <div class="space-y-4 text-xs">
        <Field label="Contact Full Name" required>
          <TextField
            v-model="leadName"
            placeholder="e.g. Sara Tekle"
          />
        </Field>

        <Field label="Organization / Company Name">
          <TextField
            v-model="companyName"
            placeholder="e.g. Ethio Solar Engineering"
          />
        </Field>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Email Address">
            <TextField
              v-model="leadEmail"
              placeholder="sara@example.com"
            />
          </Field>

          <Field label="Phone / Mobile Number">
            <TextField
              v-model="leadPhone"
              placeholder="+251 91 123 4567"
            />
          </Field>
        </div>

        <Field label="Lead Source">
          <select
            v-model="leadSource"
            class="w-full px-3 py-2 text-xs rounded-xl border border-stone-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
          >
            <option value="Direct Contact">Direct Contact</option>
            <option value="Website">Website Form</option>
            <option value="Referral">Referral / Partner</option>
            <option value="Cold Call">Cold Outreach</option>
            <option value="Trade Show">Exhibition / Event</option>
          </select>
        </Field>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="isNewLeadOpen = false">
          Cancel
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          @click="handleCreateLead"
          :loading="creatingLead"
        >
          Save Lead
        </AppButton>
      </template>
    </Modal>

    <!-- Lead Detail & Qualification Modal -->
    <Modal
      :is-open="isDetailOpen"
      :title="selectedLead?.name || 'Lead Details'"
      maxWidth="lg"
      @close="isDetailOpen = false"
    >
      <div v-if="selectedLead" class="space-y-5 text-xs">
        <!-- Document Lifecycle Stepper -->
        <DocumentStepTracker
          current-doc-type="Lead"
          :steps-data="leadStepData"
          next-step-label="Create Opportunity"
          :next-step-action="handleCreateOpportunity"
        />

        <div class="p-4 rounded-xl bg-stone-subtle border border-stone-border space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-signal">{{ selectedLead.id }}</span>
            <Badge :variant="getStatusBadge(selectedLead.status).variant" size="sm" dot>
              {{ getStatusBadge(selectedLead.status).label }}
            </Badge>
          </div>

          <div class="grid grid-cols-2 gap-3 text-ink">
            <div>
              <span class="text-[10px] text-ink-muted uppercase block">Company</span>
              <strong class="text-sm font-semibold">{{ selectedLead.companyName || 'Individual' }}</strong>
            </div>
            <div>
              <span class="text-[10px] text-ink-muted uppercase block">Contact</span>
              <strong>{{ selectedLead.name }}</strong>
            </div>
            <div>
              <span class="text-[10px] text-ink-muted uppercase block">Email</span>
              <span>{{ selectedLead.email || '—' }}</span>
            </div>
            <div>
              <span class="text-[10px] text-ink-muted uppercase block">Phone</span>
              <span>{{ selectedLead.phone || '—' }}</span>
            </div>
          </div>

          <!-- Customer Link if Converted -->
          <div v-if="selectedLead.customer" class="p-3 bg-status-green/10 border border-status-green/20 rounded-xl text-status-green">
            <span class="font-bold block">Converted to Customer:</span>
            <RouterLink
              :to="`/app/sales/customers/${encodeURIComponent(selectedLead.customer)}`"
              class="underline font-bold text-sm mt-0.5 inline-block"
            >
              {{ selectedLead.customer }} →
            </RouterLink>
          </div>
        </div>

        <!-- 3 Primary ERPNext Transition Actions -->
        <div>
          <div class="text-[11px] font-bold text-ink mb-2">Lead Transition Actions:</div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <AppButton
              variant="primary"
              size="sm"
              @click="handleConvertToCustomer"
              :loading="actionLoading"
              :disabled="selectedLead.status === 'Converted'"
            >
              <AppIcon name="users" :size="14" class="mr-1" />
              Convert to Customer
            </AppButton>

            <AppButton
              variant="secondary"
              size="sm"
              @click="handleCreateOpportunity"
              :loading="actionLoading"
            >
              <AppIcon name="target" :size="14" class="mr-1" />
              Create Opportunity
            </AppButton>

            <AppButton
              variant="secondary"
              size="sm"
              @click="handleCreateQuotation"
              :loading="actionLoading"
            >
              <AppIcon name="file-text" :size="14" class="mr-1" />
              New Quotation
            </AppButton>
          </div>
        </div>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="isDetailOpen = false">
          Close
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
