<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanSelection } from '@/composables/usePlanSelection'
import { useSession } from '@/composables/useSession'
import { requestWorkspace, getWorkspaceStatus, retryWorkspace } from '@/services/workspace'
import { setStoredSiteName, setStoredSlug } from '@/services/frappeHttp'
import { setCheckoutSessionPassword } from '@/services/auth'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import TextField from '@/components/common/TextField.vue'
import Field from '@/components/common/Field.vue'
import { formatCurrency } from '@/utils/format'

const router = useRouter()
const {
  selectedPlanId,
  billingCycle,
  selectedModules,
  extraSeats,
  currentTier,
  basePrice,
  addonModulesPrice,
  extraSeatsPrice,
  monthlyTotal,
  toggleModule,
  isModuleSelected,
  selectTier,
  allModules,
  allTiers,
} = usePlanSelection()

const { apiMode } = useSession()

// Steps: 1 Company -> 2 Plan & modules -> 3 Pay -> 4 Create login -> 5 Provisioning
const currentStep = ref<1 | 2 | 3 | 4 | 5>(1)

const orgName = ref('')
const slug = ref('')
const slugEdited = ref(false)
const adminName = ref('')
const adminEmail = ref('')
const country = ref('United States')
const password = ref('')
const confirmPassword = ref('')
const stepError = ref('')
const paymentCardNumber = ref('•••• •••• •••• 4242')
const paymentExpiry = ref('12/28')
const paymentCvc = ref('888')

// Provisioning state
const pollingStatus = ref<'Pending' | 'Provisioning' | 'Ready' | 'Failed'>('Pending')
const statusMessage = ref('')
const retryLoading = ref(false)
const pollAttempts = ref(0)
const elapsedSeconds = ref(0)
let pollTimer: ReturnType<typeof setInterval> | null = null
let elapsedTimer: ReturnType<typeof setInterval> | null = null

function startElapsedTimer() {
  stopElapsedTimer()
  elapsedSeconds.value = 0
  elapsedTimer = setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)
}

function stopElapsedTimer() {
  if (elapsedTimer) {
    clearInterval(elapsedTimer)
    elapsedTimer = null
  }
}

