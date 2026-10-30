<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSession } from '@/composables/useSession'
import { useAccess } from '@/composables/useAccess'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import type { StaffRole } from '@/types'

const router = useRouter()
const route = useRoute()
const { currentUser, currentRole, currentRoleMeta, apiMode, switchRole, setApiMode, logout } = useSession()
const { canAccessRoute } = useAccess()

// Search query in top bar
const globalSearch = ref('')
const mobileMenuOpen = ref(false)

interface NavItem {
  name: string
  path: string
  icon: string
  roles: StaffRole[]
}

const allNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/overview', icon: 'dashboard', roles: ['admin', 'support', 'billing'] },
  { name: 'Clients', path: '/clients', icon: 'building', roles: ['admin', 'support'] },
  { name: 'Orders', path: '/orders', icon: 'orders', roles: ['admin', 'billing'] },
  { name: 'Subscriptions', path: '/subscriptions', icon: 'receipt', roles: ['admin', 'billing'] },
  { name: 'Catalog', path: '/catalog', icon: 'catalog', roles: ['admin'] },
  { name: 'Audit Logs', path: '/logs', icon: 'file-text', roles: ['admin', 'support'] },
  { name: 'Staff Team', path: '/staff', icon: 'users', roles: ['admin'] },
]

const visibleNavItems = computed(() => {
  return allNavItems.filter((item) => item.roles.includes(currentRole.value))
})

const userFirstName = computed(() => {
  if (!currentUser.value?.name) return 'Staff'
  return currentUser.value.name.split(' ')[0]
})

const handleRoleChange = (role: StaffRole) => {
  switchRole(role)
  if (!canAccessRoute(route.path)) {
    router.push('/overview')
  }
}

const toggleApiMode = () => {
  const nextMode = apiMode.value === 'mock' ? 'frappe' : 'mock'
  setApiMode(nextMode)
}

const handleLogout = async () => {
  await logout()
  router.push('/sign-in')
}

const handleGlobalSearch = () => {
  if (!globalSearch.value.trim()) return
  router.push({
    path: '/clients',
    query: { q: globalSearch.value.trim() },
  })
}
</script>

