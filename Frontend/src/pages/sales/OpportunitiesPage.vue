<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import { useSession } from '@/composables/useSession'
import { useToast } from '@/composables/useToast'
import type { Opportunity } from '@/types'
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
import { formatCurrency, formatDate } from '@/utils/format'

const router = useRouter()
const salesApi = getSalesApi()
const toast = useToast()
const { currentUser, currentRole } = useSession()

const opportunities = ref<Opportunity[]>([])
const loading = ref(true)
const search = ref('')
const activeFilter = ref<'all' | 'Open' | 'Quotation' | 'Converted' | 'Lost'>('all')

// New Opportunity Modal
const isNewOppOpen = ref(false)
const oppParty = ref('')
const oppPartyType = ref<'Lead' | 'Customer'>('Lead')
const oppValue = ref(1000)
const oppCloseDate = ref(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0])
const creatingOpp = ref(false)

// Detail Modal
const isDetailOpen = ref(false)
const selectedOpp = ref<Opportunity | null>(null)
const actionLoading = ref(false)

const columns: Column[] = [
  { key: 'partyName', label: 'Prospect / Organization' },
  { key: 'partyType', label: 'Party Type' },
  { key: 'expectedValue', label: 'Expected Value', align: 'right' },
  { key: 'stage', label: 'Sales Stage' },
  { key: 'expectedCloseDate', label: 'Target Close' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

async function loadOpportunities() {
  loading.value = true
  try {
    const res = await salesApi.listOpportunities()
    if (res.ok && res.data) {
      opportunities.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOpportunities()
})

const visibleOpportunities = computed(() => {
  let list = opportunities.value

  // Rep sees own; Sales Manager and Admin see all
  if (currentRole.value === 'sales_rep') {
    const repEmail = currentUser.value?.email || ''
    const repName = currentUser.value?.name || ''
    list = list.filter(
      (o) =>
        !o.owner ||
        o.owner === repEmail ||
        o.owner === repName ||
        o.owner.toLowerCase().includes('rep')
    )
  }

  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (o) =>
        o.partyName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
    )
  }

  if (activeFilter.value !== 'all') {
    list = list.filter((o) => o.stage.toLowerCase() === activeFilter.value.toLowerCase())
  }

  return list
})

function getStageBadge(stage: string) {
  switch (stage?.toLowerCase()) {
    case 'open':
      return { variant: 'signal' as const, label: 'Open Pipeline' }
    case 'quotation':
      return { variant: 'info' as const, label: 'Quotation Sent' }
    case 'converted':
      return { variant: 'success' as const, label: 'Converted' }
    case 'lost':
      return { variant: 'danger' as const, label: 'Closed Lost' }
    default:
      return { variant: 'neutral' as const, label: stage || 'Opportunity' }
  }
}

function openOppDetail(opp: Opportunity) {
  selectedOpp.value = opp
  isDetailOpen.value = true
}

async function handleCreateOpp() {
  if (!oppParty.value.trim()) {
    toast.error('Validation', 'Party / Organization name is required.')
    return
  }

  creatingOpp.value = true
  try {
    const res = await salesApi.createOpportunity({
      partyName: oppParty.value.trim(),
      partyType: oppPartyType.value,
      expectedValue: oppValue.value,
      expectedCloseDate: oppCloseDate.value,
    })

    if (res.ok && res.data) {
      toast.success('Opportunity Created', `Logged opportunity for ${res.data.partyName}.`)
      isNewOppOpen.value = false
      oppParty.value = ''
      await loadOpportunities()
    } else {
      toast.error('Error', res.error || 'Failed to create opportunity.')
    }
  } finally {
    creatingOpp.value = false
  }
}

async function handleCreateQuotationFromOpp() {
  if (!selectedOpp.value) return
  actionLoading.value = true
  try {
    const res = await salesApi.convertOpportunityToQuotation(selectedOpp.value.id)
    if (res.ok && res.data) {
      toast.success('Quotation Initialized', `Created Quotation draft for ${selectedOpp.value.partyName}.`)
      isDetailOpen.value = false
      router.push(`/app/sales/quotations/new?party=${encodeURIComponent(selectedOpp.value.partyName)}&opportunity=${encodeURIComponent(selectedOpp.value.id)}`)
    } else {
      toast.error('Failed', res.error || 'Could not generate quotation.')
    }
  } finally {
    actionLoading.value = false
  }
}

async function handleMarkLost() {
  if (!selectedOpp.value) return
  actionLoading.value = true
  try {
    const res = await salesApi.markOpportunityLost(selectedOpp.value.id)
    if (res.ok) {
      toast.info('Opportunity Lost', `Marked ${selectedOpp.value.partyName} as Lost.`)
      selectedOpp.value.stage = 'Lost'
      await loadOpportunities()
    } else {
      toast.error('Failed', res.error || 'Could not update status.')
    }
  } finally {
    actionLoading.value = false
  }
}

const oppStepData = computed(() => {
  if (!selectedOpp.value) return {}
  const o = selectedOpp.value
  return {
    'Lead': {
      docId: o.partyType === 'Lead' ? o.partyName : undefined,
      notUsed: o.partyType !== 'Lead',
    },
    'Opportunity': {
      docId: o.id,
      status: o.stage,
    },
    'Quotation': {
      docId: o.quotationId,
      notUsed: o.stage !== 'Quotation' && !o.quotationId,
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
      title="Opportunities & Deals"
      description="Track high-value prospects, forecast quarterly pipeline revenue, and convert into firm Quotations."
    >
      <template #actions>
        <AppButton variant="primary" size="sm" @click="isNewOppOpen = true">
          <AppIcon name="target" :size="14" class="mr-1.5" />
          New Opportunity
        </AppButton>
      </template>
    </SectionHeading>

    <!-- Filters & Search -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
      <div class="w-full sm:w-72">
        <TextField
          v-model="search"
          placeholder="Search party or opportunity ID..."
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
          All ({{ opportunities.length }})
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
          @click="activeFilter = 'Quotation'"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
            activeFilter === 'Quotation'
              ? 'bg-status-blue text-white font-semibold'
              : 'bg-white border border-stone-border text-ink hover:bg-stone-subtle'
          ]"
        >
          Quotation
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
      :rows="visibleOpportunities"
      :loading="loading"
      row-key="id"
      empty-title="No opportunities found"
      empty-description="Create an opportunity to track high-value deal pipeline."
    >
      <template #cell-partyName="{ row }">
        <button
          type="button"
          @click="openOppDetail(row)"
          class="text-left font-bold text-xs text-signal hover:underline cursor-pointer"
        >
          {{ row.partyName }}
        </button>
        <div class="text-[10px] font-mono text-ink-muted">{{ row.id }}</div>
      </template>

      <template #cell-partyType="{ row }">
        <Badge variant="neutral" size="sm">
          {{ row.partyType }}
        </Badge>
      </template>

      <template #cell-expectedValue="{ row }">
        <span class="font-mono text-xs font-bold text-ink">
          {{ formatCurrency(row.expectedValue) }}
        </span>
      </template>

      <template #cell-stage="{ row }">
        <Badge :variant="getStageBadge(row.stage).variant" size="sm" dot>
          {{ getStageBadge(row.stage).label }}
        </Badge>
      </template>

      <template #cell-expectedCloseDate="{ row }">
        <span class="text-xs font-mono text-ink-muted">
          {{ row.expectedCloseDate ? formatDate(row.expectedCloseDate) : '—' }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <button
          type="button"
          @click="openOppDetail(row)"
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-border bg-white text-ink hover:bg-stone-subtle transition-colors cursor-pointer"
        >
          <span>Review Deal</span>
          <AppIcon name="arrow-right" :size="12" />
        </button>
      </template>
    </DataTable>

    <!-- New Opportunity Modal -->
    <Modal
      :is-open="isNewOppOpen"
      title="Create New Opportunity"
      @close="isNewOppOpen = false"
    >
      <div class="space-y-4 text-xs">
        <Field label="Opportunity Party Type" required>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" value="Lead" v-model="oppPartyType" />
              <span>Lead (Prospect)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" value="Customer" v-model="oppPartyType" />
              <span>Existing Customer</span>
            </label>
          </div>
        </Field>

        <Field label="Party / Company Name" required>
          <TextField
            v-model="oppParty"
            placeholder="e.g. Acme Corp Solar Project"
          />
        </Field>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Expected Deal Value">
            <TextField
              v-model.number="oppValue"
              type="number"
              min="0"
              step="100"
            />
          </Field>

          <Field label="Target Close Date">
            <TextField
              v-model="oppCloseDate"
              type="date"
            />
          </Field>
        </div>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="isNewOppOpen = false">
          Cancel
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          @click="handleCreateOpp"
          :loading="creatingOpp"
        >
          Create Deal
        </AppButton>
      </template>
    </Modal>

    <!-- Detail Modal -->
    <Modal
      :is-open="isDetailOpen"
      :title="selectedOpp?.partyName || 'Opportunity Details'"
      maxWidth="lg"
      @close="isDetailOpen = false"
    >
      <div v-if="selectedOpp" class="space-y-5 text-xs">
        <!-- Stepper -->
        <DocumentStepTracker
          current-doc-type="Opportunity"
          :steps-data="oppStepData"
          next-step-label="Create Quotation"
          :next-step-action="handleCreateQuotationFromOpp"
        />

        <div class="p-4 rounded-xl bg-stone-subtle border border-stone-border space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-signal">{{ selectedOpp.id }}</span>
            <Badge :variant="getStageBadge(selectedOpp.stage).variant" size="sm" dot>
              {{ getStageBadge(selectedOpp.stage).label }}
            </Badge>
          </div>

          <div class="grid grid-cols-2 gap-3 text-ink">
            <div>
              <span class="text-[10px] text-ink-muted uppercase block">Party</span>
              <strong class="text-sm font-semibold">{{ selectedOpp.partyName }}</strong>
            </div>
            <div>
              <span class="text-[10px] text-ink-muted uppercase block">Estimated Deal Value</span>
              <strong class="text-sm font-bold text-status-green">{{ formatCurrency(selectedOpp.expectedValue) }}</strong>
            </div>
            <div>
              <span class="text-[10px] text-ink-muted uppercase block">Party Type</span>
              <span>{{ selectedOpp.partyType }}</span>
            </div>
            <div>
              <span class="text-[10px] text-ink-muted uppercase block">Target Closing</span>
              <span>{{ formatDate(selectedOpp.expectedCloseDate) }}</span>
            </div>
          </div>
        </div>

        <!-- Conversion Actions -->
        <div>
          <div class="text-[11px] font-bold text-ink mb-2">Deal Qualification Actions:</div>
          <div class="flex items-center gap-2">
            <AppButton
              variant="primary"
              size="sm"
              @click="handleCreateQuotationFromOpp"
              :loading="actionLoading"
              :disabled="selectedOpp.stage === 'Lost'"
            >
              <AppIcon name="file-text" :size="14" class="mr-1" />
              Create Quotation
            </AppButton>

            <AppButton
              variant="danger"
              size="sm"
              @click="handleMarkLost"
              :loading="actionLoading"
              :disabled="selectedOpp.stage === 'Lost'"
            >
              <AppIcon name="x" :size="14" class="mr-1" />
              Mark Lost
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
