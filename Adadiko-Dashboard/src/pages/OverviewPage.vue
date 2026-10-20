<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAdminApi } from '@/services/admin'
import type { AdminOverview, ClientCompany } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/format'
import StatCard from '@/components/common/StatCard.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'

const router = useRouter()
const adminApi = getAdminApi()

const overview = ref<AdminOverview | null>(null)
const clients = ref<ClientCompany[]>([])
const loading = ref(true)

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const [ovRes, cliRes] = await Promise.all([
      adminApi.getOverview(),
      adminApi.listClients(),
    ])
    if (ovRes.ok && ovRes.data) {
      overview.value = ovRes.data
    }
    if (cliRes.ok && cliRes.data) {
      clients.value = cliRes.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
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

const navigateToClient = (clientId: string) => {
  router.push(`/clients/${clientId}`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header: Over View -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-black font-heading text-ink tracking-tight">
        Over View
      </h2>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="fetchDashboardData"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-border text-ink-muted hover:text-ink hover:border-signal transition-colors shadow-2xs"
        >
          <AppIcon name="refresh" :size="13" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- ================= ROW 1: 4 STAT CARDS (Frontend Theme) ================= -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Card 1: Total Clients -->
      <StatCard
        label="Total Clients"
        :value="overview ? formatNumber(overview.activeClients) : '5'"
        icon="building"
        variant="success"
      />

      <!-- Card 2: Orders -->
      <StatCard
        label="Orders"
        value="6"
        icon="orders"
        variant="info"
      />

      <!-- Card 3: Monthly Run Rate -->
      <StatCard
        label="Monthly Run Rate"
        :value="overview ? formatCurrency(overview.mrr) : '$1,616'"
        icon="trending-up"
        variant="success"
      />

      <!-- Card 4: Highlighted Orange Accent Card (Needs Attention in Signal Orange) -->
      <StatCard
        label="Needs Attention"
        :value="overview ? formatNumber(overview.needsAttention.length) : '3'"
        icon="alert-triangle"
        variant="signal"
        has-info-badge
      />
    </div>

    <!-- ================= ROW 2: 3 WIDGETS (Frontend Colors) ================= -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      <!-- Widget 1: No of users (Left Column, lg:col-span-3) -->
      <div class="lg:col-span-3 bg-white rounded-2xl border border-stone-border p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-bold text-ink font-heading">No of users</span>
          <button type="button" class="text-ink-light hover:text-ink">
            <AppIcon name="more-vertical" :size="15" />
          </button>
        </div>

        <div class="my-auto py-2">
          <!-- User icon in light blue circular box -->
          <div class="w-12 h-12 rounded-2xl bg-status-blue-bg text-status-blue flex items-center justify-center mb-3 border border-status-blue/15">
            <AppIcon name="users" :size="22" />
          </div>
          <div class="text-3xl font-black font-heading text-ink tracking-tight num-tabular">
            {{ totalSeats }} Seats
          </div>
          <div class="text-xs text-ink-muted mt-1 font-medium">
            Total Provisioned Seats
          </div>
        </div>

        <div class="pt-3 border-t border-stone-border/60 text-[11px] text-ink-light flex items-center justify-between">
          <span>Active in 6 tenants</span>
          <span class="text-status-green font-semibold">&bull; 100% SLA</span>
        </div>
      </div>

      <!-- Widget 2: Plan Distribution Donut Chart (Center, lg:col-span-4) -->
      <div class="lg:col-span-4 bg-white rounded-2xl border border-stone-border p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-ink font-heading">Plan Distribution</span>
          <span class="text-[11px] text-ink-light font-mono">3 Tiers</span>
        </div>

        <div class="flex items-center justify-around gap-2 my-auto py-2">
          <!-- SVG Donut Chart with Frontend Color Tokens -->
          <div class="relative w-32 h-32 shrink-0">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <!-- Background Circle (Stone Muted #EFECE5) -->
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#EFECE5"
                stroke-width="18"
              />
              <!-- Growth Tier (50%, Deep Navy #14283D) -->
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#14283D"
                stroke-width="18"
                stroke-dasharray="119.38 238.76"
                stroke-dashoffset="0"
              />
              <!-- Enterprise Tier (33%, Ink Muted #4C6175) -->
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#4C6175"
                stroke-width="18"
                stroke-dasharray="78.79 238.76"
                stroke-dashoffset="-119.38"
              />
              <!-- Starter Tier (17%, Signal Orange #F08A3C) -->
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#F08A3C"
                stroke-width="18"
                stroke-dasharray="40.59 238.76"
                stroke-dashoffset="-198.17"
              />
            </svg>
            <!-- Center Text -->
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span class="text-lg font-black font-heading text-ink leading-none">68%</span>
              <span class="text-[9px] uppercase tracking-wider text-ink-muted mt-0.5 font-bold">Growth</span>
            </div>
          </div>

          <!-- Donut Legend with Frontend Tokens -->
          <div class="space-y-2 text-xs">
            <div class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 rounded-md bg-ink shrink-0"></span>
              <div>
                <div class="font-medium text-ink">Growth Plan</div>
                <div class="text-[10px] text-ink-muted font-mono">3 tenants (50%)</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 rounded-md bg-ink-muted shrink-0"></span>
              <div>
                <div class="font-medium text-ink">Enterprise</div>
                <div class="text-[10px] text-ink-muted font-mono">2 tenants (33%)</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 rounded-md bg-signal shrink-0"></span>
              <div>
                <div class="font-medium text-ink">Starter Tier</div>
                <div class="text-[10px] text-ink-muted font-mono">1 tenant (17%)</div>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-stone-border/60 text-[11px] text-ink-light flex items-center justify-between">
          <span>MRR Velocity</span>
          <span class="font-bold text-ink font-mono">$1,616 / mo</span>
        </div>
      </div>

      <!-- Widget 3: Top Clients by Revenue (Right Column, lg:col-span-5) -->
      <div class="lg:col-span-5 bg-white rounded-2xl border border-stone-border p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold text-ink font-heading">Top Clients by MRR</span>
          <span class="text-[11px] text-ink-light font-mono">Monthly spend</span>
        </div>

        <!-- Horizontal Bar Chart with Navy & Signal Orange hover -->
        <div class="space-y-2.5 my-auto">
          <div
            v-for="client in topClientsBySpend"
            :key="client.id"
            class="flex items-center gap-2 text-xs group cursor-pointer"
            @click="navigateToClient(client.id)"
          >
            <!-- Store / Client Label -->
            <span class="w-28 truncate text-[11px] text-ink font-medium group-hover:text-signal transition-colors">
              {{ client.name }}
            </span>

            <!-- Horizontal Pill Bar with Stone track & Navy bar -->
            <div class="flex-1 bg-stone-muted rounded-full h-3 overflow-hidden">
              <div
                class="h-full rounded-full bg-ink group-hover:bg-signal transition-all duration-300"
                :style="{ width: `${Math.max(12, Math.round(((client.monthlySpend || 0) / maxClientSpend) * 100))}%` }"
              ></div>
            </div>

            <!-- Value Label -->
            <span class="w-14 text-right font-mono text-[11px] font-bold text-ink-muted group-hover:text-ink">
              ${{ client.monthlySpend }}
            </span>
          </div>
        </div>

        <div class="pt-3 border-t border-stone-border/60 text-[11px] text-ink-light flex items-center justify-between">
          <span>Top Contributor:</span>
          <span class="font-bold text-ink font-mono">Horizon Solar ($485)</span>
        </div>
      </div>

    </div>

    <!-- ================= ROW 3: DUAL AREA CHART (Expense vs Profit / MRR vs Signups) ================= -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      <!-- Chart Area (lg:col-span-8) -->
      <div class="lg:col-span-8 bg-white rounded-2xl border border-stone-border p-5 shadow-soft hover:shadow-card transition-all">
        <div class="flex items-center justify-between mb-4">
          <div>
            <span class="text-xs font-bold text-ink font-heading">Expense vs Profit &amp; Growth</span>
            <p class="text-[11px] text-ink-muted">Monthly recurring revenue against onboarding signups</p>
          </div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-muted/60 border border-stone-border text-[11px] font-medium text-ink-muted">
            <span>Last 6 months</span>
            <AppIcon name="chevron-down" :size="12" />
          </div>
        </div>

        <!-- SVG Smooth Bezier Curves Chart with Frontend Warm Stone Grid -->
        <div class="w-full h-52 relative">
          <svg class="w-full h-full" viewBox="0 0 600 180" preserveAspectRatio="none">
            <defs>
              <!-- Green Area Gradient -->
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#1E8E5A" stop-opacity="0.22" />
                <stop offset="100%" stop-color="#1E8E5A" stop-opacity="0.0" />
              </linearGradient>

              <!-- Signal Orange Area Gradient -->
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#F08A3C" stop-opacity="0.22" />
                <stop offset="100%" stop-color="#F08A3C" stop-opacity="0.0" />
              </linearGradient>
            </defs>

            <!-- Dotted Horizontal Grid Lines using #E7E2D9 -->
            <line x1="40" y1="20" x2="580" y2="20" stroke="#E7E2D9" stroke-dasharray="3,3" />
            <text x="32" y="24" fill="#7A8D9F" font-size="10" text-anchor="end">40k</text>

            <line x1="40" y1="60" x2="580" y2="60" stroke="#E7E2D9" stroke-dasharray="3,3" />
            <text x="32" y="64" fill="#7A8D9F" font-size="10" text-anchor="end">30k</text>

            <line x1="40" y1="100" x2="580" y2="100" stroke="#E7E2D9" stroke-dasharray="3,3" />
            <text x="32" y="104" fill="#7A8D9F" font-size="10" text-anchor="end">20k</text>

            <line x1="40" y1="140" x2="580" y2="140" stroke="#E7E2D9" stroke-dasharray="3,3" />
            <text x="32" y="144" fill="#7A8D9F" font-size="10" text-anchor="end">10k</text>

            <!-- Base Ground Line -->
            <line x1="40" y1="160" x2="580" y2="160" stroke="#E7E2D9" />

            <!-- PROFIT / MRR CURVE (Status Green #1E8E5A) -->
            <path
              d="M 60,135 C 130,120 180,140 250,115 C 320,90 380,105 440,75 C 500,45 540,55 570,50 L 570,160 L 60,160 Z"
              fill="url(#profitGrad)"
            />
            <path
              d="M 60,135 C 130,120 180,140 250,115 C 320,90 380,105 440,75 C 500,45 540,55 570,50"
              fill="none"
              stroke="#1E8E5A"
              stroke-width="2.5"
              stroke-linecap="round"
            />

            <!-- EXPENSE / SIGNUPS CURVE (Signal Orange #F08A3C) -->
            <path
              d="M 60,110 C 120,130 180,120 250,130 C 310,140 360,70 410,75 C 460,80 510,110 570,105 L 570,160 L 60,160 Z"
              fill="url(#expenseGrad)"
            />
            <path
              d="M 60,110 C 120,130 180,120 250,130 C 310,140 360,70 410,75 C 460,80 510,110 570,105"
              fill="none"
              stroke="#F08A3C"
              stroke-width="2.5"
              stroke-linecap="round"
            />

            <!-- PEAK CALLOUT BADGE 1: Signal Orange Milestone -->
            <g transform="translate(370, 48)">
              <rect x="0" y="0" width="76" height="18" rx="4" fill="#F08A3C" />
              <text x="38" y="12" fill="#FFFFFF" font-size="8" font-weight="bold" text-anchor="middle">Highest Expense</text>
              <line x1="38" y1="18" x2="38" y2="27" stroke="#F08A3C" stroke-width="1.5" />
              <circle cx="38" cy="27" r="3" fill="#F08A3C" stroke="#FFFFFF" stroke-width="1" />
            </g>

            <!-- PEAK CALLOUT BADGE 2: Green Milestone -->
            <g transform="translate(520, 24)">
              <rect x="0" y="0" width="68" height="18" rx="4" fill="#1E8E5A" />
              <text x="34" y="12" fill="#FFFFFF" font-size="8" font-weight="bold" text-anchor="middle">Highest Profit</text>
              <line x1="34" y1="18" x2="34" y2="26" stroke="#1E8E5A" stroke-width="1.5" />
              <circle cx="34" cy="26" r="3" fill="#1E8E5A" stroke="#FFFFFF" stroke-width="1" />
            </g>

            <!-- Month X Axis Labels -->
            <text x="60" y="174" fill="#7A8D9F" font-size="10" text-anchor="middle">Dec</text>
            <text x="145" y="174" fill="#7A8D9F" font-size="10" text-anchor="middle">Jan</text>
            <text x="230" y="174" fill="#7A8D9F" font-size="10" text-anchor="middle">Feb</text>
            <text x="315" y="174" fill="#7A8D9F" font-size="10" text-anchor="middle">Mar</text>
            <text x="400" y="174" fill="#7A8D9F" font-size="10" text-anchor="middle">April</text>
            <text x="485" y="174" fill="#7A8D9F" font-size="10" text-anchor="middle">May</text>
            <text x="565" y="174" fill="#7A8D9F" font-size="10" text-anchor="middle">Jun</text>
          </svg>
        </div>
      </div>

      <!-- Attention Items (lg:col-span-4) -->
      <div class="lg:col-span-4 bg-white rounded-2xl border border-stone-border p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-status-red animate-pulse"></span>
              <span class="text-xs font-bold text-ink font-heading">Action Items</span>
            </div>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-status-red-bg text-status-red font-bold">
              {{ overview?.needsAttention.length || 0 }} flagged
            </span>
          </div>

          <div class="space-y-2.5" v-if="overview">
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
                <span v-else>Due date: {{ item.dueDate }}</span>
                <span class="text-signal font-semibold">Manage &rarr;</span>
              </div>
            </div>
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
