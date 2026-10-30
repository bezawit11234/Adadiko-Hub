<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getAdminApi } from '@/services/admin'
import type { ClientCompany } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()
const route = useRoute()
const adminApi = getAdminApi()

const clients = ref<ClientCompany[]>([])
const loading = ref(true)
const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const selectedStatus = ref<'all' | 'active' | 'trial' | 'suspended'>('all')

watch(
  () => route.query.q,
  (newQ) => {
    if (typeof newQ === 'string') {
      searchQuery.value = newQ
    }
  }
)

const fetchClients = async () => {
  loading.value = true
  try {
    const res = await adminApi.listClients()
    if (res.ok && res.data) {
      clients.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchClients()
})

const filteredClients = computed(() => {
  return clients.value.filter((c) => {
    const matchesStatus = selectedStatus.value === 'all' || c.status === selectedStatus.value
    const q = searchQuery.value.toLowerCase().trim()
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      c.contactEmail.toLowerCase().includes(q) ||
      c.siteName.toLowerCase().includes(q)

    return matchesStatus && matchesSearch
  })
})

const getStatusBadge = (status: ClientCompany['status']) => {
  switch (status) {
    case 'active':
      return { variant: 'success' as const, label: 'Active' }
    case 'trial':
      return { variant: 'warning' as const, label: 'Trial' }
    case 'suspended':
      return { variant: 'danger' as const, label: 'Suspended' }
  }
}

const getPlanBadge = (plan: ClientCompany['plan']) => {
  switch (plan) {
    case 'enterprise':
      return { variant: 'accent' as const, label: 'Enterprise' }
    case 'growth':
      return { variant: 'info' as const, label: 'Growth' }
    case 'starter':
      return { variant: 'neutral' as const, label: 'Starter' }
  }
}

const openClient = (id: string) => {
  router.push(`/clients/${id}`)
}
</script>

<template>
  <PageContainer>
    <SectionHeading
      title="Client Organizations"
      description="Centrally provision, inspect, modify subscription tiers, and control access for all tenant companies."
    >
      <template #actions>
        <span class="text-xs font-mono text-ink-muted">
          Showing {{ filteredClients.length }} of {{ clients.length }} organizations
        </span>
      </template>
    </SectionHeading>

    <!-- Filters and Search Toolbar -->
    <div class="bg-stone-surface border border-stone-border rounded-2xl p-4 shadow-soft mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <!-- Status Filter Chips -->
      <div class="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
        <button
          type="button"
          @click="selectedStatus = 'all'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedStatus === 'all' ? 'bg-ink text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          All ({{ clients.length }})
        </button>
        <button
          type="button"
          @click="selectedStatus = 'active'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedStatus === 'active' ? 'bg-status-green text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          Active ({{ clients.filter(c => c.status === 'active').length }})
        </button>
        <button
          type="button"
          @click="selectedStatus = 'trial'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedStatus === 'trial' ? 'bg-status-amber text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          Trial ({{ clients.filter(c => c.status === 'trial').length }})
        </button>
        <button
          type="button"
          @click="selectedStatus = 'suspended'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedStatus === 'suspended' ? 'bg-status-red text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          Suspended ({{ clients.filter(c => c.status === 'suspended').length }})
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative w-full md:w-72">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-light">
          <AppIcon name="search" :size="16" />
        </div>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search company, contact, domain..."
          class="w-full pl-9 pr-3 py-1.5 bg-white text-xs text-ink rounded-xl border border-stone-border focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors"
        />
      </div>
    </div>

    <!-- Clients Table -->
    <div class="bg-stone-surface border border-stone-border rounded-2xl shadow-soft overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-stone-subtle/80 border-b border-stone-border text-ink-muted uppercase font-mono text-[11px] tracking-wider">
              <th class="py-3.5 px-4 font-semibold">Tenant Organization</th>
              <th class="py-3.5 px-4 font-semibold">Primary Contact</th>
              <th class="py-3.5 px-4 font-semibold">Plan Tier</th>
              <th class="py-3.5 px-4 font-semibold">Modules</th>
              <th class="py-3.5 px-4 font-semibold">Seats</th>
              <th class="py-3.5 px-4 font-semibold">Monthly Spend</th>
              <th class="py-3.5 px-4 font-semibold">Renewal Date</th>
              <th class="py-3.5 px-4 font-semibold">Status</th>
              <th class="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-border">
            <tr
              v-for="client in filteredClients"
              :key="client.id"
              class="hover:bg-stone-subtle/60 transition-colors group cursor-pointer"
              @click="openClient(client.id)"
            >
              <!-- Organization & Domain -->
              <td class="py-3.5 px-4">
                <div class="font-semibold text-ink group-hover:text-signal transition-colors text-sm">
                  {{ client.name }}
                </div>
                <div class="font-mono text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                  <AppIcon name="external-link" :size="12" />
                  <span>{{ client.siteName }}</span>
                </div>
              </td>

              <!-- Contact -->
              <td class="py-3.5 px-4">
                <div class="text-ink font-medium">{{ client.contactName }}</div>
                <div class="text-ink-muted text-[11px]">{{ client.contactEmail }}</div>
              </td>

              <!-- Plan -->
              <td class="py-3.5 px-4">
                <Badge :variant="getPlanBadge(client.plan).variant">
                  {{ getPlanBadge(client.plan).label }}
                </Badge>
              </td>

              <!-- Modules -->
              <td class="py-3.5 px-4">
                <span class="inline-flex items-center gap-1 font-mono text-ink-muted bg-stone-muted/60 px-2 py-0.5 rounded-md border border-stone-border/60">
                  <AppIcon name="catalog" :size="12" />
                  {{ client.modules.length }} modules
                </span>
              </td>

              <!-- Seats -->
              <td class="py-3.5 px-4 font-mono text-ink">
                {{ client.usersCount }} users
              </td>

              <!-- Spend -->
              <td class="py-3.5 px-4 font-mono font-medium text-ink">
                {{ formatCurrency(client.monthlySpend) }}/mo
              </td>

              <!-- Renewal -->
              <td class="py-3.5 px-4 text-ink-muted font-mono text-[11px]">
                {{ formatDate(client.renewalDate) }}
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <Badge :variant="getStatusBadge(client.status).variant">
                  {{ getStatusBadge(client.status).label }}
                </Badge>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right" @click.stop>
                <AppButton
                  variant="secondary"
                  size="sm"
                  @click="openClient(client.id)"
                >
                  Manage &rarr;
                </AppButton>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Loading Skeleton -->
        <div v-if="loading" class="p-6 space-y-3">
          <div v-for="i in 4" :key="i" class="h-10 bg-stone-muted/40 rounded-xl animate-pulse"></div>
        </div>
      </div>

      <!-- Empty State -->
      <EmptyState
        v-if="filteredClients.length === 0 && !loading"
        title="No tenant organizations found"
        description="Try adjusting your status filter or search query to find the client company."
        icon="building"
      >
        <template #action>
          <AppButton
            variant="secondary"
            size="sm"
            @click="selectedStatus = 'all'; searchQuery = ''"
          >
            Clear Filters
          </AppButton>
        </template>
      </EmptyState>
    </div>
  </PageContainer>
</template>
