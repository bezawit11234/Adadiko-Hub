<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getAdminApi } from '@/services/admin'
import { useAccess } from '@/composables/useAccess'
import { useToast } from '@/composables/useToast'
import type { Subscription } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const adminApi = getAdminApi()
const { canRenewSubscriptions } = useAccess()
const { showToast } = useToast()

const subscriptions = ref<Subscription[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedStatus = ref<'all' | 'active' | 'expiring' | 'past_due' | 'canceled'>('all')

// Renew modal state
const selectedSub = ref<Subscription | null>(null)
const showRenewModal = ref(false)
const renewDuration = ref<number>(1) // months
const isRenewing = ref(false)

const fetchSubscriptions = async () => {
  loading.value = true
  try {
    const res = await adminApi.listSubscriptions()
    if (res.ok && res.data) {
      subscriptions.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSubscriptions()
})

const filteredSubscriptions = computed(() => {
  return subscriptions.value.filter((s) => {
    const matchesStatus = selectedStatus.value === 'all' || s.status === selectedStatus.value
    const q = searchQuery.value.toLowerCase().trim()
    const matchesSearch = !q || s.clientCompanyName.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })
})

const getStatusBadge = (status: Subscription['status']) => {
  switch (status) {
    case 'active':
      return { variant: 'success' as const, label: 'Active' }
    case 'expiring':
      return { variant: 'warning' as const, label: 'Expiring Soon' }
    case 'past_due':
      return { variant: 'danger' as const, label: 'Past Due' }
    case 'canceled':
      return { variant: 'neutral' as const, label: 'Canceled' }
  }
}

const openRenewModal = (sub: Subscription) => {
  selectedSub.value = sub
  renewDuration.value = sub.billingCycle === 'yearly' ? 12 : 1
  showRenewModal.value = true
}

const handleRenewSubscription = async () => {
  if (!selectedSub.value) return
  isRenewing.value = true
  try {
    const res = await adminApi.renewSubscription(selectedSub.value.id, renewDuration.value)
    if (res.ok && res.data) {
      showToast({
        title: 'Subscription Renewed',
        message: `${selectedSub.value.clientCompanyName} contract extended by ${renewDuration.value} month(s). New expiration: ${res.data.renewalDate}.`,
        type: 'success',
      })
      showRenewModal.value = false
      await fetchSubscriptions()
    } else {
      showToast({ title: 'Renewal Failed', message: res.error || 'Failed to renew subscription.', type: 'error' })
    }
  } finally {
    isRenewing.value = false
  }
}
</script>

<template>
  <PageContainer>
    <SectionHeading
      title="Tenant Subscriptions"
      description="Manage ongoing client recurring contracts, renewal milestones, and contract extensions."
    >
      <template #actions>
        <span class="text-xs font-mono text-ink-muted">
          Showing {{ filteredSubscriptions.length }} of {{ subscriptions.length }} contracts
        </span>
      </template>
    </SectionHeading>

    <!-- Filters & Search Toolbar -->
    <div class="bg-stone-surface border border-stone-border rounded-2xl p-4 shadow-soft mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
        <button
          type="button"
          @click="selectedStatus = 'all'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedStatus === 'all' ? 'bg-ink text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          All ({{ subscriptions.length }})
        </button>
        <button
          type="button"
          @click="selectedStatus = 'active'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedStatus === 'active' ? 'bg-status-green text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          Active ({{ subscriptions.filter(s => s.status === 'active').length }})
        </button>
        <button
          type="button"
          @click="selectedStatus = 'expiring'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedStatus === 'expiring' ? 'bg-status-amber text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          Expiring Soon ({{ subscriptions.filter(s => s.status === 'expiring').length }})
        </button>
        <button
          type="button"
          @click="selectedStatus = 'past_due'"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          :class="selectedStatus === 'past_due' ? 'bg-status-red text-white font-semibold' : 'bg-stone-muted/70 text-ink-muted hover:bg-stone-muted hover:text-ink'"
        >
          Past Due ({{ subscriptions.filter(s => s.status === 'past_due').length }})
        </button>
      </div>

      <div class="relative w-full md:w-72">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-light">
          <AppIcon name="search" :size="16" />
        </div>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search client organization..."
          class="w-full pl-9 pr-3 py-1.5 bg-white text-xs text-ink rounded-xl border border-stone-border focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors"
        />
      </div>
    </div>

    <!-- Subscriptions Table -->
    <div class="bg-stone-surface border border-stone-border rounded-2xl shadow-soft overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-stone-subtle/80 border-b border-stone-border text-ink-muted uppercase font-mono text-[11px] tracking-wider">
              <th class="py-3.5 px-4 font-semibold">Client Organization</th>
              <th class="py-3.5 px-4 font-semibold">Plan Tier</th>
              <th class="py-3.5 px-4 font-semibold">Active Modules</th>
              <th class="py-3.5 px-4 font-semibold">Billing Frequency</th>
              <th class="py-3.5 px-4 font-semibold">Contract Rate</th>
              <th class="py-3.5 px-4 font-semibold">Expiration / Renewal</th>
              <th class="py-3.5 px-4 font-semibold">Auto-Renew</th>
              <th class="py-3.5 px-4 font-semibold">Status</th>
              <th class="py-3.5 px-4 font-semibold text-right" v-if="canRenewSubscriptions">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-border">
            <tr
              v-for="sub in filteredSubscriptions"
              :key="sub.id"
              class="hover:bg-stone-subtle/60 transition-colors"
            >
              <td class="py-3.5 px-4 font-semibold text-ink">
                {{ sub.clientCompanyName }}
              </td>

              <td class="py-3.5 px-4">
                <Badge :variant="sub.plan === 'enterprise' ? 'accent' : 'neutral'">
                  {{ sub.plan }}
                </Badge>
              </td>

              <td class="py-3.5 px-4 font-mono text-ink-muted">
                {{ sub.modules.length }} modules
              </td>

              <td class="py-3.5 px-4 capitalize font-medium text-ink">
                {{ sub.billingCycle }}
              </td>

              <td class="py-3.5 px-4 font-mono font-bold text-ink">
                {{ formatCurrency(sub.amount) }} <span class="font-normal text-xs text-ink-muted">/ {{ sub.billingCycle === 'yearly' ? 'yr' : 'mo' }}</span>
              </td>

              <td class="py-3.5 px-4 font-mono text-[11px]">
                <span :class="sub.status === 'past_due' ? 'text-status-red font-bold' : sub.status === 'expiring' ? 'text-status-amber font-bold' : 'text-ink-muted'">
                  {{ formatDate(sub.renewalDate) }}
                </span>
              </td>

              <td class="py-3.5 px-4">
                <span
                  class="inline-flex items-center gap-1 text-[11px] font-mono"
                  :class="sub.autoRenew ? 'text-status-green' : 'text-ink-muted'"
                >
                  <AppIcon :name="sub.autoRenew ? 'check' : 'x'" :size="12" />
                  {{ sub.autoRenew ? 'Enabled' : 'Disabled' }}
                </span>
              </td>

              <td class="py-3.5 px-4">
                <Badge :variant="getStatusBadge(sub.status).variant">
                  {{ getStatusBadge(sub.status).label }}
                </Badge>
              </td>

              <td class="py-3.5 px-4 text-right" v-if="canRenewSubscriptions">
                <AppButton
                  variant="secondary"
                  size="sm"
                  @click="openRenewModal(sub)"
                >
                  Renew Contract &rarr;
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

      <EmptyState
        v-if="filteredSubscriptions.length === 0 && !loading"
        title="No subscriptions found"
        description="Try adjusting your status filter or search parameters."
        icon="receipt"
      />
    </div>

    <!-- Renew Modal -->
    <Modal
      :show="showRenewModal"
      :title="`Renew Contract — ${selectedSub?.clientCompanyName}`"
      @close="showRenewModal = false"
    >
      <div v-if="selectedSub" class="space-y-4 text-xs">
        <div class="p-3 rounded-xl bg-stone-subtle border border-stone-border space-y-1">
          <div class="flex justify-between">
            <span class="text-ink-muted">Client:</span>
            <span class="font-bold text-ink">{{ selectedSub.clientCompanyName }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-muted">Current Expiration:</span>
            <span class="font-mono text-ink">{{ formatDate(selectedSub.renewalDate) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-muted">Contract Amount:</span>
            <span class="font-mono font-medium text-ink">{{ formatCurrency(selectedSub.amount) }}</span>
          </div>
        </div>

        <div>
          <label class="block font-medium text-ink mb-1.5">Select Extension Duration</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="renewDuration = 1"
              class="p-3 rounded-xl border text-center transition-all"
              :class="
                renewDuration === 1
                  ? 'border-signal bg-signal-subtle text-ink font-semibold'
                  : 'border-stone-border bg-stone-subtle text-ink-muted hover:bg-stone-muted'
              "
            >
              <div class="font-bold text-sm">+1 Month</div>
              <div class="text-[11px] text-ink-muted mt-0.5">Monthly rollover</div>
            </button>
            <button
              type="button"
              @click="renewDuration = 12"
              class="p-3 rounded-xl border text-center transition-all"
              :class="
                renewDuration === 12
                  ? 'border-signal bg-signal-subtle text-ink font-semibold'
                  : 'border-stone-border bg-stone-subtle text-ink-muted hover:bg-stone-muted'
              "
            >
              <div class="font-bold text-sm">+1 Year (12 Mo)</div>
              <div class="text-[11px] text-ink-muted mt-0.5">Annual commitment</div>
            </button>
          </div>
        </div>

        <p class="text-ink-muted leading-relaxed">
          Extending this contract will automatically reset the subscription status to <strong>Active</strong> and update tenant renewal dates across the ERPNext control site.
        </p>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="showRenewModal = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" @click="handleRenewSubscription" :loading="isRenewing">
          Confirm Renewal
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