<template>
  <!-- Full Screen Frame with Warm Stone Background (identical to Frontend) -->
  <div class="min-h-screen bg-stone-bg text-ink font-sans flex flex-col p-2 sm:p-4 lg:p-5 antialiased">
    <!-- Elevated Dashboard Window Card -->
    <div class="w-full flex-1 bg-stone-subtle border border-stone-border rounded-3xl shadow-card overflow-hidden flex flex-col lg:flex-row">
      
      <!-- ================= LEFT SIDEBAR (Deep Navy #14283D - exactly like Frontend) ================= -->
      <aside
        :class="[
          'bg-ink-navy text-white w-full lg:w-64 shrink-0 flex flex-col justify-between p-5 transition-all duration-300 z-30 border-r border-ink-deep',
          mobileMenuOpen ? 'block' : 'hidden lg:flex'
        ]"
      >
        <!-- Top Section: User Profile & Brand -->
        <div>
          <!-- User Profile Card -->
          <div class="flex flex-col items-center text-center pb-5 border-b border-ink-muted/30">
            <!-- Circular Avatar -->
            <div class="relative mb-3 group">
              <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-signal to-amber-400 p-0.5 shadow-md">
                <div class="w-full h-full rounded-full bg-ink-deep flex items-center justify-center font-heading font-black text-white text-xl border-2 border-ink-navy">
                  {{ currentUser?.name.split(' ').map(n => n[0]).join('') || 'AD' }}
                </div>
              </div>
              <!-- Online status dot -->
              <span class="absolute bottom-0 right-1 w-3.5 h-3.5 rounded-full bg-status-green border-2 border-ink-navy"></span>
            </div>

            <!-- Name and Email -->
            <h2 class="font-heading font-bold text-sm text-white tracking-tight">
              {{ currentUser?.name || 'Elena Rostova' }}
            </h2>
            <p class="text-[11px] text-stone-bg/60 truncate max-w-[190px] mt-0.5">
              {{ currentUser?.email || 'elena.admin@adadiko.internal' }}
            </p>

            <!-- Role Badge -->
            <div class="mt-2.5">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold bg-white/10 text-stone-border border border-white/10">
                {{ currentRoleMeta?.label || 'Adadiko Admin' }}
              </span>
            </div>
          </div>

          <!-- Vertical Navigation Links with Frontend's nav-active-pill and Signal line -->
          <nav class="mt-5 space-y-1" aria-label="Sidebar Navigation">
            <router-link
              v-for="item in visibleNavItems"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group"
              :class="
                $route.path === item.path || ($route.path.startsWith(item.path + '/') && item.path !== '/overview')
                  ? 'bg-ink-deep text-white nav-active-pill font-bold shadow-xs'
                  : 'text-stone-bg/70 hover:text-white hover:bg-ink-deep/50'
              "
              @click="mobileMenuOpen = false"
            >
              <AppIcon
                :name="item.icon"
                :size="16"
                :class="
                  $route.path === item.path || ($route.path.startsWith(item.path + '/') && item.path !== '/overview')
                    ? 'text-signal'
                    : 'text-stone-bg/50 group-hover:text-white'
                "
              />
              <span class="tracking-wide">{{ item.name }}</span>
            </router-link>
          </nav>
        </div>

        <!-- Bottom Section: Role Switcher & Logout -->
        <div class="pt-5 border-t border-ink-muted/30 space-y-3.5">
          <!-- Role Switcher Pill Container (Demo Only) -->
          <div v-if="apiMode !== 'frappe'" class="bg-ink-deep/50 rounded-xl p-2 border border-ink-deep">
            <div class="text-[10px] font-mono text-stone-bg/60 uppercase tracking-wider px-1 mb-1 flex items-center justify-between">
              <span>Demo Profile</span>
              <span class="text-signal font-bold">{{ currentRole.toUpperCase() }}</span>
            </div>
            <div class="grid grid-cols-3 gap-1">
              <button
                type="button"
                @click="handleRoleChange('admin')"
                :class="[
                  'py-1 text-[11px] font-medium rounded-lg transition-colors',
                  currentRole === 'admin'
                    ? 'bg-signal text-white font-bold'
                    : 'text-stone-bg/70 hover:bg-ink-deep hover:text-white'
                ]"
              >
                Admin
              </button>
              <button
                type="button"
                @click="handleRoleChange('support')"
                :class="[
                  'py-1 text-[11px] font-medium rounded-lg transition-colors',
                  currentRole === 'support'
                    ? 'bg-status-blue text-white font-bold'
                    : 'text-stone-bg/70 hover:bg-ink-deep hover:text-white'
                ]"
              >
                Support
              </button>
              <button
                type="button"
                @click="handleRoleChange('billing')"
                :class="[
                  'py-1 text-[11px] font-medium rounded-lg transition-colors',
                  currentRole === 'billing'
                    ? 'bg-status-green text-white font-bold'
                    : 'text-stone-bg/70 hover:bg-ink-deep hover:text-white'
                ]"
              >
                Billing
              </button>
            </div>
          </div>

          <!-- Logout Button -->
          <button
            type="button"
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-bg/70 hover:text-white hover:bg-ink-deep/50 transition-colors"
          >
            <AppIcon name="log-out" :size="16" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <!-- ================= MAIN CONTENT WORKSPACE ================= -->
      <div class="flex-1 flex flex-col min-w-0 bg-stone-bg overflow-y-auto max-h-[96vh]">
        
        <!-- TOP BAR (Warm Stone with blur border like Frontend) -->
        <header class="px-6 lg:px-8 py-4.5 flex items-center justify-between gap-4 border-b border-stone-border bg-stone-bg/90 sticky top-0 z-20 backdrop-blur-md">
          <!-- Mobile Hamburger Toggle -->
          <button
            type="button"
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="lg:hidden p-2 rounded-xl bg-white border border-stone-border text-ink hover:bg-stone-muted"
            aria-label="Toggle navigation"
          >
            <AppIcon name="more-vertical" :size="18" />
          </button>

          <!-- Greeting Header (Welcome Elena !) -->
          <div>
            <h1 class="text-xl sm:text-2xl font-black font-heading text-ink tracking-tight">
              Welcome {{ userFirstName }} !
            </h1>
            <p class="text-xs text-ink-muted hidden sm:block">
              Adadiko Hub Control Deck &bull; ERPNext v16 Engine
            </p>
          </div>

          <!-- Topbar Right: Search Input + Mode Pill + Bell -->
          <div class="flex items-center gap-3">
            <!-- Pill Search Bar (Matching image with stone border and white bg) -->
            <div class="relative w-48 sm:w-64">
              <input
                type="text"
                v-model="globalSearch"
                @keyup.enter="handleGlobalSearch"
                placeholder="Search..."
                class="w-full pl-4 pr-9 py-1.5 text-xs bg-white text-ink rounded-full border border-stone-border focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal shadow-2xs transition-colors"
              />
              <button
                type="button"
                @click="handleGlobalSearch"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-light hover:text-ink transition-colors"
              >
                <AppIcon name="search" :size="14" />
              </button>
            </div>

            <!-- Mode Toggle Pill -->
            <button
              type="button"
              @click="toggleApiMode"
              class="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono border transition-all shadow-2xs cursor-pointer"
              :class="
                apiMode === 'frappe'
                  ? 'bg-status-green-bg text-status-green border-status-green/30'
                  : 'bg-white text-signal border-signal/30'
              "
              :title="'Switch mode (current: ' + apiMode.toUpperCase() + ')'"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="apiMode === 'frappe' ? 'bg-status-green' : 'bg-signal'"
              ></span>
              <span>{{ apiMode === 'frappe' ? 'ERPNext' : 'Mock' }}</span>
            </button>

            <!-- Notification Bell Icon -->
            <div class="w-8 h-8 rounded-full bg-white border border-stone-border flex items-center justify-center text-ink-muted hover:text-ink shadow-2xs cursor-pointer">
              <AppIcon name="bell" :size="15" />
            </div>
          </div>
        </header>

        <!-- Role Context Banner (For non-admin roles) -->
        <div
          v-if="currentRole !== 'admin'"
          class="bg-signal-subtle border-b border-signal/20 px-6 py-2 text-xs text-ink flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <AppIcon name="shield" :size="14" className="text-signal" />
            <span>
              Operating under <strong class="text-ink font-semibold">{{ currentRoleMeta.label }}</strong>: {{ currentRoleMeta.description }}
            </span>
          </div>
          <button
            @click="handleRoleChange('admin')"
            class="text-signal font-bold hover:underline shrink-0 ml-4"
          >
            Switch to Admin &rarr;
          </button>
        </div>

        <!-- Scrollable Router View -->
        <main class="flex-1 p-4 sm:p-6 lg:p-7">
          <router-view />
        </main>

        <!-- Elegant Sub-footer -->
        <footer class="px-6 py-3 border-t border-stone-border text-[11px] text-ink-muted flex items-center justify-between bg-stone-bg">
          <span class="font-mono">Adadiko Dashboard &bull; Staff Back Office</span>
          <span class="font-mono">Connected Site: control.localhost</span>
        </footer>
      </div>

    </div>
  </div>
</template>
