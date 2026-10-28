<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute, RouterLink, RouterView } from 'vue-router'
import { useSession } from '@/composables/useSession'
import { useAccess } from '@/composables/useAccess'
import { getStoredSiteName, getStoredSlug } from '@/services/frappeHttp'
import { ROLE_DEFINITIONS } from '@/data/roles'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import Toast from '@/components/common/Toast.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import CommandPalette from '@/components/layout/CommandPalette.vue'

const router = useRouter()
const route = useRoute()
const { currentUser, currentRole, currentOrg, signOut } = useSession()
const { can, canUseModule } = useAccess()

const mobileDrawerOpen = ref(false)
const userMenuOpen = ref(false)

const currentRoleInfo = computed(() => ROLE_DEFINITIONS[currentRole.value])

const workspaceAddress = computed(() => {
  if (currentOrg.value?.siteName) return currentOrg.value.siteName
  if (currentOrg.value?.slug) return `${currentOrg.value.slug}.localhost`
  const stored = getStoredSiteName()
  if (stored) return stored
  const slug = getStoredSlug()
  if (slug) return `${slug}.localhost`
  return ''
})

// Navigation Items with role and module visibility logic
interface NavItem {
  id: string
  label: string
  path: string
  icon: string
  visible: boolean
  badge?: string
  locked?: boolean
}

const salesNavItems = computed<NavItem[]>(() => [
  {
    id: 'rep_home',
    label: 'Sales Rep Today',
    path: '/app/sales',
    icon: 'home',
    visible: currentRole.value === 'sales_rep' || currentRole.value === 'sales_manager' || currentRole.value === 'admin',
  },
  {
    id: 'mgr_dash',
    label: 'Manager Dashboard',
    path: '/app/sales/dashboard',
    icon: 'dashboard',
    visible: currentRole.value === 'sales_manager' || currentRole.value === 'admin',
  },
  {
    id: 'customers',
    label: 'Customers',
    path: '/app/sales/customers',
    icon: 'users',
    visible: currentRole.value !== 'storekeeper',
  },
  {
    id: 'quotations',
    label: 'Quotations',
    path: '/app/sales/quotations',
    icon: 'file-text',
    visible: currentRole.value !== 'storekeeper' && currentRole.value !== 'accountant',
  },
  {
    id: 'orders',
    label: 'Sales Orders',
    path: '/app/sales/orders',
    icon: 'orders',
    visible: currentRole.value !== 'storekeeper' && currentRole.value !== 'accountant',
  },
  {
    id: 'deliveries',
    label: 'Deliveries',
    path: '/app/sales/deliveries',
    icon: 'truck',
    visible: currentRole.value === 'storekeeper' || currentRole.value === 'sales_manager' || currentRole.value === 'admin' || currentRole.value === 'sales_rep',
    badge: currentRole.value === 'storekeeper' ? 'Dispatch' : undefined,
  },
  {
    id: 'invoices',
    label: 'Invoices & Payments',
    path: '/app/sales/invoices',
    icon: 'invoices',
    visible: currentRole.value === 'accountant' || currentRole.value === 'sales_manager' || currentRole.value === 'admin',
  },
])

// Other modules in the company's ecosystem
const ecosystemModules = computed(() => [
  {
    key: 'inventory',
    label: 'Inventory & Stock',
    path: canUseModule('inventory') ? '/app/inventory' : '/app/locked/inventory',
    icon: 'inventory',
    active: canUseModule('inventory'),
  },
  {
    key: 'purchasing',
    label: 'Purchasing',
    path: canUseModule('purchasing') ? '/app/purchasing' : '/app/locked/purchasing',
    icon: 'purchasing',
    active: canUseModule('purchasing'),
  },
  {
    key: 'finance',
    label: 'Finance Ledger',
    path: canUseModule('finance') ? '/app/finance' : '/app/locked/finance',
    icon: 'finance',
    active: canUseModule('finance'),
  },
  {
    key: 'manufacturing',
    label: 'Manufacturing',
    path: canUseModule('manufacturing') ? '/app/manufacturing' : '/app/locked/manufacturing',
    icon: 'manufacturing',
    active: canUseModule('manufacturing'),
  },
])

const adminNavItems = computed<NavItem[]>(() => [
  {
    id: 'users',
    label: 'Team & Permissions',
    path: '/app/users',
    icon: 'user',
    visible: currentRole.value === 'admin',
  },
  {
    id: 'plan',
    label: 'Workspace Plan',
    path: '/app/plan',
    icon: 'credit-card',
    visible: currentRole.value === 'admin',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/app/settings',
    icon: 'settings',
    visible: true,
  },
  {
    id: 'help',
    label: 'Help & Support',
    path: '/app/help',
    icon: 'help-circle',
    visible: true,
  },
])

