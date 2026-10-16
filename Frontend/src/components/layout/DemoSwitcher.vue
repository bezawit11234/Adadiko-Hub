<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSession } from '@/composables/useSession'
import { useAccess } from '@/composables/useAccess'
import { ROLE_DEFINITIONS } from '@/data/roles'
import type { Role, ModuleKey } from '@/types'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'

const router = useRouter()
const { currentUser, currentRole, currentOrg, switchRole, toggleSubscribedModule, isDemoModeVisible } = useSession()
const { roleHomeRoute } = useAccess()

const isExpanded = ref(false)

const rolesList: Role[] = ['sales_manager', 'sales_rep', 'admin', 'accountant', 'storekeeper', 'adadiko_staff']
const modulesList: { key: ModuleKey; label: string }[] = [
  { key: 'sales', label: 'Sales' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'purchasing', label: 'Purchasing' },
  { key: 'finance', label: 'Finance' },
  { key: 'manufacturing', label: 'Manufacturing' },
]

function handleRoleChange(role: Role) {
  switchRole(role)
  // Auto-navigate to that role's default workspace
  if (role === 'adadiko_staff') {
    router.push('/admin')
  } else {
    router.push(roleHomeRoute.value)
  }
}
</script>

<template>
  <div v-if="isDemoModeVisible" class="fixed bottom-4 left-4 z-40 select-none">
    <!-- Collapsed Toggle Button -->
    <button
      v-if="!isExpanded"
      type="button"
      class="flex items-center gap-2 px-3 py-2 bg-ink-navy text-white text-xs font-semibold rounded-full shadow-lift border border-stone-border/20 hover:bg-ink-deep transition-all duration-200"
      @click="isExpanded = true"
    >
      <span class="w-2 h-2 rounded-full bg-signal animate-pulse" />
      <span>Demo Switcher</span>
      <Badge variant="signal" size="sm">
        {{ ROLE_DEFINITIONS[currentRole]?.label }}
      </Badge>
    </button>

    <!-- Expanded Switcher Panel -->
    <div
      v-else
      class="w-80 bg-white rounded-2xl border border-stone-border shadow-modal p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      <div class="flex items-center justify-between pb-2 border-b border-stone-border">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-signal" />
          <h4 class="text-xs font-bold uppercase tracking-wider text-ink font-heading">
            Manager Demo Switcher
          </h4>
        </div>
        <button
          type="button"
          class="text-ink-light hover:text-ink p-1 rounded-md"
          @click="isExpanded = false"
        >
          <AppIcon name="x" :size="14" />
        </button>
      </div>

      <!-- Role Selector -->
      <div>
        <label class="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
          Active Persona & Role
        </label>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="r in rolesList"
            :key="r"
            type="button"
            :class="[
              'text-left px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center justify-between',
              currentRole === r
                ? 'bg-signal-subtle border-signal text-signal font-bold'
                : 'bg-stone-subtle border-stone-border text-ink hover:bg-stone-muted',
            ]"
            @click="handleRoleChange(r)"
          >
            <span class="truncate">{{ ROLE_DEFINITIONS[r]?.label }}</span>
            <AppIcon v-if="currentRole === r" name="check" :size="12" />
          </button>
        </div>
        <p class="text-[11px] text-ink-light mt-1.5 italic">
          {{ ROLE_DEFINITIONS[currentRole]?.description }}
        </p>
      </div>

      <!-- Modules Active for Org -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Org Subscribed Modules
          </label>
          <span class="text-[10px] text-ink-light">Simulate locked routes</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="m in modulesList"
            :key="m.key"
            type="button"
            :class="[
              'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1',
              currentOrg.subscribedModules.includes(m.key)
                ? 'bg-ink-navy text-white border-ink-navy'
                : 'bg-stone-bg text-ink-light border-stone-border line-through',
            ]"
            @click="toggleSubscribedModule(m.key)"
          >
            <span>{{ m.label }}</span>
          </button>
        </div>
      </div>

      <div class="pt-2 border-t border-stone-border text-[11px] text-ink-light flex items-center justify-between">
        <span>Logged in as: <strong class="text-ink">{{ currentUser?.name }}</strong></span>
        <button
          type="button"
          class="text-signal hover:underline font-semibold"
          @click="isExpanded = false"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
