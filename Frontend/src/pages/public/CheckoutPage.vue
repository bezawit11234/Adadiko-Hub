<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanSelection } from '@/composables/usePlanSelection'
import { useSession } from '@/composables/useSession'
import { getAuthApi } from '@/services/auth'
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

const { setOrganization, setUser } = useSession()
const authApi = getAuthApi()

// 1 company → 2 modules → 3 pay → 4 register password → 5 provisioning
const currentStep = ref<1 | 2 | 3 | 4 | 5>(1)

const orgName = ref('')
const adminName = ref('')
const adminEmail = ref('')
const country = ref('')
const password = ref('')
const confirmPassword = ref('')
const stepError = ref('')
const paymentCardNumber = ref('')
const paymentExpiry = ref('')
const paymentCvc = ref('')

const provisioningPercent = ref(15)
const provisioningStatusText = ref('Initializing tenant database schema on Frappe Cloud...')

function nextStep() {
  stepError.value = ''
  if (currentStep.value === 1) {
    if (!orgName.value.trim() || !adminName.value.trim() || !adminEmail.value.trim()) {
      stepError.value = 'Enter your company name, your name, and a work email to continue.'
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
    currentStep.value = 5
    runProvisioningSimulation()
  }
}

function prevStep() {
  stepError.value = ''
  if (currentStep.value > 1 && currentStep.value < 5) {
    currentStep.value = (currentStep.value - 1) as 1 | 2 | 3
  }
}

function runProvisioningSimulation() {
  const steps = [
    { pct: 35, text: 'Saving your company and the modules you bought...' },
    { pct: 60, text: 'Creating your admin login...' },
    { pct: 85, text: 'Opening the workspace so you can invite your team...' },
    { pct: 100, text: 'Workspace ready. You can invite teammates next.' },
  ]

  let i = 0
  let finishing = false
  const interval = setInterval(async () => {
    if (finishing) return
    if (i < steps.length) {
      provisioningPercent.value = steps[i].pct
      provisioningStatusText.value = steps[i].text
      i++
      return
    }
    finishing = true
    clearInterval(interval)
    const res = await authApi.register(
      adminName.value.trim(),
      adminEmail.value.trim().toLowerCase(),
      orgName.value.trim() || 'My Company',
      password.value,
      {
        plan: selectedPlanId.value,
        billingCycle: billingCycle.value,
        subscribedModules: [...selectedModules.value],
      },
    )
    if (!res.ok || !res.data) {
      currentStep.value = 4
      stepError.value = res.error || 'Could not create your account. Try a different email.'
      return
    }
    setUser(res.data)
    setOrganization({
      id: res.data.organizationId,
      name: orgName.value.trim() || 'My Company',
      plan: selectedPlanId.value,
      billingCycle: billingCycle.value,
      subscribedModules: [...selectedModules.value],
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active',
    })
    setTimeout(() => {
      router.push({ path: '/app/users', query: { welcome: '1' } })
    }, 700)
  }, 750)
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <div class="text-center space-y-2">
      <Badge variant="signal" size="sm">Workspace setup</Badge>
      <h1 class="text-3xl font-black text-ink font-heading">
        Set up your Adadiko Hub workspace
      </h1>
      <p class="text-sm text-ink-muted">
        Company first, then modules, then payment. You create a password last so you can sign in whenever you come back.
      </p>
    </div>

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

    <p v-if="stepError" class="text-sm text-status-red font-medium">{{ stepError }}</p>

    <!-- STEP 1: Company -->
    <div v-if="currentStep === 1" class="bg-white p-6 sm:p-8 rounded-3xl border border-stone-border shadow-soft space-y-6">
      <h3 class="text-base font-bold text-ink font-heading pb-2 border-b border-stone-border">
        Your company
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company / Organization Name" required>
          <TextField v-model="orgName" placeholder="e.g. Acme Corporation" />
        </Field>
        <Field label="Operating Country / Jurisdiction" required>
          <TextField v-model="country" placeholder="e.g. Kenya" />
        </Field>
        <Field label="Your name" required>
          <TextField v-model="adminName" placeholder="e.g. John Doe" />
        </Field>
        <Field label="Work email" required hint="This email is how you will sign in later.">
          <TextField v-model="adminEmail" type="email" placeholder="e.g. admin@acmecorp.com" />
        </Field>
      </div>
      <p class="text-xs text-ink-muted">
        You will choose a password after you pick modules and confirm payment. Team invites happen once the workspace is open.
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
          <p class="text-xs font-bold uppercase tracking-wider text-ink-muted">Simulated Payment Method</p>
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

    <!-- STEP 4: Register / password -->
    <div v-else-if="currentStep === 4" class="bg-white p-6 sm:p-8 rounded-3xl border border-stone-border shadow-soft space-y-6">
      <h3 class="text-base font-bold text-ink font-heading pb-2 border-b border-stone-border">
        Create your login
      </h3>
      <p class="text-sm text-ink-muted">
        This is the account you will use every time you open the website. After this step you can invite your team.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Name">
          <TextField :model-value="adminName" disabled />
        </Field>
        <Field label="Email">
          <TextField :model-value="adminEmail" disabled />
        </Field>
        <Field label="Password" required hint="At least 8 characters. Keep this — you will need it to sign in.">
          <TextField v-model="password" type="password" placeholder="Create a password" />
        </Field>
        <Field label="Confirm password" required>
          <TextField v-model="confirmPassword" type="password" placeholder="Type the password again" />
        </Field>
      </div>
      <div class="flex items-center justify-between pt-4 border-t border-stone-border">
        <AppButton variant="ghost" size="md" @click="prevStep">Back</AppButton>
        <AppButton variant="primary" size="lg" @click="nextStep">
          <AppIcon name="zap" :size="16" />
          <span>Create account and open workspace</span>
        </AppButton>
      </div>
    </div>

    <div
      v-else-if="currentStep === 5"
      class="bg-white p-10 rounded-3xl border border-stone-border shadow-card max-w-lg mx-auto text-center space-y-6"
    >
      <div class="relative w-24 h-24 mx-auto flex items-center justify-center">
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" stroke="#E7E2D9" stroke-width="8" fill="transparent" />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="#F08A3C"
            stroke-width="8"
            stroke-linecap="round"
            fill="transparent"
            stroke-dasharray="264"
            :stroke-dashoffset="264 - (264 * provisioningPercent) / 100"
            class="transition-all duration-500 ease-out"
          />
        </svg>
        <span class="absolute font-extrabold text-lg text-ink font-heading num-tabular">
          {{ provisioningPercent }}%
        </span>
      </div>
      <div class="space-y-2">
        <h3 class="text-xl font-bold text-ink font-heading">Setting up your workspace...</h3>
        <p class="text-xs text-ink-muted leading-relaxed min-h-[36px]">
          {{ provisioningStatusText }}
        </p>
      </div>
      <div class="p-3.5 rounded-xl bg-stone-bg border border-stone-border text-xs text-ink-muted flex items-center justify-center gap-2">
        <span class="w-2 h-2 rounded-full bg-signal animate-ping" />
        <span>Deploying tenant: <strong>{{ orgName }}</strong></span>
      </div>
    </div>
  </div>
</template>
