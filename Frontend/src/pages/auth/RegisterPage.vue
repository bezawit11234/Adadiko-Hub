<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useSession } from '@/composables/useSession'
import { getAuthApi } from '@/services/auth'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Field from '@/components/common/Field.vue'
import TextField from '@/components/common/TextField.vue'

const router = useRouter()
const { setUser } = useSession()
const authApi = getAuthApi()

const name = ref('')
const company = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)

async function handleRegister() {
  loading.value = true
  try {
    const res = await authApi.register(name.value, email.value, company.value)
    if (res.ok && res.data) {
      setUser(res.data)
      router.push('/app/sales/dashboard')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center space-y-1">
      <h2 class="text-2xl font-black text-ink font-heading">
        Create an organization
      </h2>
      <p class="text-xs text-ink-muted">
        Set up a new isolated Frappe v16 workspace for your company.
      </p>
    </div>

    <form class="space-y-4" @submit.prevent="handleRegister">
      <Field label="Your Full Name" required>
        <TextField v-model="name" placeholder="e.g. Alex Morgan" />
      </Field>

      <Field label="Company Name" required>
        <TextField v-model="company" placeholder="e.g. Skyline Logistics Ltd" />
      </Field>

      <Field label="Work Email" required>
        <TextField v-model="email" type="email" placeholder="alex@skylinelogistics.example" />
      </Field>

      <Field label="Create Password" required>
        <TextField v-model="password" type="password" placeholder="Minimum 8 characters" />
      </Field>

      <AppButton variant="primary" size="md" block :loading="loading" type="submit">
        <span>Create Workspace & Start Trial</span>
        <AppIcon name="arrow-right" :size="16" />
      </AppButton>
    </form>

    <div class="text-center text-xs text-ink-muted">
      Already have an account?
      <RouterLink to="/sign-in" class="font-bold text-signal hover:underline ml-1">
        Sign In
      </RouterLink>
    </div>
  </div>
</template>
