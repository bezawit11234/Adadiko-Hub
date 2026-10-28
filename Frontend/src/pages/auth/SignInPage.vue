<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useSession } from '@/composables/useSession'
import { getStoredSlug } from '@/services/frappeHttp'
import { consumeCheckoutSessionPassword } from '@/services/auth'
import { ROLE_DEFINITIONS } from '@/data/roles'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Field from '@/components/common/Field.vue'
import TextField from '@/components/common/TextField.vue'

const router = useRouter()
const route = useRoute()
const { signIn, apiMode, setApiMode } = useSession()

const workspaceSlug = ref(
  (route.query.workspace as string) || getStoredSlug() || ''
)
const email = ref((route.query.email as string) || '')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

onMounted(() => {
  const sessionPwd = consumeCheckoutSessionPassword()
  if (sessionPwd) {
    password.value = sessionPwd
    if (workspaceSlug.value && email.value) {
      handleSignIn()
    }
  }
})

async function handleSignIn() {
  const cleanSlug = workspaceSlug.value.replace(/\.localhost$/, '').trim().toLowerCase()
  if (!cleanSlug) {
    errorMessage.value = 'Enter your workspace name (e.g. gammatools or alphatrading).'
    return
  }
  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Enter the work email and password for your workspace.'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const res = await signIn(email.value.trim(), password.value, cleanSlug)
    if (res.ok && res.data) {
      const nextUrl =
        (route.query.next as string) ||
        ROLE_DEFINITIONS[res.data.role]?.defaultHome ||
        '/app/sales/dashboard'
      router.push(nextUrl)
    } else {
      errorMessage.value = res.error || 'Could not sign in. Check your workspace, email, and password.'
    }
  } finally {
    loading.value = false
  }
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
        <span v-if="apiMode === 'frappe'">Connected to isolated multi-tenant ERPNext sites.</span>
        <span v-else>Sign in with your workspace credentials.</span>
      </p>
    </div>

    <div
      v-if="errorMessage"
      class="p-3 rounded-xl bg-status-red/10 border border-status-red/30 text-xs text-status-red flex items-start gap-2"
    >
      <AppIcon name="alert-circle" :size="16" className="shrink-0 mt-0.5" />
      <span>{{ errorMessage }}</span>
    </div>

    <form class="space-y-4" @submit.prevent="handleSignIn">
      <Field
        label="Workspace"
        required
        hint="Your company subdomain (e.g. gammatools)"
      >
        <TextField
          v-model="workspaceSlug"
          placeholder="your-company"
          autocomplete="organization"
        >
          <template #prefix>
            <AppIcon name="building" :size="16" />
          </template>
          <template #suffix>
            <span class="text-xs font-mono text-ink-muted select-none">.localhost</span>
          </template>
        </TextField>
      </Field>

      <Field label="Work Email" required>
        <TextField
          v-model="email"
          type="email"
          placeholder="name@company.com"
          autocomplete="email"
        >
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
        <TextField
          v-model="password"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
        >
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

    <div class="text-center text-xs text-ink-muted pt-2 border-t border-stone-border">
      Don't have a workspace?
      <RouterLink to="/checkout" class="font-bold text-signal hover:underline ml-1">
        Set up a company
      </RouterLink>
    </div>
  </div>
</template>
