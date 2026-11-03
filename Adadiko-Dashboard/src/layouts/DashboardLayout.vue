<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSession } from '@/composables/useSession'
import { useAccess } from '@/composables/useAccess'
import { useTheme } from '@/composables/useTheme'
import { useToast } from '@/composables/useToast'
import { getAdminApi } from '@/services/admin'
import AppIcon from '@/components/common/AppIcon.vue'
import type { StaffRole } from '@/types'

const router = useRouter()
const route = useRoute()
const adminApi = getAdminApi()
const { showToast } = useToast()
const { currentUser, currentRole, currentRoleMeta, logout } = useSession()
const { canAccessRoute } = useAccess()
const { currentTheme, toggleTheme, initTheme } = useTheme()

// Search query in top bar
const globalSearch = ref('')
const mobileMenuOpen = ref(false)

// Global refresh state
const isRefreshing = ref(false)

// Notifications state
interface PlatformNotification {
  id: string
  title: string
  message: string
  type: 'warning' | 'info' | 'danger'
  time: string
  link?: string
}

const notificationsOpen = ref(false)
const notifications = ref<PlatformNotification[]>([])
const unreadCount = computed(() => notifications.value.length)

const fetchNotifications = async () => {
  try {
    const res = await adminApi.getOverview()
    if (res.ok && res.data) {
      const list: PlatformNotification[] = []
      const needs = res.data.needsAttention || []
      needs.forEach((item) => {
        let nType: 'warning' | 'info' | 'danger' = 'warning'
        let title = 'Action Required'
        let msg = item.clientName

        if (item.type === 'overdue_payment') {
          nType = 'danger'
          title = 'Overdue Payment'
          msg = `${item.clientName} payment is overdue ($${item.amount || 0})`
        } else if (item.type === 'expiring_trial') {
          nType = 'warning'
          title = 'Expiring Trial'
          msg = `${item.clientName} trial expires in ${item.daysRemaining ?? 'few'} days`
        } else if (item.type === 'expiring_plan') {
          nType = 'info'
          title = 'Contract Renewal Due'
          msg = `${item.clientName} subscription renewal is due`
        }

        list.push({
          id: item.id || `${item.clientId}-${item.type}`,
          title,
          message: msg,
          type: nType,
          time: item.dueDate || 'Pending',
          link: `/clients/${item.clientId}`,
        })
      })

      notifications.value = list
    }
  } catch {
    // keep current notifications
  }
}

const handleGlobalRefresh = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    // Notify all active route components
    window.dispatchEvent(new CustomEvent('adadiko:refresh'))
    await fetchNotifications()
    showToast({
      title: 'Refreshed',
      message: 'Platform telemetry and active workspace data reloaded.',
      type: 'info',
    })
  } finally {
    setTimeout(() => {
      isRefreshing.value = false
    }, 600)
  }
}

const handleNotificationClick = (n: PlatformNotification) => {
  notificationsOpen.value = false
  if (n.link) {
    router.push(n.link)
  }
}

const clearNotifications = () => {
  notifications.value = []
  showToast({ title: 'Cleared', message: 'All notifications marked as read.', type: 'info' })
}

// Close notifications popover on click outside
const closeOnClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('#notification-bell-container')) {
    notificationsOpen.value = false
  }
}

onMounted(() => {
  initTheme()
  fetchNotifications()
  window.addEventListener('click', closeOnClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', closeOnClickOutside)
})

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
  { name: 'Staff Team', path: '/staff', icon: 'users', roles: ['admin', 'support', 'billing'] },
]

const visibleNavItems = computed(() => {
  return allNavItems.filter((item) => item.roles.includes(currentRole.value))
})

