<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getAdminApi } from '@/services/admin'
import type { LogEntry } from '@/types'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const adminApi = getAdminApi()

const logs = ref<LogEntry[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedType = ref<'all' | 'sign_in' | 'plan_change' | 'suspension' | 'error' | 'staff_action'>('all')

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await adminApi.listLogs()
    if (res.ok && res.data) {
      logs.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLogs()
})

const filteredLogs = computed(() => {
  return logs.value.filter((l) => {
    const matchesType = selectedType.value === 'all' || l.type === selectedType.value
    const q = searchQuery.value.toLowerCase().trim()
    const matchesSearch =
      !q ||
      l.details.toLowerCase().includes(q) ||
      l.staffUserName.toLowerCase().includes(q) ||
      (l.clientCompanyName && l.clientCompanyName.toLowerCase().includes(q))

    return matchesType && matchesSearch
  })
})

const getLogBadge = (type: LogEntry['type']) => {
  switch (type) {
    case 'sign_in':
      return { variant: 'info' as const, label: 'Sign In' }
    case 'plan_change':
      return { variant: 'accent' as const, label: 'Plan Change' }
    case 'suspension':
      return { variant: 'danger' as const, label: 'Suspension' }
    case 'error':
      return { variant: 'danger' as const, label: 'System Error' }
    case 'staff_action':
      return { variant: 'neutral' as const, label: 'Staff Action' }
  }
}
</script>

<template>
  <PageContainer>
    <SectionHeading
      title="System Audit &amp; Activity Trail"
      description="Immutable event log of staff administrative decisions, plan revisions, workspace suspensions, and system errors."
    >
      <template #actions>
        <span class="text-xs font-mono text-ink-muted">
          Showing {{ filteredLogs.length }} of {{ logs.length }} audit events
        </span>
      </template>
    </SectionHeading>

    <!-- Filters & Search Toolbar -->
    <div class="bg-stone-surface border border-stone-border rounded-2xl p-4 shadow-soft mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
        <button
          type="button"
          @click="selectedType = 'all'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedType === 'all' ? 'bg-ink text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          All ({{ logs.length }})
        </button>
        <button
          type="button"
          @click="selectedType = 'sign_in'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedType === 'sign_in' ? 'bg-status-blue text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          Sign Ins
        </button>
        <button
          type="button"
          @click="selectedType = 'plan_change'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedType === 'plan_change' ? 'bg-signal text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          Plan Changes
        </button>
        <button
          type="button"
          @click="selectedType = 'suspension'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedType === 'suspension' ? 'bg-status-red text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          Suspensions
        </button>
        <button
          type="button"
          @click="selectedType = 'staff_action'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedType === 'staff_action' ? 'bg-ink text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          Staff Actions
        </button>
        <button
          type="button"
          @click="selectedType = 'error'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedType === 'error' ? 'bg-status-red text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          Errors
        </button>
      </div>

      <div class="relative w-full md:w-72">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-light">
          <AppIcon name="search" :size="16" />
        </div>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search activity, staff, details..."
          class="w-full pl-9 pr-3 py-1.5 bg-stone-surface text-xs text-ink rounded-xl border border-stone-border focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors"
        />
      </div>
    </div>

    <!-- Logs Table -->
    <div class="bg-stone-surface border border-stone-border rounded-2xl shadow-soft overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-stone-subtle/80 border-b border-stone-border text-ink-muted uppercase font-mono text-[11px] tracking-wider">
              <th class="py-3.5 px-4 font-semibold">Timestamp</th>
              <th class="py-3.5 px-4 font-semibold">Event Type</th>
              <th class="py-3.5 px-4 font-semibold">Staff Operator</th>
              <th class="py-3.5 px-4 font-semibold">Target Tenant</th>
              <th class="py-3.5 px-4 font-semibold">Action &amp; Details</th>
              <th class="py-3.5 px-4 font-semibold text-right">IP Origin</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-border">
            <tr
              v-for="log in filteredLogs"
              :key="log.id"
              class="hover:bg-stone-subtle/60 transition-colors"
            >
              <td class="py-3.5 px-4 font-mono text-ink-muted text-[11px] whitespace-nowrap">
                {{ log.timestamp }}
              </td>

              <td class="py-3.5 px-4">
                <Badge :variant="getLogBadge(log.type).variant">
                  {{ getLogBadge(log.type).label }}
                </Badge>
              </td>

              <td class="py-3.5 px-4 font-medium text-ink whitespace-nowrap">
                {{ log.staffUserName }}
              </td>

              <td class="py-3.5 px-4 font-medium text-ink whitespace-nowrap">
                {{ log.clientCompanyName || '—' }}
              </td>

              <td class="py-3.5 px-4 text-ink leading-relaxed">
                {{ log.details }}
              </td>

              <td class="py-3.5 px-4 font-mono text-ink-muted text-[11px] text-right whitespace-nowrap">
                {{ log.ipAddress || '127.0.0.1' }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Loading Skeleton -->
        <div v-if="loading" class="p-6 space-y-3">
          <div v-for="i in 4" :key="i" class="h-10 bg-stone-muted/40 rounded-xl animate-pulse"></div>
        </div>
      </div>

      <EmptyState
        v-if="filteredLogs.length === 0 && !loading"
        title="No audit entries found"
        description="Try adjusting your filter options or search query."
        icon="file-text"
      />
    </div>
  </PageContainer>
</template>
