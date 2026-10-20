<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAdminApi } from '@/services/admin'
import { useAccess } from '@/composables/useAccess'
import { useToast } from '@/composables/useToast'
import type { ModuleItem } from '@/types'
import { formatCurrency } from '@/utils/format'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'
import TextField from '@/components/common/TextField.vue'

const adminApi = getAdminApi()
const { canEditCatalog } = useAccess()
const { showToast } = useToast()

const modules = ref<ModuleItem[]>([])
const loading = ref(true)

// Edit price modal state
const selectedModule = ref<ModuleItem | null>(null)
const editMonthlyPrice = ref<number>(0)
const editYearlyPrice = ref<number>(0)
const showPriceModal = ref(false)
const isSaving = ref(false)

const fetchCatalog = async () => {
  loading.value = true
  try {
    const res = await adminApi.listCatalog()
    if (res.ok && res.data) {
      modules.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCatalog()
})

const openPriceModal = (mod: ModuleItem) => {
  selectedModule.value = mod
  editMonthlyPrice.value = mod.monthlyPrice
  editYearlyPrice.value = mod.yearlyPrice
  showPriceModal.value = true
}

const handleSavePrice = async () => {
  if (!selectedModule.value) return
  isSaving.value = true
  try {
    const res = await adminApi.updateModulePrice(
      selectedModule.value.key,
      Number(editMonthlyPrice.value),
      Number(editYearlyPrice.value)
    )
    if (res.ok && res.data) {
      showToast({
        title: 'Catalog Price Updated',
        message: `${res.data.name} price updated to $${res.data.monthlyPrice}/mo, $${res.data.yearlyPrice}/yr.`,
        type: 'success',
      })
      showPriceModal.value = false
      await fetchCatalog()
    } else {
      showToast({ title: 'Update Failed', message: res.error || 'Failed to update module price.', type: 'error' })
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <PageContainer>
    <SectionHeading
      title="Module Marketplace Catalog"
      description="Configure software modules, subscription list prices, and capability tiers for client workspaces."
    >
      <template #actions>
        <span class="text-xs font-mono text-ink-muted">
          {{ modules.length }} modules published
        </span>
      </template>
    </SectionHeading>

    <!-- Modules Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="mod in modules"
        :key="mod.key"
        class="bg-stone-surface border border-stone-border rounded-2xl p-6 shadow-soft flex flex-col justify-between hover:border-signal/40 transition-colors"
      >
        <div>
          <!-- Header & Category Badge -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-signal/15 text-signal flex items-center justify-center shrink-0">
              <AppIcon name="catalog" :size="20" />
            </div>
            <div class="flex items-center gap-1.5">
              <Badge v-if="mod.isCore" variant="neutral">Core</Badge>
              <Badge variant="accent" class="uppercase text-[10px]">
                {{ mod.category }}
              </Badge>
            </div>
          </div>

          <!-- Title & Description -->
          <h3 class="font-heading font-bold text-base text-ink mb-1.5">
            {{ mod.name }}
          </h3>
          <p class="text-xs text-ink-muted leading-relaxed mb-6">
            {{ mod.description }}
          </p>
        </div>

        <!-- Pricing & Edit Action -->
        <div class="pt-4 border-t border-stone-border">
          <div class="flex items-baseline justify-between mb-4">
            <div>
              <span class="font-mono font-bold text-lg text-ink">{{ formatCurrency(mod.monthlyPrice) }}</span>
              <span class="text-xs text-ink-muted"> / month</span>
            </div>
            <div class="font-mono text-xs text-ink-muted">
              {{ formatCurrency(mod.yearlyPrice) }} / year
            </div>
          </div>

          <AppButton
            v-if="canEditCatalog"
            variant="secondary"
            size="sm"
            class="w-full justify-center"
            @click="openPriceModal(mod)"
          >
            <AppIcon name="settings" :size="14" class="mr-1.5" />
            Edit Module Pricing
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Edit Price Modal -->
    <Modal
      :show="showPriceModal"
      :title="`Edit Pricing — ${selectedModule?.name}`"
      @close="showPriceModal = false"
    >
      <div v-if="selectedModule" class="space-y-4 text-xs">
        <p class="text-ink-muted">
          Updating catalog pricing will apply to new tenant subscriptions and plan modifications. Existing locked contracts retain their contracted terms until manual renewal.
        </p>

        <div class="grid grid-cols-2 gap-4">
          <TextField
            id="monthly-price"
            label="Monthly Price ($ USD)"
            type="number"
            v-model.number="editMonthlyPrice"
            placeholder="35"
          />
          <TextField
            id="yearly-price"
            label="Yearly Price ($ USD)"
            type="number"
            v-model.number="editYearlyPrice"
            placeholder="350"
          />
        </div>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="showPriceModal = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" @click="handleSavePrice" :loading="isSaving">
          Save Pricing Changes
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
