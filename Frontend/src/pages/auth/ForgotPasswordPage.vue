<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getAuthApi } from '@/services/auth'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Field from '@/components/common/Field.vue'
import TextField from '@/components/common/TextField.vue'

const email = ref('')
const submitted = ref(false)
const loading = ref(false)
const authApi = getAuthApi()

async function handleReset() {
  loading.value = true
  try {
    await authApi.forgotPassword(email.value)
    submitted.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center space-y-1">
      <h2 class="text-2xl font-black text-ink font-heading">
        Reset password
      </h2>
      <p class="text-xs text-ink-muted">
        We'll send password recovery instructions to your email.
      </p>
    </div>

    <div v-if="submitted" class="p-4 rounded-xl bg-status-green-bg border border-status-green/20 text-center space-y-2">
      <div class="w-8 h-8 rounded-full bg-status-green text-white mx-auto flex items-center justify-center">
        <AppIcon name="check" :size="16" />
      </div>
      <p class="text-xs font-bold text-ink">Reset instructions sent!</p>
      <p class="text-xs text-ink-muted">Please check {{ email }} for the password recovery link.</p>
    </div>

    <form v-else class="space-y-4" @submit.prevent="handleReset">
      <Field label="Work Email Address" required>
        <TextField v-model="email" type="email" placeholder="name@company.com" />
      </Field>

      <AppButton variant="primary" size="md" block :loading="loading" type="submit">
        Send Reset Link
      </AppButton>
    </form>

    <div class="text-center text-xs">
      <RouterLink to="/sign-in" class="text-signal hover:underline font-semibold">
        ← Back to sign in
      </RouterLink>
    </div>
  </div>
</template>
