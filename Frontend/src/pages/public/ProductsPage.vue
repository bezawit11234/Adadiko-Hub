<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { MODULE_CATALOG } from '@/data/catalog'
import type { ModuleProduct } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'
import { formatCurrency } from '@/utils/format'

const selectedModalModule = ref<ModuleProduct | null>(null)

function openDetailModal(mod: ModuleProduct) {
  selectedModalModule.value = mod
}

function closeModal() {
  selectedModalModule.value = null
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
    <!-- Header -->
    <div class="max-w-3xl space-y-4">
      <Badge variant="signal" size="sm">Adadiko App Store</Badge>
      <h1 class="text-3xl sm:text-4xl font-black text-ink font-heading tracking-tight">
        Enterprise Module Marketplace
      </h1>
      <p class="text-base text-ink-muted leading-relaxed">
        Assemble a customized ERP tailored to your current scale. Each module runs seamlessly inside the unified Adadiko client workspace and synchronizes with your Frappe backend.
      </p>
    </div>

    <!-- Modules Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="mod in MODULE_CATALOG"
        :key="mod.id"
        class="bg-white rounded-2xl border border-stone-border p-6 shadow-soft flex flex-col justify-between hover:shadow-card transition-all"
      >
        <div>
          <div class="flex items-start justify-between mb-4">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center text-white"
              :style="{ backgroundColor: mod.color }"
            >
              <AppIcon :name="mod.id" :size="24" />
            </div>
            <Badge :variant="mod.isCore ? 'signal' : 'neutral'" size="sm" dot>
              {{ mod.badge }}
            </Badge>
          </div>

          <h3 class="text-xl font-bold text-ink font-heading mb-1.5">
            {{ mod.title }}
          </h3>
          <p class="text-sm text-ink-muted mb-4">
            {{ mod.tagline }}
          </p>

          <div class="space-y-2 py-4 border-t border-stone-border text-xs text-ink-muted">
            <div
              v-for="(f, i) in mod.includedFeatures.slice(0, 4)"
              :key="i"
              class="flex items-start gap-2"
            >
              <AppIcon name="check" :size="14" className="text-status-green mt-0.5" />
              <span>{{ f }}</span>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-stone-border flex items-center justify-between">
          <div>
            <span class="text-xl font-bold text-ink font-heading num-tabular">
              {{ formatCurrency(mod.monthlyPrice) }}
            </span>
            <span class="text-xs text-ink-light"> / mo</span>
          </div>

          <div class="flex items-center gap-2">
            <AppButton variant="outline" size="sm" @click="openDetailModal(mod)">
              Quick View
            </AppButton>
            <RouterLink :to="`/products/${mod.id}`">
              <AppButton variant="primary" size="sm">
                Detail
              </AppButton>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick View Modal -->
    <Modal
      :is-open="!!selectedModalModule"
      :title="selectedModalModule?.title || ''"
      :subtitle="selectedModalModule?.tagline"
      max-width="lg"
      @close="closeModal"
    >
      <div v-if="selectedModalModule" class="space-y-4">
        <p class="text-sm text-ink-muted leading-relaxed">
          {{ selectedModalModule.description }}
        </p>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-ink font-heading mb-2">
            Included Capabilities
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div
              v-for="(feat, idx) in selectedModalModule.includedFeatures"
              :key="idx"
              class="p-2.5 rounded-xl bg-stone-bg border border-stone-border flex items-start gap-2"
            >
              <AppIcon name="check" :size="14" className="text-status-green mt-0.5" />
              <span class="text-ink font-medium">{{ feat }}</span>
            </div>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-stone-subtle border border-stone-border text-xs flex items-center justify-between">
          <span class="text-ink-muted">Integration Status:</span>
          <span v-if="selectedModalModule.isCore" class="font-bold text-status-green">
            Full Production Ready (Sales Core)
          </span>
          <span v-else class="font-semibold text-ink-muted">
            Engineers drafting Frappe DocType schema
          </span>
        </div>
      </div>

      <template #footer>
        <AppButton variant="outline" size="sm" @click="closeModal">
          Close
        </AppButton>
        <RouterLink
          v-if="selectedModalModule"
          :to="`/checkout?module=${selectedModalModule.id}`"
          @click="closeModal"
        >
          <AppButton variant="primary" size="sm">
            Add to Workspace
          </AppButton>
        </RouterLink>
      </template>
    </Modal>
  </div>
</template>