const userFirstName = computed(() => {
  if (!currentUser.value?.name) return 'Staff'
  return currentUser.value.name.split(' ')[0]
})

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
  <!-- Full Screen Frame with Warm Stone Background -->
  <div class="min-h-screen bg-stone-bg text-ink font-sans flex flex-col p-2 sm:p-4 lg:p-5 antialiased">
    <!-- Elevated Dashboard Window Card -->
    <div class="w-full flex-1 bg-stone-subtle border border-stone-border rounded-3xl shadow-card overflow-hidden flex flex-col lg:flex-row">
      
      <!-- ================= LEFT SIDEBAR ================= -->
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
                  {{ currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD' }}
                </div>
              </div>
              <!-- Online status dot -->
              <span class="absolute bottom-0 right-1 w-3.5 h-3.5 rounded-full bg-status-green border-2 border-ink-navy"></span>
            </div>

            <!-- Name and Email -->
            <h2 class="font-heading font-bold text-sm text-white tracking-tight">
              {{ currentUser?.name || 'Staff User' }}
            </h2>
            <p class="text-[11px] text-stone-bg/60 truncate max-w-[190px] mt-0.5">
              {{ currentUser?.email || '' }}
            </p>

            <!-- Role Badge -->
            <div class="mt-2.5">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold bg-white/10 text-stone-border border border-white/10">
                {{ currentRoleMeta?.label || 'Staff Member' }}
              </span>
            </div>
          </div>

          <!-- Vertical Navigation Links -->
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

        <!-- Bottom Section: Logout -->
        <div class="pt-5 border-t border-ink-muted/30">
          <button
            type="button"
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-stone-bg/70 hover:text-white hover:bg-ink-deep/50 transition-colors"
          >
            <AppIcon name="log-out" :size="16" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <!-- ================= MAIN CONTENT WORKSPACE ================= -->
      <div class="flex-1 flex flex-col min-w-0 bg-stone-bg overflow-y-auto max-h-[96vh]">
        
        <!-- TOP BAR -->
        <header class="px-6 lg:px-8 py-4.5 flex items-center justify-between gap-4 border-b border-stone-border bg-stone-bg/90 sticky top-0 z-20 backdrop-blur-md">
          <!-- Mobile Hamburger Toggle -->
          <button
            type="button"
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="lg:hidden p-2 rounded-xl bg-stone-surface border border-stone-border text-ink hover:bg-stone-muted"
            aria-label="Toggle navigation"
          >
            <AppIcon name="more-vertical" :size="18" />
          </button>

          <!-- Greeting Header -->
          <div>
            <h1 class="text-xl sm:text-2xl font-black font-heading text-ink tracking-tight">
              Welcome {{ userFirstName }} !
            </h1>
            <p class="text-xs text-ink-muted hidden sm:block">
              Adadiko Hub Staff Control Deck
            </p>
          </div>

          <!-- Topbar Right: Search Input + Theme Toggle + Bell -->
          <div class="flex items-center gap-3">
            <!-- Pill Search Bar -->
            <div class="relative w-48 sm:w-64">
              <input
                type="text"
                v-model="globalSearch"
                @keyup.enter="handleGlobalSearch"
                placeholder="Search..."
                class="w-full pl-4 pr-9 py-1.5 text-xs bg-stone-surface text-ink rounded-full border border-stone-border focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal shadow-2xs transition-colors"
              />
              <button
                type="button"
                @click="handleGlobalSearch"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-light hover:text-ink transition-colors"
              >
                <AppIcon name="search" :size="14" />
              </button>
            </div>

            <!-- Global Refresh Button -->
            <button
              type="button"
              @click="handleGlobalRefresh"
              class="w-8 h-8 rounded-full bg-stone-surface border border-stone-border flex items-center justify-center text-ink-muted hover:text-ink shadow-2xs cursor-pointer transition-colors"
              :disabled="isRefreshing"
              aria-label="Refresh platform data"
              title="Refresh live platform telemetry"
            >
              <AppIcon name="refresh" :size="14" :class="{ 'animate-spin text-signal': isRefreshing }" />
            </button>

            <!-- Theme Sun / Moon Toggle Button -->
            <button
              type="button"
              @click="toggleTheme"
              class="w-8 h-8 rounded-full bg-stone-surface border border-stone-border flex items-center justify-center text-ink-muted hover:text-ink shadow-2xs cursor-pointer transition-colors"
              :aria-label="currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
              :title="currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
            >
              <svg v-if="currentTheme === 'dark'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-signal">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ink">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </button>

            <!-- Notification Bell Icon & Dropdown -->
            <div id="notification-bell-container" class="relative">
              <button
                type="button"
                @click.stop="notificationsOpen = !notificationsOpen"
                class="w-8 h-8 rounded-full bg-stone-surface border border-stone-border flex items-center justify-center text-ink-muted hover:text-ink shadow-2xs cursor-pointer transition-colors relative"
                aria-label="Toggle notifications"
                title="Notifications &amp; Alerts"
              >
                <AppIcon name="bell" :size="15" />
                <span
                  v-if="unreadCount > 0"
                  class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-status-red text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse"
                >
                  {{ unreadCount > 9 ? '9+' : unreadCount }}
                </span>
              </button>

              <!-- Notifications Popover Card -->
              <div
                v-if="notificationsOpen"
                class="absolute right-0 mt-2 w-80 sm:w-96 bg-stone-surface rounded-2xl border border-stone-border shadow-modal z-50 overflow-hidden"
              >
                <div class="p-3.5 border-b border-stone-border flex items-center justify-between bg-stone-subtle/70">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-xs text-ink font-heading">System Notifications</span>
                    <span
                      v-if="unreadCount > 0"
                      class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-signal-subtle text-signal"
                    >
                      {{ unreadCount }} new
                    </span>
                  </div>
                  <button
                    v-if="unreadCount > 0"
                    type="button"
                    @click="clearNotifications"
                    class="text-[11px] text-ink-muted hover:text-signal transition-colors font-medium"
                  >
                    Mark all read
                  </button>
                </div>

                <!-- Notifications List -->
                <div class="max-h-72 overflow-y-auto divide-y divide-stone-border text-xs">
                  <div
                    v-if="notifications.length === 0"
                    class="p-6 text-center text-ink-muted"
                  >
                    <div class="w-8 h-8 rounded-full bg-stone-subtle mx-auto mb-2 flex items-center justify-center text-ink-muted">
                      <AppIcon name="bell" :size="14" />
                    </div>
                    <p class="font-semibold text-ink text-xs">No pending notifications</p>
                    <p class="text-[11px] text-ink-muted mt-0.5">All platform operations and tenant accounts are nominal.</p>
                  </div>

                  <div
                    v-for="n in notifications"
                    :key="n.id"
                    @click="handleNotificationClick(n)"
                    class="p-3 hover:bg-stone-subtle/80 transition-colors cursor-pointer flex items-start gap-3"
                  >
                    <div
                      class="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      :class="
                        n.type === 'danger'
                          ? 'bg-status-red'
                          : n.type === 'warning'
                          ? 'bg-status-amber'
                          : 'bg-signal'
                      "
                    ></div>
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-ink text-xs truncate">{{ n.title }}</div>
                      <p class="text-ink-muted text-[11px] mt-0.5 leading-snug line-clamp-2">{{ n.message }}</p>
                      <div class="text-[10px] font-mono text-ink-muted mt-1">{{ n.time }}</div>
                    </div>
                  </div>
                </div>

                <!-- Footer link to Activity Logs -->
                <div class="p-2 border-t border-stone-border bg-stone-subtle/50 text-center">
                  <router-link
                    to="/logs"
                    @click="notificationsOpen = false"
                    class="text-[11px] font-medium text-signal hover:underline inline-flex items-center gap-1"
                  >
                    View platform activity logs &rarr;
                  </router-link>
                </div>
              </div>
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
              Operating under <strong class="text-ink font-semibold">{{ currentRoleMeta?.label }}</strong>: {{ currentRoleMeta?.description }}
            </span>
          </div>
        </div>

        <!-- Scrollable Router View -->
        <main class="flex-1 p-4 sm:p-6 lg:p-7">
          <router-view />
        </main>

        <!-- Elegant Sub-footer -->
        <footer class="px-6 py-3 border-t border-stone-border text-[11px] text-ink-muted flex items-center justify-between bg-stone-bg">
          <span class="font-mono">Adadiko Dashboard &bull; Staff Back Office</span>
          <span class="font-mono">Adadiko Platform Control Site</span>
        </footer>
      </div>

    </div>
  </div>
</template>
