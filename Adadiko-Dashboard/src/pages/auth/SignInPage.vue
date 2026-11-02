<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSession } from '@/composables/useSession'
import { useToast } from '@/composables/useToast'
import AppButton from '@/components/common/AppButton.vue'
import TextField from '@/components/common/TextField.vue'

const router = useRouter()
const route = useRoute()
const { login } = useSession()
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
</script>

<template>
  <div class="space-y-6">
    <form @submit.prevent="handleSignIn" class="space-y-4">
      <TextField
        id="staff-email"
        label="Staff Work Email"
        v-model="email"
        placeholder="admin@adadiko.com"
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
  </div>
</template>
