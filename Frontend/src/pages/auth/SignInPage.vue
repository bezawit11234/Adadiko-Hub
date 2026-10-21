<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useSession } from '@/composables/useSession'
import { ROLE_DEFINITIONS } from '@/data/roles'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Field from '@/components/common/Field.vue'
import TextField from '@/components/common/TextField.vue'

const router = useRouter()
const route = useRoute()
const { signIn, apiMode, setApiMode } = useSession()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleSignIn() {
  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Enter the work email and password you created when you set up the workspace.'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const res = await signIn(email.value.trim(), password.value)
    if (res.ok && res.data) {
      const nextUrl =
        (route.query.next as string) ||
        ROLE_DEFINITIONS[res.data.role]?.defaultHome ||
        '/app/sales/dashboard'
      router.push(nextUrl)
    } else {
      errorMessage.value = res.error || 'Could not sign in. Check your email and password.'
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
        <span v-if="apiMode === 'frappe'">Connected to Frappe / ERPNext v16 backend.</span>
        <span v-else>Sign in with your workspace credentials.</span>
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

    <div class="text-center text-xs text-ink-muted pt-2 border-t border-stone-border">
      Don't have a workspace?
      <RouterLink to="/checkout" class="font-bold text-signal hover:underline ml-1">
        Set up a company
      </RouterLink>
    </div>
  </div>
</template>
