<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSession } from '@/composables/useSession'
import { useToast } from '@/composables/useToast'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import TextField from '@/components/common/TextField.vue'

const router = useRouter()
const route = useRoute()
const { login } = useSession()
const { showToast } = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

function formatLoginError(err: any): string {
  // Keep the full error only in the browser console
  console.error('[Adadiko Auth Error]:', err)

  if (!err) {
    return 'Wrong email or password'
  }

  const errStr = typeof err === 'string' ? err : `${err.name || ''} ${err.message || ''}`
  const isNetwork =
    err.name === 'TypeError' ||
    errStr.includes('fetch') ||
    errStr.includes('NetworkError') ||
    errStr.includes('Failed to fetch') ||
    errStr.includes('Cannot reach') ||
    errStr.includes('ECONNREFUSED') ||
    err.status === 502 ||
    err.status === 503 ||
    err.status === 504 ||
    err.status === 0

  if (isNetwork) {
    return 'Cannot reach the server'
  }

  const raw = `${errStr} ${JSON.stringify(err.serverMessages || '')}`.toLowerCase()

  // Account disabled
  if (raw.includes('disabled') || raw.includes('deactivated') || raw.includes('inactive')) {
    return 'This account is disabled'
  }

  // Lacks Adadiko Staff role
  if (
    raw.includes('not an adadiko staff') ||
    raw.includes('staff role required') ||
    raw.includes('not a staff') ||
    raw.includes('no staff access') ||
    (err.status === 403 && raw.includes('access denied'))
  ) {
    return 'No staff access'
  }

  // Authentication error
  if (
    err.status === 401 ||
    raw.includes('invalid login') ||
    raw.includes('authentication') ||
    raw.includes('password') ||
    raw.includes('user not found') ||
    raw.includes('does not exist') ||
    raw.includes('credential')
  ) {
    return 'Wrong email or password'
  }

  // Fallback default
  return 'Wrong email or password'
}

const handleSignIn = async () => {
  errorMessage.value = ''
  if (!email.value.trim()) {
    errorMessage.value = 'Please enter your staff email.'
    return
  }

  loading.value = true
  try {
    const res = await login(email.value.trim(), password.value)
    if (res.ok) {
      showToast({ title: 'Signed In', message: `Welcome back, ${res.data?.name}`, type: 'success' })
      const redirect = (route.query.next as string) || '/overview'
      router.push(redirect)
    } else {
      const msg = formatLoginError(res.error)
      errorMessage.value = msg
      showToast({ title: 'Sign In Failed', message: msg, type: 'error' })
    }
  } catch (err: any) {
    const msg = formatLoginError(err)
    errorMessage.value = msg
    showToast({ title: 'Sign In Failed', message: msg, type: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Clean, human-readable error notification -->
    <div
      v-if="errorMessage"
      class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 shadow-2xs"
    >
      <AppIcon name="info" :size="16" class="text-rose-600 shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <form @submit.prevent="handleSignIn" class="space-y-4">
      <div>
        <label for="staff-email" class="block font-medium text-xs text-ink mb-1.5">
          Staff Work Email
        </label>
        <TextField
          id="staff-email"
          v-model="email"
          placeholder="admin@adadiko.com"
          autocomplete="email"
        />
      </div>

      <div>
        <label for="staff-password" class="block font-medium text-xs text-ink mb-1.5">
          Password
        </label>
        <TextField
          id="staff-password"
          type="password"
          v-model="password"
          placeholder="••••••••••••"
          autocomplete="current-password"
        />
      </div>

      <AppButton
        type="submit"
        variant="primary"
        class="w-full justify-center mt-2 font-semibold"
        :loading="loading"
      >
        Sign In to Dashboard
      </AppButton>
    </form>
  </div>
</template>
