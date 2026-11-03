<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAdminApi } from '@/services/admin'
import { useToast } from '@/composables/useToast'
import type { AdminOverview, ClientCompany } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/format'
import StatCard from '@/components/common/StatCard.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const router = useRouter()
const adminApi = getAdminApi()
const { showToast } = useToast()

const overview = ref<AdminOverview | null>(null)
const clients = ref<ClientCompany[]>([])
const ordersCount = ref<number>(0)
const loading = ref(true)

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const [ovRes, cliRes, ordRes] = await Promise.all([
      adminApi.getOverview(),
      adminApi.listClients(),
      adminApi.listOrders(),
    ])
    if (ovRes.ok && ovRes.data) {
      overview.value = ovRes.data
    }
    if (cliRes.ok && cliRes.data) {
      clients.value = cliRes.data
    }
    if (ordRes.ok && ordRes.data) {
      ordersCount.value = ordRes.data.length
    }
  } finally {
    loading.value = false
  }
}

const handleManualRefresh = async () => {
  await fetchDashboardData()
  showToast({
    title: 'Refreshed',
    message: 'Dashboard telemetry and metrics updated.',
    type: 'info',
  })
}

onMounted(() => {
  fetchDashboardData()
  window.addEventListener('adadiko:refresh', fetchDashboardData)
})

onUnmounted(() => {
  window.removeEventListener('adadiko:refresh', fetchDashboardData)
})

const totalSeats = computed(() => {
  return clients.value.reduce((acc, c) => acc + (c.usersCount || 0), 0)
})

const topClientsBySpend = computed(() => {
  return [...clients.value]
    .sort((a, b) => (b.monthlySpend || 0) - (a.monthlySpend || 0))
    .slice(0, 6)
})

const maxClientSpend = computed(() => {
  if (topClientsBySpend.value.length === 0) return 500
  return Math.max(...topClientsBySpend.value.map((c) => c.monthlySpend || 0)) || 500
})

const totalClientsCount = computed(() => overview.value?.activeClients || clients.value.length || 0)

// Dynamic SVG Donut Segments
const donutSegments = computed(() => {
  const list = overview.value?.clientsByPlan || []
  const total = list.reduce((acc, p) => acc + p.count, 0) || 1
  const circumference = 238.76
  let cumulativeOffset = 0

  return list.map((item, idx) => {
    const length = (item.count / total) * circumference
    const strokeDasharray = `${length.toFixed(2)} ${(circumference - length).toFixed(2)}`
    const strokeDashoffset = (-cumulativeOffset).toFixed(2)
    cumulativeOffset += length

    const strokeColor =
      idx === 0
        ? 'var(--color-signal-orange)'
        : idx === 1
        ? 'var(--color-ink-navy)'
        : idx === 2
        ? 'var(--color-status-green)'
        : 'var(--color-ink-muted)'

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      strokeColor,
    }
  })
})

// Dynamic Signups Area Chart
const signupsData = computed(() => {
  return overview.value?.signupsOverTime || []
})

const maxSignups = computed(() => {
  const counts = signupsData.value.map((d) => d.signups)
  return Math.max(...counts, 4)
})

const chartPoints = computed(() => {
  const data = signupsData.value
  if (data.length === 0) return []
  const width = 500
  const height = 110
  const startX = 65
  const startY = 145
  const stepX = width / (data.length - 1 || 1)

  return data.map((d, idx) => {
    const x = startX + idx * stepX
    const y = startY - (d.signups / maxSignups.value) * height
    return {
      x,
      y,
      month: d.month.split(' ')[0],
      fullMonth: d.month,
      signups: d.signups,
    }
  })
})

