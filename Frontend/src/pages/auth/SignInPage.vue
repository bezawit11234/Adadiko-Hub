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
const { setUser } = useSession()
const authApi = getAuthApi()

const email = ref('sarah.mgr@adadiko.demo')
const password = ref('••••••••')
const loading = ref(false)
const errorMessage = ref('')

async function handleSignIn() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await authApi.signIn(email.value, password.value)
    if (res.ok && res.data) {
      setUser(res.data)
      const nextUrl = (route.query.next as string) || (res.data.role === 'adadiko_staff' ? '/admin' : ROLE_DEFINITIONS[res.data.role].defaultHome)
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
</script>

<template>
  <div class="space-y-6">
    <div class="text-center space-y-1">
      <h2 class="text-2xl font-black text-ink font-heading">
        Sign in to your workspace
      </h2>
      <p class="text-xs text-ink-muted">
        Enter your company credentials to access your modules.
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

    <!-- Quick Demo Accounts Switcher -->
    <div class="pt-4 border-t border-stone-border space-y-3">
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
