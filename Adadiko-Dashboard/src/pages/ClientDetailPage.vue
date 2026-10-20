<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAdminApi } from '@/services/admin'
import { useAccess } from '@/composables/useAccess'
import { useToast } from '@/composables/useToast'
import type { ClientCompany, Plan, ModuleItem } from '@/types'
import { PLAN_DEFINITIONS } from '@/data/mockAdmin'
import { formatCurrency, formatDate } from '@/utils/format'
import PageContainer from '@/components/common/PageContainer.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'
import TextField from '@/components/common/TextField.vue'

const route = useRoute()
const router = useRouter()
const adminApi = getAdminApi()
const { canManagePlans, canSuspendClients } = useAccess()
const { showToast } = useToast()

const clientId = route.params.id as string
const client = ref<ClientCompany | null>(null)
const catalogModules = ref<ModuleItem[]>([])
const loading = ref(true)

// Note input
const newNote = ref('')
const addingNote = ref(false)

// Modals
const showPlanModal = ref(false)
const showStatusModal = ref(false)
const selectedPlan = ref<Plan>('growth')
const selectedModules = ref<string[]>([])
const isSaving = ref(false)

const fetchClientData = async () => {
  loading.value = true
  try {
    const [clientRes, catalogRes] = await Promise.all([
      adminApi.getClient(clientId),
      adminApi.listCatalog(),
    ])

    if (clientRes.ok && clientRes.data) {
      client.value = clientRes.data
      selectedPlan.value = client.value.plan
      selectedModules.value = [...client.value.modules]
    } else {
      showToast({ title: 'Error', message: clientRes.error || 'Client not found.', type: 'error' })
      router.push('/clients')
    }

    if (catalogRes.ok && catalogRes.data) {
      catalogModules.value = catalogRes.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchClientData()
})

// Calculated estimated spend inside modal
const calculatedModalSpend = computed(() => {
  const planDef = PLAN_DEFINITIONS[selectedPlan.value]
  let total = planDef ? planDef.baseMonthlyPrice : 49
  selectedModules.value.forEach((modKey) => {
    const mod = catalogModules.value.find((m) => m.key === modKey)
    if (mod && !mod.isCore) {
      total += mod.monthlyPrice
    }
  })
  return total
})

const isModuleSelected = (key: string) => selectedModules.value.includes(key)

const toggleModule = (key: string) => {
  // If core module for the plan, prevent removing
  const planDef = PLAN_DEFINITIONS[selectedPlan.value]
  if (planDef?.includedModules.includes(key)) {
    return
  }

  if (selectedModules.value.includes(key)) {
    selectedModules.value = selectedModules.value.filter((k) => k !== key)
  } else {
    selectedModules.value.push(key)
  }
}

const handlePlanSelectionChange = (plan: Plan) => {
  selectedPlan.value = plan
  const planDef = PLAN_DEFINITIONS[plan]
  if (planDef) {
    // Add default included modules
    const current = new Set(selectedModules.value)
    planDef.includedModules.forEach((m) => current.add(m))
    selectedModules.value = Array.from(current)
  }
}

const savePlanChanges = async () => {
  if (!client.value) return
  isSaving.value = true
  try {
    const res = await adminApi.updateClientPlan(client.value.id, selectedPlan.value, selectedModules.value)
    if (res.ok && res.data) {
      client.value = res.data
      showToast({
        title: 'Plan Updated',
        message: `${client.value.name} plan updated to ${selectedPlan.value.toUpperCase()} (${formatCurrency(client.value.monthlySpend)}/mo)`,
        type: 'success',
      })
      showPlanModal.value = false
    } else {
      showToast({ title: 'Update Failed', message: res.error || 'Failed to update plan.', type: 'error' })
    }
  } finally {
    isSaving.value = false
  }
}

const toggleClientStatus = async () => {
  if (!client.value) return
  isSaving.value = true
  const targetStatus = client.value.status === 'suspended' ? 'active' : 'suspended'

  try {
    const res = await adminApi.setClientStatus(client.value.id, targetStatus)
    if (res.ok && res.data) {
      client.value = res.data
      showToast({
        title: `Workspace ${targetStatus === 'active' ? 'Reactivated' : 'Suspended'}`,
        message: `Tenant workspace ${client.value.siteName} is now ${targetStatus}.`,
        type: targetStatus === 'active' ? 'success' : 'warning',
      })
      showStatusModal.value = false
    }
  } finally {
    isSaving.value = false
  }
}

const handleAddNote = async () => {
  if (!newNote.value.trim() || !client.value) return
  addingNote.value = true
  try {
    const res = await adminApi.addClientNote(client.value.id, newNote.value.trim())
    if (res.ok && res.data) {
      client.value = res.data
      newNote.value = ''
      showToast({ title: 'Note Added', message: 'Diagnostic note recorded to client file.', type: 'info' })
    }
  } finally {
    addingNote.value = false
  }
}

const openWorkspaceSite = () => {
  if (!client.value) return
  window.open(`https://${client.value.siteName}`, '_blank')
}
</script>

<template>
  <PageContainer v-if="client">
    <!-- Breadcrumb -->
    <div class="mb-4">
      <router-link
        to="/clients"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
      >
        <AppIcon name="arrow-left" :size="14" />
        <span>Back to Client Organizations</span>
      </router-link>
    </div>

    <!-- Tenant Header Card -->
    <div class="bg-stone-surface border border-stone-border rounded-2xl p-6 shadow-soft mb-8">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="font-heading font-bold text-2xl text-ink tracking-tight">
              {{ client.name }}
            </h1>
            <Badge :variant="client.status === 'active' ? 'success' : client.status === 'trial' ? 'warning' : 'danger'">
              {{ client.status.toUpperCase() }}
            </Badge>
            <Badge :variant="client.plan === 'enterprise' ? 'accent' : 'neutral'">
              {{ client.plan.toUpperCase() }} PLAN
            </Badge>
          </div>

          <div class="flex flex-wrap items-center gap-4 text-xs text-ink-muted mt-2">
            <div class="flex items-center gap-1 font-mono text-ink">
              <AppIcon name="external-link" :size="13" class="text-signal" />
              <span>{{ client.siteName }}</span>
            </div>
            <span>&bull;</span>
            <div>Primary: <strong class="text-ink font-medium">{{ client.contactName }}</strong> ({{ client.contactEmail }})</div>
            <span>&bull;</span>
            <div>Customer since: <span class="font-mono">{{ formatDate(client.startDate) }}</span></div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- External workspace link -->
          <AppButton
            variant="secondary"
            size="sm"
            @click="openWorkspaceSite"
            title="Launch tenant client workspace"
          >
            <AppIcon name="external-link" :size="14" class="mr-1.5" />
            Open Workspace
          </AppButton>

          <!-- Change Plan Button (Admin Only) -->
          <AppButton
            v-if="canManagePlans"
            variant="secondary"
            size="sm"
            @click="showPlanModal = true"
          >
            <AppIcon name="settings" :size="14" class="mr-1.5" />
            Change Plan &amp; Modules
          </AppButton>

          <!-- Suspend / Reactivate (Admin Only) -->
          <AppButton
            v-if="canSuspendClients"
            :variant="client.status === 'suspended' ? 'secondary' : 'danger'"
            size="sm"
            @click="showStatusModal = true"
          >
            <AppIcon :name="client.status === 'suspended' ? 'check' : 'alert-triangle'" :size="14" class="mr-1.5" />
            {{ client.status === 'suspended' ? 'Reactivate Workspace' : 'Suspend Workspace' }}
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Detail Information Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Subscription & Metrics Overview -->
      <div class="bg-stone-surface border border-stone-border rounded-2xl p-6 shadow-soft space-y-4">
        <h3 class="font-heading font-bold text-base text-ink border-b border-stone-border pb-3">
          Subscription Parameters
        </h3>

        <div class="space-y-3 text-xs">
          <div class="flex justify-between items-center py-1">
            <span class="text-ink-muted">Contracted Plan:</span>
            <span class="font-medium text-ink capitalize">{{ client.plan }}</span>
          </div>
          <div class="flex justify-between items-center py-1">
            <span class="text-ink-muted">Monthly Run Rate (MRR):</span>
            <span class="font-mono font-bold text-sm text-ink">{{ formatCurrency(client.monthlySpend) }} / mo</span>
          </div>
          <div class="flex justify-between items-center py-1">
            <span class="text-ink-muted">Provisioned User Seats:</span>
            <span class="font-mono text-ink">{{ client.usersCount }} active seats</span>
          </div>
          <div class="flex justify-between items-center py-1">
            <span class="text-ink-muted">Next Renewal Date:</span>
            <span class="font-mono font-medium text-ink">{{ formatDate(client.renewalDate) }}</span>
          </div>
          <div class="flex justify-between items-center py-1">
            <span class="text-ink-muted">Frappe Bench Site:</span>
            <span class="font-mono text-[11px] text-ink-muted">{{ client.siteName }}</span>
          </div>
        </div>

        <div v-if="!canManagePlans" class="pt-3 text-[11px] text-ink-muted italic border-t border-stone-border">
          * Plan modifications and suspension restricted to Adadiko Admin staff.
        </div>
      </div>

      <!-- Active Entitled Modules -->
      <div class="lg:col-span-2 bg-stone-surface border border-stone-border rounded-2xl p-6 shadow-soft">
        <div class="flex items-center justify-between border-b border-stone-border pb-3 mb-4">
          <h3 class="font-heading font-bold text-base text-ink">
            Active Tenant Modules ({{ client.modules.length }})
          </h3>
          <span class="text-xs text-ink-muted">ERPNext v16 App Entitlements</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="modKey in client.modules"
            :key="modKey"
            class="p-3 rounded-xl border border-stone-border bg-stone-subtle/60 flex items-start gap-3"
          >
            <div class="w-8 h-8 rounded-lg bg-signal/15 text-signal flex items-center justify-center shrink-0">
              <AppIcon name="catalog" :size="16" />
            </div>
            <div>
              <div class="font-medium text-xs text-ink capitalize">{{ modKey }} Management</div>
              <div class="text-[11px] text-ink-muted mt-0.5">
                Active in workspace navigation for authorized client roles.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Diagnostic Notes & Activity Log Tabs -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Internal Support Notes -->
      <div class="bg-stone-surface border border-stone-border rounded-2xl p-6 shadow-soft">
        <h3 class="font-heading font-bold text-base text-ink mb-2">Internal Staff Notes</h3>
        <p class="text-xs text-ink-muted mb-4">Confidential notes visible only to Adadiko staff.</p>

        <!-- New Note Input Form -->
        <div class="flex gap-2 mb-4">
          <input
            type="text"
            v-model="newNote"
            placeholder="Add diagnostic or account note..."
            class="flex-1 px-3 py-2 bg-stone-subtle text-xs text-ink rounded-xl border border-stone-border focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal"
            @keyup.enter="handleAddNote"
          />
          <AppButton
            variant="secondary"
            size="sm"
            @click="handleAddNote"
            :disabled="!newNote.trim() || addingNote"
          >
            Add Note
          </AppButton>
        </div>

        <!-- Notes List -->
        <div class="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          <div
            v-for="(note, idx) in client.notes"
            :key="idx"
            class="p-3 rounded-xl bg-stone-subtle/80 border border-stone-border text-xs text-ink leading-relaxed"
          >
            {{ note }}
          </div>
          <div v-if="!client.notes || client.notes.length === 0" class="text-xs text-ink-muted text-center py-4">
            No internal staff notes recorded yet.
          </div>
        </div>
      </div>

      <!-- Tenant Activity Audit Trail -->
      <div class="bg-stone-surface border border-stone-border rounded-2xl p-6 shadow-soft">
        <h3 class="font-heading font-bold text-base text-ink mb-2">Tenant Activity History</h3>
        <p class="text-xs text-ink-muted mb-4">Recent workspace provisioning and operational changes.</p>

        <div class="space-y-3 max-h-72 overflow-y-auto pr-1">
          <div
            v-for="act in client.activityLog"
            :key="act.id"
            class="p-3 rounded-xl border border-stone-border bg-stone-subtle/50 text-xs flex flex-col gap-1"
          >
            <div class="flex items-center justify-between">
              <span class="font-semibold text-ink">{{ act.staffName }}</span>
              <span class="font-mono text-[11px] text-ink-muted">{{ act.timestamp }}</span>
            </div>
            <p class="text-ink-muted leading-relaxed">{{ act.text }}</p>
          </div>
          <div v-if="!client.activityLog || client.activityLog.length === 0" class="text-xs text-ink-muted text-center py-4">
            No recorded activity trail for this workspace.
          </div>
        </div>
      </div>
    </div>

    <!-- Change Plan Modal -->
    <Modal
      :show="showPlanModal"
      title="Change Plan & Entitled Modules"
      @close="showPlanModal = false"
    >
      <div class="space-y-5 text-xs">
        <div>
          <label class="block font-medium text-ink mb-1.5">Select Subscription Tier</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="p in (['starter', 'growth', 'enterprise'] as Plan[])"
              :key="p"
              type="button"
              @click="handlePlanSelectionChange(p)"
              class="p-3 rounded-xl border text-left transition-all"
              :class="
                selectedPlan === p
                  ? 'border-signal bg-signal-subtle text-ink font-semibold'
                  : 'border-stone-border bg-stone-subtle text-ink-muted hover:border-stone-border hover:bg-stone-muted'
              "
            >
              <div class="capitalize text-xs font-bold">{{ p }}</div>
              <div class="font-mono text-[11px] mt-1">${{ PLAN_DEFINITIONS[p]?.baseMonthlyPrice }}/mo</div>
            </button>
          </div>
        </div>

        <div>
          <label class="block font-medium text-ink mb-1.5">Module Entitlements</label>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1 border border-stone-border rounded-xl p-2 bg-stone-subtle/50">
            <div
              v-for="mod in catalogModules"
              :key="mod.key"
              class="flex items-center justify-between p-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
              @click="toggleModule(mod.key)"
            >
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="isModuleSelected(mod.key)"
                  class="rounded border-stone-border text-signal focus:ring-signal"
                  @click.stop="toggleModule(mod.key)"
                />
                <div>
                  <span class="font-medium text-ink">{{ mod.name }}</span>
                  <span v-if="PLAN_DEFINITIONS[selectedPlan]?.includedModules.includes(mod.key)" class="ml-1 text-[10px] text-signal font-mono">
                    (Base)
                  </span>
                </div>
              </div>
              <span class="font-mono text-ink-muted">
                {{ PLAN_DEFINITIONS[selectedPlan]?.includedModules.includes(mod.key) ? 'Included' : `+$${mod.monthlyPrice}/mo` }}
              </span>
            </div>
          </div>
        </div>

        <!-- Calculated Spend Summary -->
        <div class="p-3 rounded-xl bg-ink text-white flex items-center justify-between">
          <span>New Monthly Spend:</span>
          <span class="font-mono font-bold text-sm text-signal">
            {{ formatCurrency(calculatedModalSpend) }} / month
          </span>
        </div>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="showPlanModal = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" @click="savePlanChanges" :loading="isSaving">
          Apply Plan Changes
        </AppButton>
      </template>
    </Modal>

    <!-- Suspend / Reactivate Modal -->
    <Modal
      :show="showStatusModal"
      :title="client.status === 'suspended' ? 'Reactivate Client Workspace' : 'Suspend Client Workspace'"
      @close="showStatusModal = false"
    >
      <div class="text-xs text-ink space-y-3">
        <p>
          Are you sure you want to
          <strong :class="client.status === 'suspended' ? 'text-status-green' : 'text-status-red'">
            {{ client.status === 'suspended' ? 'REACTIVATE' : 'SUSPEND' }}
          </strong>
          the workspace for <strong>{{ client.name }}</strong> ({{ client.siteName }})?
        </p>

        <p class="text-ink-muted">
          {{ client.status === 'suspended'
            ? 'Reactivating will immediately restore full portal and Frappe API access to all client staff.'
            : 'Suspending will immediately lock all client staff out of this workspace. The database and files remain intact on the bench.' }}
        </p>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="showStatusModal = false">
          Cancel
        </AppButton>
        <AppButton
          :variant="client.status === 'suspended' ? 'primary' : 'danger'"
          size="sm"
          @click="toggleClientStatus"
          :loading="isSaving"
        >
          Confirm {{ client.status === 'suspended' ? 'Reactivation' : 'Suspension' }}
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
