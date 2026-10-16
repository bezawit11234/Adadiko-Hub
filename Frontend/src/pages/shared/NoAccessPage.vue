<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useSession } from '@/composables/useSession'
import { useAccess } from '@/composables/useAccess'
import { ROLE_DEFINITIONS } from '@/data/roles'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'

const router = useRouter()
const { currentRole, switchRole } = useSession()
const { roleHomeRoute } = useAccess()

const currentRoleInfo = computed(() => ROLE_DEFINITIONS[currentRole.value])
</script>

<template>
  <PageContainer max-width="md">
    <div class="bg-white rounded-3xl border border-stone-border shadow-card p-8 sm:p-12 text-center space-y-6">
      <div class="w-16 h-16 rounded-2xl bg-status-red-bg text-status-red mx-auto flex items-center justify-center">
        <AppIcon name="lock" :size="32" />
      </div>

      <div class="space-y-2">
        <Badge variant="danger" size="sm">Permission Restricted</Badge>
        <h1 class="text-2xl sm:text-3xl font-black text-ink font-heading">
          Access Restricted for Your Role
        </h1>
        <p class="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
          You are signed in as <strong class="text-ink">{{ currentRoleInfo.label }}</strong>. This screen is restricted by role permissions in your organization's policy matrix.
        </p>
      </div>

      <div class="p-4 rounded-2xl bg-stone-bg border border-stone-border text-xs text-ink-muted text-left space-y-2 max-w-sm mx-auto">
        <div class="flex justify-between">
          <span>Active Role:</span>
          <strong class="text-ink">{{ currentRoleInfo.label }}</strong>
        </div>
        <div class="flex justify-between">
          <span>ERPNext Role Equivalent:</span>
          <span class="font-mono text-signal">{{ currentRoleInfo.erpnextRole }}</span>
        </div>
        <p class="pt-1 border-t border-stone-border text-[11px] text-ink-light italic">
          In production, access enforcement is executed on the Frappe server.
        </p>
      </div>

      <div class="pt-4 flex flex-wrap items-center justify-center gap-3">
        <RouterLink :to="roleHomeRoute">
          <AppButton variant="primary" size="md">
            Go to Your Work Home
          </AppButton>
        </RouterLink>
        <AppButton variant="outline" size="md" @click="switchRole('admin')">
          Switch to Company Admin
        </AppButton>
      </div>
    </div>
  </PageContainer>
</template>
