<script setup lang="ts">
import { MODULE_CATALOG } from '@/data/catalog'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import Badge from '@/components/common/Badge.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatCurrency } from '@/utils/format'
</script>

<template>
  <PageContainer max-width="2xl">
    <SampleNotice text="Back Office Catalog Manager: Configure module marketplace listings, base rates, and feature inclusions." />

    <SectionHeading
      title="Platform Marketplace Catalog"
      description="Manage the live modular software catalog, pricing models, and public marketplace metadata."
    >
      <template #badge>
        <Badge variant="signal" size="sm">{{ MODULE_CATALOG.length }} Modules Listed</Badge>
      </template>
    </SectionHeading>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="mod in MODULE_CATALOG"
        :key="mod.id"
        class="bg-white rounded-2xl border border-stone-border p-6 shadow-soft space-y-4"
      >
        <div class="flex items-start justify-between">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
            :style="{ backgroundColor: mod.color }"
          >
            <AppIcon :name="mod.id" :size="20" />
          </div>
          <Badge :variant="mod.isCore ? 'signal' : 'neutral'" size="sm">
            {{ mod.isCore ? 'Core Priority' : 'Staging' }}
          </Badge>
        </div>

        <div>
          <h4 class="text-base font-bold text-ink font-heading">{{ mod.title }}</h4>
          <p class="text-xs text-ink-muted mt-1 leading-relaxed">{{ mod.tagline }}</p>
        </div>

        <div class="pt-3 border-t border-stone-border flex justify-between text-xs">
          <span class="text-ink-muted">Monthly Rate:</span>
          <span class="font-extrabold text-ink num-tabular">{{ formatCurrency(mod.monthlyPrice) }}</span>
        </div>
      </div>
    </div>
  </PageContainer>
</template>
