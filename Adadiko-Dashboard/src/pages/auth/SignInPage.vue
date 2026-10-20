<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSession } from '@/composables/useSession'
import { useToast } from '@/composables/useToast'
import { DEMO_STAFF } from '@/data/roles'
import type { StaffRole } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import TextField from '@/components/common/TextField.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'

const router = useRouter()
const route = useRoute()
const { login, loginAsDemo } = useSession()
const { showToast } = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)

const handleSignIn = async () => {
  if (!email.value) {
    showToast({ title: 'Validation Error', message: 'Please enter your staff email.', type: 'error' })
    return
  }

  loading.value = true
  try {
    const res = await login(email.value, password.value)
    if (res.ok) {
      showToast({ title: 'Signed In', message: `Welcome back, ${res.data?.name}`, type: 'success' })
      const redirect = (route.query.next as string) || '/overview'
      router.push(redirect)
    } else {
      showToast({ title: 'Sign In Failed', message: res.error || 'Invalid staff credentials.', type: 'error' })
    }
  } finally {
    loading.value = false
  }
}

const handleQuickDemo = async (role: StaffRole) => {
  await loginAsDemo(role)
  const staff = DEMO_STAFF[role]
  showToast({
    title: 'Demo Access Granted',
    message: `Signed in as ${staff.name} (${role.toUpperCase()})`,
    type: 'info',
  })
  const redirect = (route.query.next as string) || '/overview'
  router.push(redirect)
}
</script>

<template>
  <div class="space-y-6">
    <form @submit.prevent="handleSignIn" class="space-y-4">
      <TextField
        id="staff-email"
        label="Staff Work Email"
        v-model="email"
        placeholder="elena.admin@adadiko.internal"
        autocomplete="email"
      />

      <TextField
        id="staff-password"
        label="Password"
        type="password"
        v-model="password"
        placeholder="••••••••••••"
        autocomplete="current-password"
      />

      <AppButton
        type="submit"
        variant="primary"
        class="w-full justify-center mt-2"
        :loading="loading"
      >
        Sign In to Dashboard
      </AppButton>
    </form>

    <!-- Quick Demo Accounts -->
    <div class="pt-4 border-t border-stone-border">
      <p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
        1-Click Demo Profiles:
      </p>

      <div class="space-y-2">
        <button
          type="button"
          @click="handleQuickDemo('admin')"
          class="w-full flex items-center justify-between p-2.5 rounded-xl border border-stone-border bg-stone-subtle hover:bg-stone-muted/50 transition-colors text-left text-xs group"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-signal/15 text-signal flex items-center justify-center font-bold">
              ER
            </div>
            <div>
              <div class="font-medium text-ink group-hover:text-signal transition-colors">
                Elena Rostova
              </div>
              <div class="text-[11px] text-ink-muted">Full Control &bull; Admin</div>
            </div>
          </div>
          <Badge variant="accent">Admin</Badge>
        </button>

        <button
          type="button"
          @click="handleQuickDemo('support')"
          class="w-full flex items-center justify-between p-2.5 rounded-xl border border-stone-border bg-stone-subtle hover:bg-stone-muted/50 transition-colors text-left text-xs group"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              SO
            </div>
            <div>
              <div class="font-medium text-ink group-hover:text-status-blue transition-colors">
                Sam O'Connor
              </div>
              <div class="text-[11px] text-ink-muted">Read-Only Diagnostics &bull; Support</div>
            </div>
          </div>
          <Badge variant="neutral">Support</Badge>
        </button>

        <button
          type="button"
          @click="handleQuickDemo('billing')"
          class="w-full flex items-center justify-between p-2.5 rounded-xl border border-stone-border bg-stone-subtle hover:bg-stone-muted/50 transition-colors text-left text-xs group"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              FG
            </div>
            <div>
              <div class="font-medium text-ink group-hover:text-status-green transition-colors">
                Fiona Gallagher
              </div>
              <div class="text-[11px] text-ink-muted">Subscriptions &amp; Orders &bull; Billing</div>
            </div>
          </div>
          <Badge variant="success">Billing</Badge>
        </button>
      </div>
    </div>
  </div>
</template>
