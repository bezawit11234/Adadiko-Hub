<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/common/AppIcon.vue'
import { useSession } from '@/composables/useSession'

const router = useRouter()
const { currentRole } = useSession()

const isOpen = ref(false)
const searchQuery = ref('')
const selectedIndex = ref(0)

interface CommandItem {
  id: string
  title: string
  subtitle: string
  icon: string
  route: string
  category: string
  requiredRole?: string
}

const commands: CommandItem[] = [
  { id: 'rep_home', title: 'Sales Rep Today', subtitle: 'Follow-ups, open orders, task list', icon: 'home', route: '/app/sales', category: 'Sales Work' },
  { id: 'mgr_dash', title: 'Manager Revenue Dashboard', subtitle: 'KPIs, trend chart, pipeline, approvals', icon: 'dashboard', route: '/app/sales/dashboard', category: 'Sales Work' },
  { id: 'new_order', title: 'New Sales Order', subtitle: 'Create a new order with live totals & stock warnings', icon: 'plus', route: '/app/sales/orders/new', category: 'Actions' },
  { id: 'customers', title: 'Customer Directory', subtitle: 'View accounts, balances owed, and timeline', icon: 'users', route: '/app/sales/customers', category: 'Sales Work' },
  { id: 'orders', title: 'Sales Orders List', subtitle: 'Track orders, delivery status, billing status', icon: 'orders', route: '/app/sales/orders', category: 'Sales Work' },
  { id: 'quotations', title: 'Quotations', subtitle: 'Draft and submitted quotes awaiting customer reply', icon: 'file-text', route: '/app/sales/quotations', category: 'Sales Work' },
  { id: 'deliveries', title: 'Deliveries & Dispatch', subtitle: 'Orders waiting for delivery and storekeeper queue', icon: 'truck', route: '/app/sales/deliveries', category: 'Fulfillment' },
  { id: 'invoices', title: 'Invoices & Payments', subtitle: 'Customer receivables, overdue accounts, record payments', icon: 'receipt', route: '/app/sales/invoices', category: 'Accounting' },
  { id: 'users', title: 'Team & Permissions', subtitle: 'Invite staff and manage sales role matrix', icon: 'user', route: '/app/users', category: 'Admin' },
  { id: 'plan', title: 'Workspace Modules & Plan', subtitle: 'Manage active subscriptions and monthly billing', icon: 'credit-card', route: '/app/plan', category: 'Admin' },
  { id: 'admin_hq', title: 'Adadiko Back Office', subtitle: 'Platform overview, client orgs, SaaS subscriptions', icon: 'shield', route: '/admin', category: 'Platform HQ' },
  { id: 'pub_home', title: 'Public Landing Page', subtitle: 'Visitor website and value proposition', icon: 'home', route: '/', category: 'Public' },
  { id: 'pub_products', title: 'Module Marketplace', subtitle: 'Browse Adadiko modular business suite', icon: 'catalog', route: '/products', category: 'Public' },
  { id: 'pub_pricing', title: 'Pricing & Plans', subtitle: 'Explore monthly and yearly business plans', icon: 'dollar-sign', route: '/pricing', category: 'Public' },
]

const filteredCommands = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return commands
  return commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query) ||
      c.subtitle.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query)
  )
})

function executeCommand(item: CommandItem) {
  isOpen.value = false
  searchQuery.value = ''
  router.push(item.route)
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    isOpen.value = !isOpen.value
    if (isOpen.value) {
      searchQuery.value = ''
      selectedIndex.value = 0
    }
  } else if (isOpen.value) {
    if (e.key === 'Escape') {
      isOpen.value = false
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedIndex.value = (selectedIndex.value + 1) % filteredCommands.value.length
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedIndex.value =
        (selectedIndex.value - 1 + filteredCommands.value.length) % filteredCommands.value.length
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = filteredCommands.value[selectedIndex.value]
      if (target) executeCommand(target)
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-ink-deep/60 backdrop-blur-xs"
      @click.self="isOpen = false"
    >
      <div
        class="w-full max-w-xl bg-white rounded-2xl border border-stone-border shadow-modal overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <!-- Search Input -->
        <div class="px-4 py-3.5 border-b border-stone-border flex items-center gap-3 bg-stone-bg/30">
          <AppIcon name="search" :size="18" className="text-ink-muted" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Type a screen, module, or action... (e.g. Orders, Invoices, Pricing)"
            class="w-full bg-transparent text-sm text-ink placeholder:text-ink-light focus:outline-none"
            autofocus
          />
          <kbd class="px-1.5 py-0.5 text-[10px] font-semibold bg-stone-muted border border-stone-border rounded text-ink-muted">
            ESC
          </kbd>
        </div>

        <!-- Command List -->
        <div class="max-h-96 overflow-y-auto p-2 divide-y divide-stone-border/40">
          <div v-if="filteredCommands.length === 0" class="py-8 text-center text-sm text-ink-muted">
            No matching screens or actions.
          </div>

          <div
            v-for="(item, idx) in filteredCommands"
            :key="item.id"
            :class="[
              'px-3 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors text-sm',
              idx === selectedIndex ? 'bg-signal-subtle text-ink font-semibold' : 'hover:bg-stone-bg text-ink',
            ]"
            @mouseenter="selectedIndex = idx"
            @click="executeCommand(item)"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border',
                  idx === selectedIndex
                    ? 'bg-signal text-white border-signal'
                    : 'bg-stone-bg text-ink-navy border-stone-border',
                ]"
              >
                <AppIcon :name="item.icon" :size="16" />
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">
                  {{ item.title }}
                </p>
                <p class="text-xs text-ink-muted truncate">
                  {{ item.subtitle }}
                </p>
              </div>
            </div>

            <div class="shrink-0 flex items-center gap-2">
              <span class="text-[11px] px-2 py-0.5 rounded bg-stone-muted text-ink-muted font-normal">
                {{ item.category }}
              </span>
              <AppIcon name="arrow-right" :size="14" className="text-ink-light" />
            </div>
          </div>
        </div>

        <!-- Footer Help -->
        <div class="px-4 py-2 bg-stone-subtle border-t border-stone-border flex items-center justify-between text-[11px] text-ink-muted">
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd> and <kbd>Enter</kbd></span>
          <span>Role: <strong class="text-ink">{{ currentRole }}</strong></span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