function handleSignOut() {
  signOut()
  router.push('/sign-in')
}

function triggerCommandPalette() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
}
</script>

<template>
  <div class="min-h-screen flex bg-stone-bg text-ink antialiased selection:bg-signal-subtle selection:text-signal">
    <!-- MOBILE BACKDROP -->
    <div
      v-if="mobileDrawerOpen"
      class="fixed inset-0 z-40 bg-ink-deep/60 backdrop-blur-xs lg:hidden"
      @click="mobileDrawerOpen = false"
    />

    <!-- SIDEBAR -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-ink-navy text-stone-bg/80 flex flex-col border-r border-ink-deep transition-transform duration-200 lg:translate-x-0',
        mobileDrawerOpen ? 'translate-x-0 shadow-modal' : '-translate-x-full',
      ]"
    >
      <!-- Organization Header -->
      <div class="p-4 border-b border-ink-deep/80 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2.5 group">
          <div class="w-8 h-8 rounded-lg bg-signal text-white flex items-center justify-center font-heading font-black text-base shadow-sm">
            A
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-bold text-white tracking-tight font-heading truncate">
              {{ currentOrg.name }}
            </span>
            <span v-if="workspaceAddress" class="text-[10px] text-signal font-mono font-medium truncate">
              {{ workspaceAddress }}
            </span>
            <span v-else class="text-[10px] text-stone-bg/50 uppercase tracking-wider font-semibold">
              Adadiko Hub • Frappe v16
            </span>
          </div>
        </RouterLink>

        <!-- Close button on mobile -->
        <button
          type="button"
          class="lg:hidden text-stone-bg/70 hover:text-white p-1 rounded-md"
          @click="mobileDrawerOpen = false"
        >
          <AppIcon name="x" :size="18" />
        </button>
      </div>

      <!-- Navigation Content -->
      <div class="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <!-- Sales Module Section -->
        <div>
          <div class="px-3 pb-2 flex items-center justify-between">
            <span class="text-[11px] font-bold uppercase tracking-wider text-stone-bg/40 font-heading">
              Sales Pipeline
            </span>
            <span class="w-2 h-2 rounded-full bg-signal" title="Live Module" />
          </div>

          <nav class="space-y-1">
            <template v-for="item in salesNavItems" :key="item.id">
              <RouterLink
                v-if="item.visible"
                :to="item.path"
                :class="[
                  'group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150',
                  route.path === item.path
                    ? 'bg-ink-deep text-white nav-active-pill font-semibold shadow-xs'
                    : 'text-stone-bg/70 hover:text-white hover:bg-ink-deep/50',
                ]"
                @click="mobileDrawerOpen = false"
              >
                <div class="flex items-center gap-3">
                  <AppIcon
                    :name="item.icon"
                    :size="16"
                    :className="route.path === item.path ? 'text-signal' : 'text-stone-bg/50 group-hover:text-white'"
                  />
                  <span>{{ item.label }}</span>
                </div>
                <Badge v-if="item.badge" variant="signal" size="sm">
                  {{ item.badge }}
                </Badge>
              </RouterLink>
            </template>
          </nav>
        </div>

        <!-- Ecosystem Modules -->
        <div>
          <div class="px-3 pb-2 flex items-center justify-between">
            <span class="text-[11px] font-bold uppercase tracking-wider text-stone-bg/40 font-heading">
              Other Modules
            </span>
            <RouterLink to="/app/plan" class="text-[10px] text-signal hover:underline">
              Add modules
            </RouterLink>
          </div>

          <nav class="space-y-1">
            <RouterLink
              v-for="m in ecosystemModules"
              :key="m.key"
              :to="m.path"
              :class="[
                'group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150',
                route.path.includes(m.key)
                  ? 'bg-ink-deep text-white nav-active-pill font-semibold'
                  : 'text-stone-bg/50 hover:text-stone-bg/80 hover:bg-ink-deep/40',
              ]"
              @click="mobileDrawerOpen = false"
            >
              <div class="flex items-center gap-3">
                <AppIcon :name="m.icon" :size="16" className="text-stone-bg/40" />
                <span>{{ m.label }}</span>
              </div>
              <span
                v-if="!m.active"
                class="px-1.5 py-0.5 rounded text-[10px] bg-stone-bg/10 text-stone-bg/50 border border-stone-bg/10"
              >
                Locked
              </span>
              <span
                v-else
                class="px-1.5 py-0.5 rounded text-[10px] bg-status-blue-bg/20 text-status-blue"
              >
                Preview
              </span>
            </RouterLink>
          </nav>
        </div>

        <!-- Administration & Settings -->
        <div>
          <div class="px-3 pb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-stone-bg/40 font-heading">
              Administration
            </span>
          </div>

          <nav class="space-y-1">
            <template v-for="item in adminNavItems" :key="item.id">
              <RouterLink
                v-if="item.visible"
                :to="item.path"
                :class="[
                  'group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150',
                  route.path === item.path
                    ? 'bg-ink-deep text-white nav-active-pill font-semibold'
                    : 'text-stone-bg/70 hover:text-white hover:bg-ink-deep/50',
                ]"
                @click="mobileDrawerOpen = false"
              >
                <div class="flex items-center gap-3">
                  <AppIcon
                    :name="item.icon"
                    :size="16"
                    :className="route.path === item.path ? 'text-signal' : 'text-stone-bg/50 group-hover:text-white'"
                  />
                  <span>{{ item.label }}</span>
                </div>
              </RouterLink>
            </template>

          </nav>
        </div>
      </div>

      <!-- Bottom User Profile Pill -->
      <div class="p-3 border-t border-ink-deep bg-ink-deep/40">
        <div class="p-2.5 rounded-xl bg-ink-navy border border-ink-deep flex items-center justify-between">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-ink-deep text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-ink-muted/30">
              {{ currentUser?.name.charAt(0) || 'U' }}
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold text-white truncate">
                {{ currentUser?.name }}
              </p>
              <p class="text-[10px] text-signal truncate">
                {{ currentRoleInfo.label }}
              </p>
            </div>
          </div>

          <button
            type="button"
            class="text-stone-bg/50 hover:text-white p-1.5 rounded-lg hover:bg-ink-deep transition-colors"
            title="Sign Out"
            @click="handleSignOut"
          >
            <AppIcon name="log-out" :size="16" />
          </button>
        </div>
      </div>
    </aside>

    <!-- MAIN APP CANVAS -->
    <div class="flex-1 flex flex-col min-w-0 lg:pl-64">
      <!-- TOP NAVIGATION BAR -->
      <header class="sticky top-0 z-20 h-16 bg-stone-bg/90 backdrop-blur-md border-b border-stone-border px-4 sm:px-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Mobile Hamburger -->
          <button
            type="button"
            class="lg:hidden p-2 rounded-lg text-ink hover:bg-stone-muted"
            aria-label="Open sidebar"
            @click="mobileDrawerOpen = true"
          >
            <AppIcon name="command" :size="20" />
          </button>

          <!-- Current Organization & Workspace Address -->
          <div class="hidden sm:flex items-center gap-2 text-xs">
            <span class="font-bold text-ink">{{ currentOrg.name }}</span>
            <span
              v-if="workspaceAddress"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-muted text-ink font-mono text-[11px] border border-stone-border"
            >
              <AppIcon name="building" :size="12" className="text-signal" />
              <span>{{ workspaceAddress }}</span>
            </span>
            <span class="text-stone-border">•</span>
            <span class="text-ink-muted">Plan: <strong class="uppercase text-ink">{{ currentOrg.plan }}</strong></span>
            <span class="text-stone-border">•</span>
            <Badge variant="neutral" size="sm">
              {{ currentRoleInfo.label }}
            </Badge>
          </div>
        </div>

        <div class="flex items-center gap-2.5 sm:gap-3">
          <!-- Command Palette Trigger Button (Ctrl+K) -->
          <button
            type="button"
            class="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-border rounded-xl text-xs text-ink-muted hover:border-signal hover:text-ink transition-colors shadow-2xs"
            @click="triggerCommandPalette"
          >
            <AppIcon name="search" :size="14" />
            <span class="hidden sm:inline">Search or jump to...</span>
            <kbd class="px-1.5 py-0.5 text-[10px] font-mono bg-stone-muted rounded text-ink-muted border border-stone-border">
              Ctrl+K
            </kbd>
          </button>

          <!-- Quick Action: New Order -->
          <RouterLink
            v-if="currentRole !== 'storekeeper' && currentRole !== 'accountant'"
            to="/app/sales/orders/new"
            class="hidden sm:inline-block"
          >
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl bg-signal text-white text-xs font-semibold hover:bg-[#DE782B] transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <AppIcon name="plus" :size="14" />
              <span>New Order</span>
            </button>
          </RouterLink>

          <!-- Public Website Shortcut -->
          <RouterLink
            to="/"
            target="_blank"
            class="p-2 text-ink-muted hover:text-ink rounded-lg hover:bg-stone-muted"
            title="Open Public Website"
          >
            <AppIcon name="external-link" :size="16" />
          </RouterLink>

          <!-- Theme Toggle (Light / Dark) -->
          <ThemeToggle />
        </div>
      </header>

      <!-- MAIN PAGE CONTENT VIEW -->
      <main class="flex-1 pb-16">
        <RouterView />
      </main>
    </div>

    <!-- Global Overlays -->
    <CommandPalette />
    <Toast />
  </div>
</template>