const formattedElapsedTime = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60)
  const s = elapsedSeconds.value % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s.toString().padStart(2, '0')}s`
})

interface ProvisioningStep {
  id: number
  label: string
  detail: string
}

const PROVISIONING_STEPS: ProvisioningStep[] = [
  { id: 1, label: 'Workspace Registration', detail: 'Allocating tenant records on control cluster' },
  { id: 2, label: 'Database Initialization', detail: 'Creating isolated MariaDB database & user credentials' },
  { id: 3, label: 'ERPNext & Hub Installation', detail: 'Installing ERPNext v16 distribution schema & Adadiko Hub' },
  { id: 4, label: 'Company & Admin Setup', detail: 'Configuring standard chart of accounts & admin credentials' },
  { id: 5, label: 'Security & Activation', detail: 'Synchronizing plan modules, CSRF security & health check' },
]

const currentProgressStepIndex = computed(() => {
  if (pollingStatus.value === 'Ready') return 5
  if (pollingStatus.value === 'Pending') return 1
  if (elapsedSeconds.value < 45) return 2
  if (elapsedSeconds.value < 95) return 3
  if (elapsedSeconds.value < 135) return 4
  return 5
})

// If provisioning takes longer than this many polls (~4 min at 3s), surface a
// Retry button so a stuck workspace (e.g. a previous run that died) can be
// re-triggered from the UI instead of waiting forever.
const stuckThreshold = 80

// Auto-derive slug from company name unless user explicitly edited it
watch(orgName, (val) => {
  if (!slugEdited.value) {
    slug.value = val
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 30)
  }
})

function onSlugInput(val: string | number) {
  slugEdited.value = true
  slug.value = String(val).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30)
}

function nextStep() {
  stepError.value = ''
  if (currentStep.value === 1) {
    if (!orgName.value.trim() || !adminName.value.trim() || !adminEmail.value.trim()) {
      stepError.value = 'Enter your company name, your name, and a work email to continue.'
      return
    }

    const cleanSlug = slug.value.trim().toLowerCase()
    if (!cleanSlug || cleanSlug.length < 3) {
      stepError.value = 'Workspace address must be at least 3 characters (lowercase letters and digits).'
      return
    }
    if (!/^[a-z0-9]{3,30}$/.test(cleanSlug)) {
      stepError.value = 'Workspace address must contain only lowercase letters and numbers (3 to 30 characters).'
      return
    }
    const reserved = ['admin', 'control', 'www', 'api', 'app', 'frappe', 'erpnext', 'root', 'localhost']
    if (reserved.includes(cleanSlug)) {
      stepError.value = `Workspace address '${cleanSlug}' is reserved. Please choose another.`
      return
    }

    currentStep.value = 2
    return
  }

  if (currentStep.value === 2) {
    currentStep.value = 3
    return
  }

  if (currentStep.value === 3) {
    currentStep.value = 4
    return
  }

  if (currentStep.value === 4) {
    if (password.value.trim().length < 8) {
      stepError.value = 'Choose a password with at least 8 characters. You will use it every time you sign in.'
      return
    }
    if (password.value !== confirmPassword.value) {
      stepError.value = 'The two passwords do not match.'
      return
    }

    startProvisioning()
  }
}

function prevStep() {
  stepError.value = ''
  if (currentStep.value > 1 && currentStep.value < 5) {
    currentStep.value = (currentStep.value - 1) as 1 | 2 | 3 | 4
  }
}

async function startProvisioning() {
  const cleanSlug = slug.value.trim().toLowerCase()
  const cleanEmail = adminEmail.value.trim().toLowerCase()
  const cleanOrg = orgName.value.trim() || 'My Company'
  const cleanName = adminName.value.trim() || 'Admin'

  stepError.value = ''
  currentStep.value = 5
  pollAttempts.value = 0
  pollingStatus.value = 'Provisioning'
  statusMessage.value = 'Submitting workspace registration to Adadiko Hub...'
  startElapsedTimer()

  // Remember in localStorage so screen survives page refresh
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('adadiko_pending_slug', cleanSlug)
    localStorage.setItem('adadiko_pending_email', cleanEmail)
    localStorage.setItem('adadiko_pending_company', cleanOrg)
  }

  const res = await requestWorkspace({
    company_name: cleanOrg,
    slug: cleanSlug,
    contact_name: cleanName,
    email: cleanEmail,
    password: password.value,
    modules: [...selectedModules.value],
  })

  if (!res.ok) {
    stopElapsedTimer()
    pollingStatus.value = 'Failed'
    statusMessage.value = res.error || 'Failed to submit workspace registration.'
    return
  }

  // Start polling workspace status every 3 seconds
  startStatusPolling(cleanSlug)
}

function startStatusPolling(targetSlug: string) {
  stopStatusPolling()

  async function check() {
    pollAttempts.value += 1
    const res = await getWorkspaceStatus(targetSlug)
    if (!res.ok) {
      statusMessage.value = res.error || 'Waiting for status update...'
      return
    }

    const data = res.data
    if (!data) return

    pollingStatus.value = data.status as 'Pending' | 'Provisioning' | 'Ready' | 'Failed'
    statusMessage.value = data.message || ''

    if (data.status === 'Ready') {
      stopStatusPolling()
      stopElapsedTimer()
      const siteName = data.site_name || `${targetSlug}.localhost`
      setStoredSiteName(siteName)
      setStoredSlug(targetSlug)

      // Store password strictly in memory for one-shot automatic sign-in
      if (password.value) {
        setCheckoutSessionPassword(password.value)
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('adadiko_pending_slug')
      }

      setTimeout(() => {
        router.push({
          path: '/sign-in',
          query: {
            workspace: targetSlug,
            email: adminEmail.value || (typeof localStorage !== 'undefined' ? localStorage.getItem('adadiko_pending_email') : '') || '',
          },
        })
      }, 1200)
    } else if (data.status === 'Failed') {
      stopStatusPolling()
      stopElapsedTimer()
    }
  }

  // Run immediate first check
  check()
  pollTimer = setInterval(check, 3000)
}

function stopStatusPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function goToSignIn() {
  stopStatusPolling()
  stopElapsedTimer()
  const targetSlug = slug.value || (typeof localStorage !== 'undefined' ? localStorage.getItem('adadiko_pending_slug') : '') || ''
  const siteName = `${targetSlug}.localhost`
  setStoredSiteName(siteName)
  setStoredSlug(targetSlug)
  if (password.value) {
    setCheckoutSessionPassword(password.value)
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('adadiko_pending_slug')
  }
  router.push({
    path: '/sign-in',
    query: {
      workspace: targetSlug,
      email: adminEmail.value || (typeof localStorage !== 'undefined' ? localStorage.getItem('adadiko_pending_email') : '') || '',
    },
  })
}

async function handleRetry() {
  const targetSlug = slug.value || (typeof localStorage !== 'undefined' ? localStorage.getItem('adadiko_pending_slug') : '') || ''
  if (!targetSlug) return

  retryLoading.value = true
  stepError.value = ''
  pollAttempts.value = 0
  pollingStatus.value = 'Provisioning'
  statusMessage.value = 'Re-queuing provisioning...'
  startElapsedTimer()

  try {
    const res = await retryWorkspace(targetSlug)
    if (res.ok) {
      startStatusPolling(targetSlug)
    } else {
      stopElapsedTimer()
      pollingStatus.value = 'Failed'
      statusMessage.value = res.error || 'Could not retry provisioning.'
    }
  } finally {
    retryLoading.value = false
  }
}

function resetRegistration() {
  stopStatusPolling()
  stopElapsedTimer()
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('adadiko_pending_slug')
    localStorage.removeItem('adadiko_pending_email')
    localStorage.removeItem('adadiko_pending_company')
  }
  currentStep.value = 1
  stepError.value = ''
  pollingStatus.value = 'Pending'
}

onMounted(() => {
  // Check if there was a workspace in progress before refresh
  if (typeof localStorage !== 'undefined') {
    const savedSlug = localStorage.getItem('adadiko_pending_slug')
    if (savedSlug) {
      slug.value = savedSlug
      adminEmail.value = localStorage.getItem('adadiko_pending_email') || ''
      orgName.value = localStorage.getItem('adadiko_pending_company') || savedSlug
      currentStep.value = 5
      startElapsedTimer()
      startStatusPolling(savedSlug)
    }
  }
})

onUnmounted(() => {
  stopStatusPolling()
  stopElapsedTimer()
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <div class="text-center space-y-2">
      <Badge variant="signal" size="sm">Workspace setup</Badge>
      <h1 class="text-3xl font-black text-ink font-heading">
        Set up your Adadiko Hub workspace
      </h1>
      <p class="text-sm text-ink-muted">
        Company details, then modules, then payment. You create a password last so you can sign in to your dedicated site.
      </p>
    </div>

    <!-- Stepper indicator -->
    <div v-if="currentStep < 5" class="bg-white p-4 rounded-2xl border border-stone-border shadow-soft flex items-center justify-between">
      <div
        v-for="(st, idx) in [
          { num: 1, label: 'Company' },
          { num: 2, label: 'Plan & modules' },
          { num: 3, label: 'Pay' },
          { num: 4, label: 'Create login' },
        ]"
        :key="st.num"
        class="flex-1 flex items-center gap-3"
      >
        <div
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
            currentStep === st.num
              ? 'bg-signal text-white shadow-xs'
              : currentStep > st.num
              ? 'bg-status-green text-white'
              : 'bg-stone-bg text-ink-muted border border-stone-border',
          ]"
        >
          <AppIcon v-if="currentStep > st.num" name="check" :size="14" />
          <span v-else>{{ st.num }}</span>
        </div>
        <span
          :class="[
            'text-xs font-medium hidden sm:inline truncate',
            currentStep === st.num ? 'text-ink font-bold' : 'text-ink-muted',
          ]"
        >
          {{ st.label }}
        </span>
        <div v-if="idx < 3" class="flex-1 h-[1px] bg-stone-border mx-2 hidden md:block" />
      </div>
    </div>

    <div
      v-if="stepError"
      class="p-4 rounded-2xl bg-status-red/10 border border-status-red/30 text-sm text-status-red font-medium flex items-center gap-2"
    >
      <AppIcon name="alert-circle" :size="18" className="shrink-0" />
      <span>{{ stepError }}</span>
    </div>

    <!-- STEP 1: Company -->
    <div v-if="currentStep === 1" class="bg-white p-6 sm:p-8 rounded-3xl border border-stone-border shadow-soft space-y-6">
      <h3 class="text-base font-bold text-ink font-heading pb-2 border-b border-stone-border">
        Your company
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company / Organization Name" required>
          <TextField v-model="orgName" placeholder="e.g. Gamma Tools" />
        </Field>

        <Field
          label="Workspace Address (Subdomain)"
          required
          hint="Lowercase letters and numbers only (3-30 chars)."
        >
          <TextField
            :model-value="slug"
            placeholder="gammatools"
            @update:model-value="onSlugInput"
          >
            <template #prefix>
              <AppIcon name="building" :size="16" />
            </template>
            <template #suffix>
              <span class="text-xs font-mono text-ink-muted select-none">.localhost</span>
            </template>
          </TextField>
        </Field>

        <Field label="Operating Country / Jurisdiction" required>
          <TextField v-model="country" placeholder="e.g. United States" />
        </Field>

        <Field label="Your Name" required>
          <TextField v-model="adminName" placeholder="e.g. John Doe" />
        </Field>

        <div class="sm:col-span-2">
          <Field label="Work Email" required hint="You will use this email and your workspace address to sign in.">
            <TextField v-model="adminEmail" type="email" placeholder="e.g. admin@gammatools.com" />
          </Field>
        </div>
      </div>
      <p class="text-xs text-ink-muted">
        You will configure modules next, review payment, and set your password on the final step before provisioning.
      </p>
      <div class="flex items-center justify-end pt-4 border-t border-stone-border">
        <AppButton variant="primary" size="md" @click="nextStep">
          <span>Continue to modules</span>
          <AppIcon name="arrow-right" :size="16" />
        </AppButton>
      </div>
    </div>

    <!-- STEP 2: Plan and Modules -->
    <div v-else-if="currentStep === 2" class="space-y-6">
      <div class="bg-white p-6 rounded-3xl border border-stone-border shadow-soft space-y-4">
        <h3 class="text-sm font-bold uppercase tracking-wider text-ink font-heading">
          1. Choose Workspace Base Tier
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            v-for="tier in allTiers"
            :key="tier.id"
            :class="[
              'p-4 rounded-2xl border cursor-pointer transition-all',
              selectedPlanId === tier.id
                ? 'border-signal bg-signal-subtle/40 ring-2 ring-signal/20'
                : 'border-stone-border bg-stone-bg/40 hover:bg-white',
            ]"
            @click="selectTier(tier.id)"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-bold text-ink">{{ tier.name }}</span>
              <AppIcon v-if="selectedPlanId === tier.id" name="check" :size="14" className="text-signal" />
            </div>
            <p class="text-xs text-ink-muted mb-3">{{ tier.includedUsers }} team members included</p>
            <div class="text-lg font-bold text-ink font-heading num-tabular">
              {{ formatCurrency(billingCycle === 'monthly' ? tier.monthlyBasePrice : tier.yearlyBasePrice) }}/mo
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-3xl border border-stone-border shadow-soft space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold uppercase tracking-wider text-ink font-heading">
            2. Active Business Modules
          </h3>
          <span class="text-xs text-ink-muted">Sales is active by default</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="mod in allModules"
            :key="mod.id"
            :class="[
              'p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer',
              isModuleSelected(mod.id)
                ? 'border-signal bg-signal-subtle/30 ring-1 ring-signal/20'
                : 'border-stone-border bg-white hover:bg-stone-bg/50',
            ]"
            @click="toggleModule(mod.id)"
          >
            <div
              :class="[
                'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5',
                isModuleSelected(mod.id)
                  ? 'bg-signal border-signal text-white'
                  : 'bg-white border-stone-border',
              ]"
            >
              <AppIcon v-if="isModuleSelected(mod.id)" name="check" :size="12" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-ink truncate">{{ mod.title }}</span>
                <span class="text-xs font-semibold text-ink num-tabular">+{{ formatCurrency(mod.monthlyPrice) }}/mo</span>
              </div>
              <p class="text-[11px] text-ink-muted truncate">{{ mod.tagline }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-ink-navy text-white p-5 rounded-2xl shadow-lift flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p class="text-xs text-stone-bg/60">Estimated Monthly Total</p>
          <div class="text-2xl font-black text-white font-heading num-tabular">
            {{ formatCurrency(monthlyTotal) }} <span class="text-xs font-normal text-stone-bg/70">/ month</span>
          </div>
        </div>
        <div class="flex gap-2">
          <AppButton variant="ghost" size="md" @click="prevStep">Back</AppButton>
          <AppButton variant="primary" size="md" @click="nextStep">
            <span>Continue to payment</span>
            <AppIcon name="arrow-right" :size="16" />
          </AppButton>
        </div>
      </div>
    </div>

    <!-- STEP 3: Payment -->
    <div v-else-if="currentStep === 3" class="bg-white p-6 sm:p-8 rounded-3xl border border-stone-border shadow-soft space-y-6">
      <h3 class="text-base font-bold text-ink font-heading pb-2 border-b border-stone-border">
        Review & confirm
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div class="space-y-3">
          <p class="text-xs font-bold uppercase tracking-wider text-ink-muted">Order Summary</p>
          <div class="p-4 rounded-2xl bg-stone-bg border border-stone-border space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-ink-muted">Company</span>
              <span class="font-bold text-ink">{{ orgName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-muted">Workspace</span>
              <span class="font-mono font-bold text-ink">{{ slug }}.localhost</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-muted">Base Tier ({{ currentTier.name }})</span>
              <span class="font-bold text-ink num-tabular">{{ formatCurrency(basePrice) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-muted">Selected Modules ({{ selectedModules.length }})</span>
              <span class="font-bold text-ink num-tabular">+{{ formatCurrency(addonModulesPrice) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-muted">Extra Seats ({{ extraSeats }})</span>
              <span class="font-bold text-ink num-tabular">+{{ formatCurrency(extraSeatsPrice) }}</span>
            </div>
            <div class="pt-2 border-t border-stone-border flex justify-between font-bold text-sm text-ink">
              <span>Monthly Total</span>
              <span class="num-tabular text-signal">{{ formatCurrency(monthlyTotal) }}/mo</span>
            </div>
          </div>
        </div>
        <div class="space-y-3">
          <p class="text-xs font-bold uppercase tracking-wider text-ink-muted">Payment Details (Evaluation)</p>
          <div class="p-4 rounded-2xl bg-stone-bg border border-stone-border space-y-3 text-xs">
            <Field label="Card Number">
              <TextField v-model="paymentCardNumber" />
            </Field>
            <div class="grid grid-cols-2 gap-2">
              <Field label="Expiry">
                <TextField v-model="paymentExpiry" />
              </Field>
              <Field label="CVC">
                <TextField v-model="paymentCvc" />
              </Field>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between pt-4 border-t border-stone-border">
        <AppButton variant="ghost" size="md" @click="prevStep">Back</AppButton>
        <AppButton variant="primary" size="lg" @click="nextStep">
          <span>Continue to create login</span>
          <AppIcon name="arrow-right" :size="16" />
        </AppButton>
      </div>
    </div>

    <!-- STEP 4: Register / Password -->
    <div v-else-if="currentStep === 4" class="bg-white p-6 sm:p-8 rounded-3xl border border-stone-border shadow-soft space-y-6">
      <h3 class="text-base font-bold text-ink font-heading pb-2 border-b border-stone-border">
        Create your workspace login
      </h3>
      <p class="text-sm text-ink-muted">
        Choose a secure password for your administrator account. Once submitted, your dedicated ERPNext site will be automatically created.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company">
          <TextField :model-value="orgName" disabled />
        </Field>
        <Field label="Workspace Subdomain">
          <TextField :model-value="`${slug}.localhost`" disabled />
        </Field>
        <Field label="Admin Name">
          <TextField :model-value="adminName" disabled />
        </Field>
        <Field label="Work Email">
          <TextField :model-value="adminEmail" disabled />
        </Field>
        <Field label="Password" required hint="At least 8 characters. Keep this to sign in.">
          <TextField v-model="password" type="password" placeholder="Create a password" />
        </Field>
        <Field label="Confirm Password" required>
          <TextField v-model="confirmPassword" type="password" placeholder="Type password again" />
        </Field>
      </div>
      <div class="flex items-center justify-between pt-4 border-t border-stone-border">
        <AppButton variant="ghost" size="md" @click="prevStep">Back</AppButton>
        <AppButton variant="primary" size="lg" @click="nextStep">
          <AppIcon name="zap" :size="16" />
          <span>Create workspace & begin setup</span>
        </AppButton>
      </div>
    </div>

    <!-- STEP 5: Real Workspace Provisioning Screen (Driven by get_workspace_status) -->
    <div
      v-else-if="currentStep === 5"
      class="bg-white p-8 sm:p-12 rounded-3xl border border-stone-border shadow-card max-w-lg mx-auto text-center space-y-6"
    >
      <!-- Status Icon / Spinner -->
      <div class="w-20 h-20 mx-auto flex items-center justify-center">
        <div
          v-if="pollingStatus === 'Pending' || pollingStatus === 'Provisioning'"
          class="relative w-16 h-16 flex items-center justify-center"
        >
          <div class="w-16 h-16 border-4 border-stone-border border-t-signal rounded-full animate-spin" />
          <AppIcon name="cpu" :size="20" className="absolute text-signal" />
        </div>

        <div
          v-else-if="pollingStatus === 'Ready'"
          class="w-16 h-16 rounded-full bg-status-green/20 text-status-green flex items-center justify-center"
        >
          <AppIcon name="check" :size="32" />
        </div>

        <div
          v-else-if="pollingStatus === 'Failed'"
          class="w-16 h-16 rounded-full bg-status-red/20 text-status-red flex items-center justify-center"
        >
          <AppIcon name="x" :size="32" />
        </div>
      </div>

      <!-- Status Header & Plain Words Text -->
      <div class="space-y-2">
        <div class="flex items-center justify-center gap-2">
          <Badge
            :variant="
              pollingStatus === 'Ready'
                ? 'success'
                : pollingStatus === 'Failed'
                ? 'danger'
                : 'signal'
            "
            size="sm"
          >
            Status: {{ pollingStatus }}
          </Badge>
          <Badge
            v-if="pollingStatus === 'Pending' || pollingStatus === 'Provisioning'"
            variant="neutral"
            size="sm"
            className="font-mono text-signal"
          >
            Elapsed: {{ formattedElapsedTime }}
          </Badge>
        </div>

        <h3 class="text-2xl font-black text-ink font-heading">
          <template v-if="pollingStatus === 'Pending'">
            Setting up your workspace...
          </template>
          <template v-else-if="pollingStatus === 'Provisioning'">
            Provisioning dedicated site...
          </template>
          <template v-else-if="pollingStatus === 'Ready'">
            Workspace ready!
          </template>
          <template v-else-if="pollingStatus === 'Failed'">
            Setup encountered an issue
          </template>
        </h3>

        <p class="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto">
          <template v-if="pollingStatus === 'Pending'">
            Your registration is queued on the control server. Provisioning will start automatically.
          </template>
          <template v-else-if="pollingStatus === 'Provisioning'">
            Bench is currently creating an isolated database, installing ERPNext and Adadiko Hub, and initializing your company chart of accounts.
          </template>
          <template v-else-if="pollingStatus === 'Ready'">
            Your dedicated workspace is ready! Redirecting you to sign in...
          </template>
          <template v-else-if="pollingStatus === 'Failed'">
            An error occurred while provisioning your workspace. See error details below and click Retry.
          </template>
        </p>
      </div>

      <!-- Real Steps Checklist -->
      <div class="text-left bg-stone-bg/60 p-4 rounded-2xl border border-stone-border space-y-2.5">
        <div class="text-xs font-bold text-ink flex items-center justify-between pb-1 border-b border-stone-border">
          <span class="flex items-center gap-1.5">
            <AppIcon name="cpu" :size="14" className="text-signal" />
            Provisioning Pipeline
          </span>
          <span class="text-ink-muted font-mono font-normal text-[11px]">
            {{ pollingStatus === 'Ready' ? 'Completed' : formattedElapsedTime }}
          </span>
        </div>
        <div
          v-for="st in PROVISIONING_STEPS"
          :key="st.id"
          class="flex items-start gap-2.5 text-xs transition-opacity"
          :class="st.id <= currentProgressStepIndex ? 'opacity-100' : 'opacity-40'"
        >
          <div class="shrink-0 mt-0.5">
            <div
              v-if="pollingStatus === 'Ready' || st.id < currentProgressStepIndex"
              class="w-4 h-4 rounded-full bg-status-green/20 text-status-green flex items-center justify-center"
            >
              <AppIcon name="check" :size="10" />
            </div>
            <div
              v-else-if="pollingStatus === 'Failed' && st.id === currentProgressStepIndex"
              class="w-4 h-4 rounded-full bg-status-red/20 text-status-red flex items-center justify-center"
            >
              <AppIcon name="x" :size="10" />
            </div>
            <div
              v-else-if="st.id === currentProgressStepIndex"
              class="w-4 h-4 rounded-full border-2 border-signal border-t-transparent animate-spin"
            />
            <div
              v-else
              class="w-4 h-4 rounded-full bg-stone-border/40"
            />
          </div>
          <div class="flex-1">
            <p class="font-bold text-ink leading-tight">{{ st.label }}</p>
            <p class="text-[11px] text-ink-muted leading-tight mt-0.5">{{ st.detail }}</p>
          </div>
        </div>
      </div>

      <!-- Real Failed Message Box -->
      <div
        v-if="pollingStatus === 'Failed' && statusMessage"
        class="text-left p-3.5 rounded-2xl bg-status-red/10 border border-status-red/30 space-y-1 text-xs"
      >
        <div class="font-bold text-status-red flex items-center gap-1.5">
          <AppIcon name="alert-circle" :size="14" />
          <span>Provisioning Error Details</span>
        </div>
        <p class="text-[11px] text-ink-muted font-mono whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
          {{ statusMessage }}
        </p>
      </div>

      <!-- Workspace Target Pill -->
      <div class="p-3.5 rounded-2xl bg-stone-bg border border-stone-border text-xs text-ink-muted space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-ink-muted">Company</span>
          <span class="font-bold text-ink">{{ orgName }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-ink-muted">Site URL</span>
          <span class="font-mono font-bold text-signal">{{ slug }}.localhost</span>
        </div>
      </div>

      <!-- Action Buttons on Ready -->
      <div v-if="pollingStatus === 'Ready'" class="pt-2">
        <AppButton
          variant="primary"
          size="md"
          block
          @click="goToSignIn"
        >
          <AppIcon name="arrow-right" :size="16" />
          <span>Go to Sign In</span>
        </AppButton>
      </div>

      <!-- Action Buttons on Failed -->
      <div v-if="pollingStatus === 'Failed'" class="flex flex-col sm:flex-row gap-3 pt-2">
        <AppButton
          variant="primary"
          size="md"
          block
          :loading="retryLoading"
          @click="handleRetry"
        >
          <AppIcon name="refresh" :size="16" />
          <span>Retry Workspace Setup</span>
        </AppButton>

        <AppButton
          variant="ghost"
          size="md"
          block
          @click="resetRegistration"
        >
          <span>Change details & restart</span>
        </AppButton>
      </div>

      <!-- Option to restart if in pending/provisioning -->
      <div v-if="pollingStatus === 'Pending' || pollingStatus === 'Provisioning'" class="pt-2 space-y-3">
        <AppButton
          v-if="pollAttempts >= stuckThreshold"
          variant="primary"
          size="md"
          block
          :loading="retryLoading"
          @click="handleRetry"
        >
          <AppIcon name="refresh" :size="16" />
          <span>Retry Workspace Setup</span>
        </AppButton>
        <p v-if="pollAttempts >= stuckThreshold" class="text-xs text-ink-muted">
          Setup is taking longer than expected. You can retry without losing your details.
        </p>
        <button
          type="button"
          class="text-xs text-ink-muted hover:text-ink underline transition-colors cursor-pointer"
          @click="resetRegistration"
        >
          Cancel or register a different workspace
        </button>
      </div>
    </div>
  </div>
</template>
