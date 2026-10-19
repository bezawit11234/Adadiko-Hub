<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useSession } from '@/composables/useSession'
import { getAuthApi } from '@/services/auth'
import { DEMO_USERS, ROLE_DEFINITIONS } from '@/data/roles'
import type { Role } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Field from '@/components/common/Field.vue'
import TextField from '@/components/common/TextField.vue'

const router = useRouter()
const route = useRoute()
const { setUser, apiMode, setApiMode } = useSession()
const authApi = getAuthApi()

// Default credentials based on API mode
const email = ref(apiMode.value === 'frappe' ? 'sales.manager@example.com' : 'sarah.mgr@adadiko.demo')
const password = ref(apiMode.value === 'frappe' ? 'Test@12345' : '••••••••')
const loading = ref(false)
const errorMessage = ref('')

async function handleSignIn() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await authApi.signIn(email.value, password.value)
    if (res.ok && res.data) {
      setUser(res.data)
      const nextUrl = (route.query.next as string) || (res.data.role === 'adadiko_staff' ? '/admin' : ROLE_DEFINITIONS[res.data.role]?.defaultHome || '/app/sales/dashboard')
      router.push(nextUrl)
    } else {
      errorMessage.value = res.error || 'Failed to sign in. Please verify credentials.'
    }
  } finally {
    loading.value = false
  }
}

function quickDemoSignIn(role: Role) {
  const user = DEMO_USERS[role]
  setUser(user)
  const nextUrl = (route.query.next as string) || (role === 'adadiko_staff' ? '/admin' : ROLE_DEFINITIONS[role].defaultHome)
  router.push(nextUrl)
}