const chartPathD = computed(() => {
  const points = chartPoints.value
  if (points.length === 0) return ''
  let d = `M ${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cX = (prev.x + curr.x) / 2
    d += ` C ${cX},${prev.y} ${cX},${curr.y} ${curr.x},${curr.y}`
  }
  return d
})

const chartAreaD = computed(() => {
  const lineD = chartPathD.value
  const points = chartPoints.value
  if (!lineD || points.length === 0) return ''
  const last = points[points.length - 1]
  const first = points[0]
  return `${lineD} L ${last.x},155 L ${first.x},155 Z`
})

const peakPoint = computed(() => {
  if (chartPoints.value.length === 0) return null
  return [...chartPoints.value].sort((a, b) => b.signups - a.signups)[0]
})

const navigateToClient = (clientId: string) => {
  router.push(`/clients/${clientId}`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header: Overview -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-black font-heading text-ink tracking-tight">
        Platform Overview
      </h2>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="handleManualRefresh"
          :disabled="loading"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-stone-surface border border-stone-border text-ink-muted hover:text-ink hover:border-signal transition-colors shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
          title="Refresh dashboard metrics"
        >
          <AppIcon name="refresh" :size="13" :class="{ 'animate-spin text-signal': loading }" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- ================= ROW 1: 4 STAT CARDS ================= -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Card 1: Total Clients -->
      <StatCard
        label="Total Clients"
        :value="overview ? formatNumber(overview.activeClients) : '0'"
        icon="building"
        variant="success"
      />

      <!-- Card 2: Orders -->
      <StatCard
        label="Orders"
        :value="formatNumber(ordersCount)"
        icon="orders"
        variant="info"
      />

      <!-- Card 3: Monthly Run Rate -->
      <StatCard
        label="Monthly Run Rate"
        :value="overview ? formatCurrency(overview.mrr) : formatCurrency(0)"
        icon="trending-up"
        variant="success"
      />

      <!-- Card 4: Action Items Required -->
      <StatCard
        label="Needs Attention"
        :value="overview ? formatNumber(overview.needsAttention.length) : '0'"
        icon="alert-triangle"
        variant="signal"
        has-info-badge
      />
    </div>

    <!-- ================= ROW 2: 3 WIDGETS ================= -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      <!-- Widget 1: Total Users -->
      <div class="lg:col-span-3 bg-stone-surface rounded-2xl border border-stone-border p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-bold text-ink font-heading">Total Users</span>
          <AppIcon name="users" :size="16" class="text-ink-muted" />
        </div>

        <div class="my-auto py-2">
          <div class="w-12 h-12 rounded-2xl bg-status-blue-bg text-status-blue flex items-center justify-center mb-3 border border-status-blue/15">
            <AppIcon name="users" :size="22" />
          </div>
          <div class="text-3xl font-black font-heading text-ink tracking-tight num-tabular">
            {{ totalSeats }} Seats
          </div>
          <div class="text-xs text-ink-muted mt-1 font-medium">
            Provisioned Client Seats
          </div>
        </div>

        <div class="pt-3 border-t border-stone-border/60 text-[11px] text-ink-light flex items-center justify-between">
          <span>Active Clients</span>
          <span class="text-status-green font-semibold">{{ totalClientsCount }} Workspaces</span>
        </div>
      </div>

      <!-- Widget 2: Dynamic Plan Distribution Donut Chart -->
      <div class="lg:col-span-4 bg-stone-surface rounded-2xl border border-stone-border p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-ink font-heading">Plan Distribution</span>
          <span class="text-[11px] text-ink-light font-mono">{{ donutSegments.length }} Tiers</span>
        </div>

        <div class="flex items-center justify-around gap-2 my-auto py-2">
          <!-- SVG Donut Chart with Dynamic Segments -->
          <div class="relative w-32 h-32 shrink-0">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <!-- Base Circle Track -->
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="var(--color-stone-muted)"
                stroke-width="18"
              />
              <!-- Dynamic Plan Segments -->
              <circle
                v-for="seg in donutSegments"
                :key="seg.plan"
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                :stroke="seg.strokeColor"
                stroke-width="18"
                :stroke-dasharray="seg.strokeDasharray"
                :stroke-dashoffset="seg.strokeDashoffset"
                class="transition-all duration-500"
              />
            </svg>
            <!-- Center Text -->
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span class="text-xl font-black font-heading text-ink leading-none">{{ totalClientsCount }}</span>
              <span class="text-[9px] uppercase tracking-wider text-ink-muted mt-0.5 font-bold">Active</span>
            </div>
          </div>

          <!-- Dynamic Donut Legend -->
          <div class="space-y-2 text-xs">
            <div
              v-for="planItem in donutSegments"
              :key="planItem.plan"
              class="flex items-center gap-2"
            >
              <span
                class="w-3.5 h-3.5 rounded-md shrink-0"
                :style="{ backgroundColor: planItem.strokeColor }"
              ></span>
              <div>
                <div class="font-medium text-ink capitalize">{{ planItem.plan }}</div>
                <div class="text-[10px] text-ink-muted font-mono">
                  {{ planItem.count }} client{{ planItem.count === 1 ? '' : 's' }} ({{ Math.round(planItem.percentage) }}%)
                </div>
              </div>
            </div>
            <div v-if="donutSegments.length === 0" class="text-xs text-ink-muted italic">
              No active plan subscriptions.
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-stone-border/60 text-[11px] text-ink-light flex items-center justify-between">
          <span>Monthly Recurring Revenue</span>
          <span class="font-bold text-ink font-mono">{{ formatCurrency(overview?.mrr || 0) }} / mo</span>
        </div>
      </div>

      <!-- Widget 3: Top Clients by Revenue -->
      <div class="lg:col-span-5 bg-stone-surface rounded-2xl border border-stone-border p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold text-ink font-heading">Top Clients by Revenue</span>
          <span class="text-[11px] text-ink-light font-mono">Monthly spend</span>
        </div>

        <!-- Horizontal Bar Chart -->
        <div class="space-y-2.5 my-auto">
          <div
            v-for="client in topClientsBySpend"
            :key="client.id"
            class="flex items-center gap-2 text-xs group cursor-pointer"
            @click="navigateToClient(client.id)"
          >
            <!-- Client Label -->
            <span class="w-28 truncate text-[11px] text-ink font-medium group-hover:text-signal transition-colors">
              {{ client.name }}
            </span>

            <!-- Horizontal Bar Track -->
            <div class="flex-1 bg-stone-muted rounded-full h-3 overflow-hidden">
              <div
                class="h-full rounded-full bg-ink group-hover:bg-signal transition-all duration-300"
                :style="{ width: `${Math.max(8, Math.round(((client.monthlySpend || 0) / maxClientSpend) * 100))}%` }"
              ></div>
            </div>

            <!-- Value -->
            <span class="w-20 text-right font-mono text-[11px] font-bold text-ink-muted group-hover:text-ink">
              {{ formatCurrency(client.monthlySpend || 0) }}
            </span>
          </div>

          <div v-if="topClientsBySpend.length === 0" class="py-6 text-center text-xs text-ink-muted italic">
            No client spend recorded.
          </div>
        </div>

        <div class="pt-3 border-t border-stone-border/60 text-[11px] text-ink-light flex items-center justify-between">
          <span>Top Client:</span>
          <span class="font-bold text-ink font-mono">
            {{ topClientsBySpend[0]?.name || 'None' }} ({{ formatCurrency(topClientsBySpend[0]?.monthlySpend || 0) }})
          </span>
        </div>
      </div>

    </div>

    <!-- ================= ROW 3: CLIENT ONBOARDING TRENDS & ACTION ITEMS ================= -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      <!-- Chart Area: Client Growth Over Time -->
      <div class="lg:col-span-8 bg-stone-surface rounded-2xl border border-stone-border p-5 shadow-soft hover:shadow-card transition-all">
        <div class="flex items-center justify-between mb-4">
          <div>
            <span class="text-xs font-bold text-ink font-heading">Client Growth &amp; Registrations</span>
            <p class="text-[11px] text-ink-muted">Monthly newly registered tenant organizations over the past 6 months</p>
          </div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-muted/60 border border-stone-border text-[11px] font-medium text-ink-muted">
            <span>Last 6 months</span>
          </div>
        </div>

        <!-- Dynamic Real SVG Curve Chart -->
        <div class="w-full h-52 relative">
          <svg class="w-full h-full" viewBox="0 0 600 180" preserveAspectRatio="none">
            <defs>
              <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--color-signal-orange)" stop-opacity="0.25" />
                <stop offset="100%" stop-color="var(--color-signal-orange)" stop-opacity="0.0" />
              </linearGradient>
            </defs>

            <!-- Dotted Horizontal Grid Lines -->
            <line x1="40" y1="35" x2="580" y2="35" stroke="var(--color-stone-border)" stroke-dasharray="3,3" />
            <text x="32" y="39" fill="var(--color-ink-light)" font-size="10" text-anchor="end">{{ maxSignups }}</text>

            <line x1="40" y1="75" x2="580" y2="75" stroke="var(--color-stone-border)" stroke-dasharray="3,3" />
            <text x="32" y="79" fill="var(--color-ink-light)" font-size="10" text-anchor="end">{{ Math.round(maxSignups * 0.66) }}</text>

            <line x1="40" y1="115" x2="580" y2="115" stroke="var(--color-stone-border)" stroke-dasharray="3,3" />
            <text x="32" y="119" fill="var(--color-ink-light)" font-size="10" text-anchor="end">{{ Math.round(maxSignups * 0.33) }}</text>

            <!-- Base Ground Line -->
            <line x1="40" y1="155" x2="580" y2="155" stroke="var(--color-stone-border)" />

            <!-- Dynamic Gradient Area Fill -->
            <path
              v-if="chartAreaD"
              :d="chartAreaD"
              fill="url(#growthGrad)"
            />

            <!-- Dynamic Bezier Curve -->
            <path
              v-if="chartPathD"
              :d="chartPathD"
              fill="none"
              stroke="var(--color-signal-orange)"
              stroke-width="3"
              stroke-linecap="round"
            />

            <!-- Data Points -->
            <g v-for="pt in chartPoints" :key="pt.month">
              <circle
                :cx="pt.x"
                :cy="pt.y"
                r="4.5"
                fill="var(--color-signal-orange)"
                stroke="var(--color-stone-surface)"
                stroke-width="2"
              />
              <text :x="pt.x" y="172" fill="var(--color-ink-light)" font-size="10" text-anchor="middle">
                {{ pt.month }}
              </text>
            </g>

            <!-- Peak Callout Badge (Only shown if peak > 0) -->
            <g v-if="peakPoint && peakPoint.signups > 0" :transform="`translate(${peakPoint.x - 38}, ${Math.max(10, peakPoint.y - 28)})`">
              <rect x="0" y="0" width="76" height="18" rx="4" fill="var(--color-signal-orange)" />
              <text x="38" y="12" fill="#FFFFFF" font-size="9" font-weight="bold" text-anchor="middle">
                {{ peakPoint.signups }} Signups
              </text>
              <line x1="38" y1="18" x2="38" y2="24" stroke="var(--color-signal-orange)" stroke-width="1.5" />
            </g>
          </svg>
        </div>
      </div>

      <!-- Attention Items -->
      <div class="lg:col-span-4 bg-stone-surface rounded-2xl border border-stone-border p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span
                class="w-2.5 h-2.5 rounded-full"
                :class="(overview?.needsAttention.length || 0) > 0 ? 'bg-status-red animate-pulse' : 'bg-status-green'"
              ></span>
              <span class="text-xs font-bold text-ink font-heading">Action Items</span>
            </div>
            <span
              class="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
              :class="(overview?.needsAttention.length || 0) > 0 ? 'bg-status-red-bg text-status-red' : 'bg-status-green-bg text-status-green'"
            >
              {{ overview?.needsAttention.length || 0 }} flagged
            </span>
          </div>

          <!-- Real Action Items List -->
          <div class="space-y-2.5" v-if="overview && overview.needsAttention.length > 0">
            <div
              v-for="item in overview.needsAttention"
              :key="item.id"
              class="p-2.5 rounded-xl border border-stone-border hover:border-signal/50 bg-stone-subtle transition-colors cursor-pointer"
              @click="navigateToClient(item.clientId)"
            >
              <div class="flex items-center justify-between">
                <span class="font-semibold text-xs text-ink truncate">{{ item.clientName }}</span>
                <span
                  class="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold"
                  :class="item.type === 'overdue_payment' ? 'bg-status-red-bg text-status-red' : 'bg-status-amber-bg text-status-amber'"
                >
                  {{ item.type.replace('_', ' ') }}
                </span>
              </div>
              <div class="text-[11px] text-ink-muted mt-1 flex items-center justify-between">
                <span v-if="item.amount">Due: {{ formatCurrency(item.amount) }}</span>
                <span v-else>Due: {{ item.dueDate }}</span>
                <span class="text-signal font-semibold">Manage &rarr;</span>
              </div>
            </div>
          </div>

          <!-- Empty State when All Good -->
          <div v-else class="my-auto py-8 text-center">
            <div class="w-10 h-10 mx-auto rounded-full bg-status-green-bg text-status-green flex items-center justify-center mb-2">
              <AppIcon name="check" :size="18" />
            </div>
            <p class="text-xs font-semibold text-ink">All Systems Operational</p>
            <p class="text-[11px] text-ink-muted mt-0.5">No flagged accounts or overdue payments.</p>
          </div>
        </div>

        <button
          type="button"
          @click="router.push('/clients')"
          class="w-full mt-3 py-2 text-center text-xs font-medium text-ink-muted hover:text-ink bg-stone-muted/70 hover:bg-stone-muted rounded-xl transition-colors"
        >
          View All Tenant Organizations &rarr;
        </button>
      </div>

    </div>
  </div>
</template>
