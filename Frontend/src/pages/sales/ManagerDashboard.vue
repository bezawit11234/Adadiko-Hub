<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getSalesApi } from '@/services/sales'
import { useToast } from '@/composables/useToast'
import { useSession } from '@/composables/useSession'
import type { SalesSummary, ApprovalRequest } from '@/types'
import StatCard from '@/components/common/StatCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatCurrency } from '@/utils/format'

const salesApi = getSalesApi()
const toast = useToast()
const { currentRole } = useSession()

const canApprove = computed(() => currentRole.value === 'sales_manager' || currentRole.value === 'admin')

const summary = ref<SalesSummary | null>(null)
const approvals = ref<ApprovalRequest[]>([])
const loading = ref(true)


async function loadData() {
  loading.value = true
  try {
    const [summaryRes, approvalsRes] = await Promise.all([
      salesApi.getSalesSummary(),
      salesApi.listApprovals(),
    ])
    if (summaryRes.ok && summaryRes.data) summary.value = summaryRes.data
    if (approvalsRes.ok && approvalsRes.data) approvals.value = approvalsRes.data
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const pendingApprovals = computed(() => {
  return approvals.value.filter((a) => a.status === 'Pending')
})

async function handleDecision(id: string, decision: 'Approved' | 'Rejected') {
  const res = await salesApi.decideApproval(id, decision)
  if (res.ok) {
    toast.success(
      decision === 'Approved' ? 'Request Approved' : 'Request Rejected',
      `Approval #${id} has been marked as ${decision}.`
    )
    loadData()
  } else {
    toast.error('Action Failed', res.error)
  }
}

// Inline SVG chart math
const chartPoints = computed(() => {
  if (!summary.value) return ''
  const items = summary.value.recentOrdersOverTime
  const maxVal = Math.max(...items.map((i) => i.amount), 15000)
  const width = 500
  const height = 160
  const padding = 20

  const pts = items.map((item, idx) => {
    const x = padding + (idx * (width - 2 * padding)) / (items.length - 1)
    const y = height - padding - (item.amount / maxVal) * (height - 2 * padding)
    return `${x},${y}`
  })
  return pts.join(' ')
})

const areaPoints = computed(() => {
  if (!chartPoints.value) return ''
  return `20,140 ${chartPoints.value} 480,140`
})
</script>

<template>
  <PageContainer max-width="2xl">
    <SampleNotice text="Sales Manager Executive Dashboard: Real-time revenue aggregates, SVG trend telemetry, and discount authorization queue." />

    <SectionHeading
      title="Sales Operations Dashboard"
      description="Executive revenue telemetry, pipeline velocity, team targets, and authorization requests."
    >
      <template #badge>
        <Badge variant="signal" size="sm">Manager View</Badge>
      </template>
      <template #actions>
        <RouterLink to="/app/sales/orders/new">
          <AppButton variant="primary" size="sm">
            <AppIcon name="plus" :size="16" />
            <span>New Order</span>
          </AppButton>
        </RouterLink>
      </template>
    </SectionHeading>

    <!-- Top 4 KPI Cards -->
    <div v-if="summary" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Sales Closed Today"
        :value="formatCurrency(summary.salesToday)"
        subtitle="Daily billing intake"
        icon="dollar-sign"
        trend="up"
        trend-value="+14.2%"
        variant="signal"
      />

      <StatCard
        title="This Month Revenue"
        :value="formatCurrency(summary.salesThisMonth)"
        :subtitle="`Target: ${formatCurrency(summary.salesMonthTarget)}`"
        icon="dashboard"
        trend="up"
        trend-value="78% to Target"
      />

      <StatCard
        title="Open Orders in Queue"
        :value="`${summary.openOrdersCount} Orders`"
        :subtitle="`Value: ${formatCurrency(summary.openOrdersValue)}`"
        icon="orders"
        trend="neutral"
        trend-value="Active Dispatch"
      />

      <StatCard
        title="Customer Debt (Unpaid)"
        :value="formatCurrency(summary.unpaidInvoicesTotal)"
        :subtitle="`${summary.unpaidInvoicesCount} invoices pending payment`"
        icon="receipt"
        trend="down"
        trend-value="Receivables"
      />
    </div>

    <!-- PIPELINE STAGES BAR -->
    <div v-if="summary" class="bg-white p-5 rounded-3xl border border-stone-border shadow-soft space-y-3">
      <div class="flex items-center justify-between pb-2 border-b border-stone-border">
        <h3 class="text-xs font-bold uppercase tracking-wider text-ink font-heading flex items-center gap-2">
          <AppIcon name="layers" :size="16" className="text-signal" />
          <span>Active Pipeline Stages</span>
        </h3>
        <span class="text-xs text-ink-muted">From quotation to cash collection</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div class="p-3 bg-stone-bg/60 rounded-2xl border border-stone-border">
          <span class="text-xs font-semibold text-ink-muted">1. Quotations</span>
          <p class="text-xl font-black text-ink font-heading num-tabular mt-1">
            {{ summary.pipelineCounts.quotations }}
          </p>
        </div>

        <div class="p-3 bg-signal-subtle/50 rounded-2xl border border-signal/30">
          <span class="text-xs font-semibold text-signal">2. Sales Orders</span>
          <p class="text-xl font-black text-ink font-heading num-tabular mt-1">
            {{ summary.pipelineCounts.orders }}
          </p>
        </div>

        <div class="p-3 bg-stone-bg/60 rounded-2xl border border-stone-border">
          <span class="text-xs font-semibold text-ink-muted">3. Delivered</span>
          <p class="text-xl font-black text-ink font-heading num-tabular mt-1">
            {{ summary.pipelineCounts.delivered }}
          </p>
        </div>

        <div class="p-3 bg-stone-bg/60 rounded-2xl border border-stone-border">
          <span class="text-xs font-semibold text-ink-muted">4. Invoiced</span>
          <p class="text-xl font-black text-ink font-heading num-tabular mt-1">
            {{ summary.pipelineCounts.invoiced }}
          </p>
        </div>

        <div class="p-3 bg-status-green-bg/60 rounded-2xl border border-status-green/30">
          <span class="text-xs font-semibold text-status-green">5. Paid & Closed</span>
          <p class="text-xl font-black text-ink font-heading num-tabular mt-1">
            {{ summary.pipelineCounts.paid }}
          </p>
        </div>
      </div>
    </div>

    <!-- 2-COLUMN SECTION: SVG Trend Chart & Approvals Waiting -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Sales Trend SVG Chart -->
      <div class="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-border shadow-soft space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-stone-border">
          <div>
            <h3 class="text-base font-bold text-ink font-heading flex items-center gap-2">
              <AppIcon name="dashboard" :size="18" className="text-signal" />
              <span>Revenue Trend Over Time</span>
            </h3>
            <p class="text-xs text-ink-muted">Past 7 days closed sales performance</p>
          </div>
          <span class="text-xs font-bold text-signal px-2 py-0.5 rounded bg-signal-subtle border border-signal/20">
            Inline SVG Telemetry
          </span>
        </div>

        <!-- Inline SVG Canvas -->
        <div class="relative w-full overflow-hidden pt-2">
          <svg viewBox="0 0 500 160" class="w-full h-44 overflow-visible">
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#F08A3C" stop-opacity="0.3" />
                <stop offset="100%" stop-color="#F08A3C" stop-opacity="0.0" />
              </linearGradient>
            </defs>

            <!-- Grid horizontal guidelines -->
            <line x1="20" y1="20" x2="480" y2="20" stroke="#E7E2D9" stroke-dasharray="3 3" />
            <line x1="20" y1="60" x2="480" y2="60" stroke="#E7E2D9" stroke-dasharray="3 3" />
            <line x1="20" y1="100" x2="480" y2="100" stroke="#E7E2D9" stroke-dasharray="3 3" />
            <line x1="20" y1="140" x2="480" y2="140" stroke="#E7E2D9" />

            <!-- Area Fill -->
            <polygon :points="areaPoints" fill="url(#salesGrad)" />

            <!-- Smooth Stroke Polyline -->
            <polyline
              :points="chartPoints"
              fill="none"
              stroke="#F08A3C"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Data Point Circles -->
            <g v-if="summary">
              <circle
                v-for="(item, idx) in summary.recentOrdersOverTime"
                :key="idx"
                :cx="20 + (idx * 460) / (summary.recentOrdersOverTime.length - 1)"
                :cy="140 - (item.amount / 15000) * 120"
                r="4.5"
                fill="#FFFFFF"
                stroke="#14283D"
                stroke-width="2.5"
              />
            </g>
          </svg>

          <!-- Day Labels -->
          <div v-if="summary" class="flex justify-between px-4 text-[11px] text-ink-muted font-mono pt-1">
            <span v-for="d in summary.recentOrdersOverTime" :key="d.date">
              {{ d.date }}
            </span>
          </div>
        </div>
      </div>

      <!-- Approvals Waiting -->
      <div class="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-border shadow-soft space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-stone-border">
          <div class="flex items-center gap-2">
            <h3 class="text-base font-bold text-ink font-heading">
              Approvals Waiting
            </h3>
            <Badge v-if="pendingApprovals.length > 0" variant="warning" size="sm">
              {{ pendingApprovals.length }} Pending
            </Badge>
          </div>
          <span class="text-xs text-ink-muted">Manager Authorization</span>
        </div>

        <div v-if="pendingApprovals.length === 0" class="py-12 text-center text-xs text-ink-muted">
          All discount and sales order requests are cleared.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="appr in pendingApprovals"
            :key="appr.id"
            class="p-4 rounded-2xl bg-stone-bg/50 border border-stone-border space-y-2.5"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-ink">{{ appr.documentId }}</span>
                <Badge variant="signal" size="sm">{{ appr.documentType }}</Badge>
              </div>
              <span class="text-xs font-extrabold text-ink num-tabular">
                {{ formatCurrency(appr.amount) }}
              </span>
            </div>

            <p class="text-xs text-ink font-medium">
              Customer: <strong>{{ appr.customerName }}</strong>
            </p>
            <p class="text-[11px] text-ink-muted bg-white p-2 rounded-lg border border-stone-border/60 italic">
              "{{ appr.reason }}"
            </p>
            <p class="text-[10px] text-ink-light">
              Requested by: {{ appr.requestedBy }}
            </p>

            <!-- Actions: Approve / Reject (Enabled for Sales Manager & Admin) -->
            <div v-if="canApprove" class="flex items-center justify-end gap-2 pt-2 border-t border-stone-border/60">
              <AppButton variant="ghost" size="sm" @click="handleDecision(appr.id, 'Rejected')">
                Reject
              </AppButton>
              <AppButton variant="primary" size="sm" @click="handleDecision(appr.id, 'Approved')">
                <AppIcon name="check" :size="14" />
                <span>Approve</span>
              </AppButton>
            </div>
            <div v-else class="text-[11px] text-ink-muted italic text-right pt-2 border-t border-stone-border/60">
              Approval restricted to Sales Manager
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Team Performance Table -->
    <div v-if="summary" class="bg-white p-6 rounded-3xl border border-stone-border shadow-soft space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-stone-border">
        <div>
          <h3 class="text-base font-bold text-ink font-heading flex items-center gap-2">
            <AppIcon name="users" :size="18" className="text-signal" />
            <span>Sales Representative Team Performance</span>
          </h3>
          <p class="text-xs text-ink-muted">Monthly quota progress tracking per representative</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="text-xs uppercase tracking-wider text-ink-muted border-b border-stone-border">
            <tr>
              <th class="py-2 font-semibold">Rep Name</th>
              <th class="py-2 font-semibold">Orders Closed</th>
              <th class="py-2 font-semibold">Revenue Generated</th>
              <th class="py-2 font-semibold">Target Quota</th>
              <th class="py-2 font-semibold text-right">Quota Progress</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-border/60">
            <tr v-for="rep in summary.teamPerformance" :key="rep.repId">
              <td class="py-3 font-bold text-ink">
                {{ rep.repName }}
              </td>
              <td class="py-3 text-ink-muted num-tabular">
                {{ rep.ordersClosed }} deals
              </td>
              <td class="py-3 font-extrabold text-ink num-tabular">
                {{ formatCurrency(rep.revenue) }}
              </td>
              <td class="py-3 text-ink-muted num-tabular">
                {{ formatCurrency(rep.targetRevenue) }}
              </td>
              <td class="py-3 text-right">
                <div class="inline-flex items-center gap-2.5">
                  <div class="w-24 h-2 bg-stone-bg rounded-full overflow-hidden border border-stone-border">
                    <div
                      class="h-full bg-signal rounded-full transition-all"
                      :style="{ width: `${Math.min(rep.targetPct, 100)}%` }"
                    />
                  </div>
                  <span class="text-xs font-extrabold text-ink num-tabular w-12 text-right">
                    {{ rep.targetPct }}%
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </PageContainer>
</template>