function fillFrappeUser(usr: string, pwd = 'Test@12345') {
  email.value = usr
  password.value = pwd
  errorMessage.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <!-- Dev Mode Switcher -->
    <div class="flex items-center justify-between p-2 rounded-2xl bg-stone-bg border border-stone-border text-xs">
      <span class="font-semibold text-ink-muted flex items-center gap-1.5 pl-1">
        <AppIcon name="cpu" :size="14" />
        Backend Mode:
      </span>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="px-2.5 py-1 rounded-xl font-bold transition-all"
          :class="apiMode === 'frappe' ? 'bg-signal text-white shadow-sm' : 'text-ink-muted hover:text-ink'"
          @click="setApiMode('frappe')"
        >
          ERPNext v16
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-xl font-bold transition-all"
          :class="apiMode === 'mock' ? 'bg-ink-navy text-white shadow-sm' : 'text-ink-muted hover:text-ink'"
          @click="setApiMode('mock')"
        >
          Mock Mode
        </button>
      </div>
    </div>

    <div class="text-center space-y-1">
      <h2 class="text-2xl font-black text-ink font-heading">
        Sign in to your workspace
      </h2>
      <p class="text-xs text-ink-muted">
        <span v-if="apiMode === 'frappe'">Connected to Frappe / ERPNext v16 backend.</span>
        <span v-else>Running in evaluation mode with reactive mock database.</span>
      </p>
    </div>

    <form class="space-y-4" @submit.prevent="handleSignIn">
      <Field label="Work Email" required :error="errorMessage">
        <TextField v-model="email" type="email" placeholder="name@company.com">
          <template #prefix>
            <AppIcon name="mail" :size="16" />
          </template>
        </TextField>
      </Field>

      <Field label="Password" required>
        <template #label-right>
          <RouterLink to="/forgot-password" class="text-xs text-signal hover:underline">
            Forgot password?
          </RouterLink>
        </template>
        <TextField v-model="password" type="password" placeholder="••••••••">
          <template #prefix>
            <AppIcon name="lock" :size="16" />
          </template>
        </TextField>
      </Field>

      <AppButton variant="primary" size="md" block :loading="loading" type="submit">
        <span>Sign In</span>
        <AppIcon name="arrow-right" :size="16" />
      </AppButton>
    </form>

    <!-- IN FRAPPE MODE: Test Accounts Presets (fills form, does not bypass backend auth) -->
    <div v-if="apiMode === 'frappe'" class="pt-4 border-t border-stone-border space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          ERPNext Test Accounts:
        </span>
        <span class="text-[10px] text-ink-light">Password: Test@12345</span>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          class="p-2.5 rounded-xl border transition-all text-left flex flex-col gap-0.5"
          :class="email === 'sales.manager@example.com' ? 'bg-signal-subtle border-signal/40 text-signal' : 'bg-stone-bg hover:bg-stone-muted border-stone-border text-ink'"
          @click="fillFrappeUser('sales.manager@example.com')"
        >
          <span class="font-bold">Sales Manager</span>
          <span class="text-[10px] text-ink-muted font-mono truncate">sales.manager@example.com</span>
        </button>

        <button
          type="button"
          class="p-2.5 rounded-xl border transition-all text-left flex flex-col gap-0.5"
          :class="email === 'sales.rep@example.com' ? 'bg-signal-subtle border-signal/40 text-signal' : 'bg-stone-bg hover:bg-stone-muted border-stone-border text-ink'"
          @click="fillFrappeUser('sales.rep@example.com')"
        >
          <span class="font-bold">Sales Rep</span>
          <span class="text-[10px] text-ink-muted font-mono truncate">sales.rep@example.com</span>
        </button>

        <button
          type="button"
          class="p-2.5 rounded-xl border transition-all text-left flex flex-col gap-0.5"
          :class="email === 'store@example.com' ? 'bg-signal-subtle border-signal/40 text-signal' : 'bg-stone-bg hover:bg-stone-muted border-stone-border text-ink'"
          @click="fillFrappeUser('store@example.com')"
        >
          <span class="font-bold">Storekeeper</span>
          <span class="text-[10px] text-ink-muted font-mono truncate">store@example.com</span>
        </button>

        <button
          type="button"
          class="p-2.5 rounded-xl border transition-all text-left flex flex-col gap-0.5"
          :class="email === 'accounts@example.com' ? 'bg-signal-subtle border-signal/40 text-signal' : 'bg-stone-bg hover:bg-stone-muted border-stone-border text-ink'"
          @click="fillFrappeUser('accounts@example.com')"
        >
          <span class="font-bold">Accountant</span>
          <span class="text-[10px] text-ink-muted font-mono truncate">accounts@example.com</span>
        </button>
      </div>
    </div>

    <!-- IN MOCK MODE: 1-Click Instant Demo Logins -->
    <div v-else class="pt-4 border-t border-stone-border space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Instant Demo Logins:
        </span>
        <span class="text-[10px] text-signal font-semibold">1-Click</span>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          class="p-2 rounded-xl bg-stone-bg hover:bg-stone-muted border border-stone-border text-left transition-colors flex items-center justify-between"
          @click="quickDemoSignIn('sales_rep')"
        >
          <span class="font-medium text-ink">Sales Rep</span>
          <span class="text-[10px] text-ink-light">Tariq</span>
        </button>

        <button
          type="button"
          class="p-2 rounded-xl bg-signal-subtle/50 hover:bg-signal-subtle border border-signal/20 text-left transition-colors flex items-center justify-between text-signal"
          @click="quickDemoSignIn('sales_manager')"
        >
          <span class="font-bold">Sales Manager</span>
          <span class="text-[10px]">Sarah</span>
        </button>

        <button
          type="button"
          class="p-2 rounded-xl bg-stone-bg hover:bg-stone-muted border border-stone-border text-left transition-colors flex items-center justify-between"
          @click="quickDemoSignIn('accountant')"
        >
          <span class="font-medium text-ink">Accountant</span>
          <span class="text-[10px] text-ink-light">Fiona</span>
        </button>

        <button
          type="button"
          class="p-2 rounded-xl bg-stone-bg hover:bg-stone-muted border border-stone-border text-left transition-colors flex items-center justify-between"
          @click="quickDemoSignIn('storekeeper')"
        >
          <span class="font-medium text-ink">Storekeeper</span>
          <span class="text-[10px] text-ink-light">Kwame</span>
        </button>
      </div>

      <button
        type="button"
        class="w-full p-2 rounded-xl bg-ink-navy text-white text-xs font-semibold hover:bg-ink-deep text-center transition-colors flex items-center justify-center gap-2"
        @click="quickDemoSignIn('admin')"
      >
        <AppIcon name="user" :size="14" />
        <span>Sign in as Company Admin (Marcus)</span>
      </button>
    </div>

    <div class="text-center text-xs text-ink-muted">
      Don't have a workspace?
      <RouterLink to="/checkout" class="font-bold text-signal hover:underline ml-1">
        Start Free Trial
      </RouterLink>
    </div>
  </div>
</template>
