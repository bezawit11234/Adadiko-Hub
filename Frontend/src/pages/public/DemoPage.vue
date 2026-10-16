<script setup lang="ts">
import { useRouter } from 'vue-router'
import { DEMO_USERS, ROLE_DEFINITIONS } from '@/data/roles'
import { useSession } from '@/composables/useSession'
import { useAccess } from '@/composables/useAccess'
import type { Role } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'

const router = useRouter()
const { setUser } = useSession()
const { roleHomeRoute } = useAccess()

function loginAsRole(role: Role) {
  const user = DEMO_USERS[role]
  setUser(user)
  if (role === 'adadiko_staff') {
    router.push('/admin')
  } else {
    router.push(ROLE_DEFINITIONS[role].defaultHome)
  }
}

const roleCards: { role: Role; icon: string; highlight: string }[] = [
  { role: 'sales_rep', icon: 'home', highlight: 'Daily follow-up tasks, instant order generation, customer balance check' },
  { role: 'sales_manager', icon: 'dashboard', highlight: 'Revenue targets, weekly trend charts, team performance, order approvals' },
  { role: 'admin', icon: 'user', highlight: 'Full workspace permissions, invite team members, adjust subscribed modules' },
  { role: 'accountant', icon: 'invoices', highlight: 'Invoices & receivables oversight, record incoming customer payments (read-only orders)' },
  { role: 'storekeeper', icon: 'truck', highlight: 'Dedicated delivery note fulfillment queue and packing slips dispatch' },
  { role: 'adadiko_staff', icon: 'shield', highlight: 'Platform operator portal: client organizations, subscriptions, and system audit logs' },
]
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
    <div class="text-center max-w-2xl mx-auto space-y-3">
      <Badge variant="signal" size="sm">Evaluation Mode</Badge>
      <h1 class="text-3xl sm:text-4xl font-black text-ink font-heading tracking-tight">
        Test Adadiko Next with Preloaded Roles
      </h1>
      <p class="text-sm text-ink-muted">
        Select any persona below to immediately launch the app shell with realistic sample data and role-based access rules.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="item in roleCards"
        :key="item.role"
        class="bg-white rounded-3xl border border-stone-border p-6 shadow-soft flex flex-col justify-between hover:shadow-card transition-all"
      >
        <div class="space-y-4">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-stone-bg border border-stone-border flex items-center justify-center text-ink-navy">
              <AppIcon :name="item.icon" :size="24" />
            </div>
            <Badge variant="signal" size="sm">Demo account</Badge>
          </div>

          <div>
            <h3 class="text-lg font-bold text-ink font-heading">
              {{ ROLE_DEFINITIONS[item.role].label }}
            </h3>
            <p class="text-xs text-signal font-semibold">
              ERPNext: {{ ROLE_DEFINITIONS[item.role].erpnextRole }}
            </p>
            <p class="text-xs text-ink-muted mt-2 leading-relaxed">
              {{ item.highlight }}
            </p>
          </div>

          <div class="p-3 rounded-xl bg-stone-subtle border border-stone-border text-xs text-ink-muted">
            <p><strong>Demo User:</strong> {{ DEMO_USERS[item.role].name }}</p>
            <p class="font-mono text-[11px] text-ink-light truncate">{{ DEMO_USERS[item.role].email }}</p>
          </div>
        </div>

        <div class="pt-6 mt-6 border-t border-stone-border">
          <AppButton
            variant="primary"
            size="md"
            block
            @click="loginAsRole(item.role)"
          >
            <span>Launch as {{ ROLE_DEFINITIONS[item.role].label }}</span>
            <AppIcon name="arrow-right" :size="16" />
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
