<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { PRICING_TIERS, MODULE_CATALOG } from '@/data/catalog'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import { formatCurrency } from '@/utils/format'

const billingCycle = ref<'monthly' | 'yearly'>('monthly')
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
    <!-- Header -->
    <div class="text-center max-w-3xl mx-auto space-y-4">
      <Badge variant="signal" size="sm">Transparent Tiering</Badge>
      <h1 class="text-4xl sm:text-5xl font-black text-ink font-heading tracking-tight">
        Predictable plans that adapt as you expand
      </h1>
      <p class="text-base text-ink-muted">
        No hidden licensing penalties. Choose your base workspace tier and add only the functional modules your business uses.
      </p>

      <!-- Monthly / Yearly Billing Toggle -->
      <div class="pt-4 flex items-center justify-center gap-3">
        <span :class="['text-sm font-semibold', billingCycle === 'monthly' ? 'text-ink' : 'text-ink-muted']">
          Billed Monthly
        </span>
        <button
          type="button"
          class="relative w-14 h-8 bg-ink-navy rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
          aria-label="Toggle annual billing discount"
          @click="billingCycle = billingCycle === 'monthly' ? 'yearly' : 'monthly'"
        >
          <div
            :class="[
              'w-6 h-6 bg-white rounded-full transition-transform duration-200 shadow-sm flex items-center justify-center',
              billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0',
            ]"
          >
            <span class="w-2 h-2 rounded-full bg-signal" />
          </div>
        </button>
        <div class="flex items-center gap-1.5">
          <span :class="['text-sm font-semibold', billingCycle === 'yearly' ? 'text-ink' : 'text-ink-muted']">
            Billed Annually
          </span>
          <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-signal-subtle text-signal border border-signal/20">
            Save 20%
          </span>
        </div>
      </div>
    </div>

    <!-- Tier Cards -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
      <div
        v-for="tier in PRICING_TIERS"
        :key="tier.id"
        :class="[
          'bg-white rounded-3xl border p-8 flex flex-col justify-between transition-all duration-200 shadow-soft relative',
          tier.recommended
            ? 'border-signal ring-2 ring-signal/20 shadow-lift'
            : 'border-stone-border hover:shadow-card',
        ]"
      >
        <div
          v-if="tier.recommended"
          class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-signal text-white text-xs font-bold uppercase tracking-wider shadow-sm"
        >
          Recommended Choice
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-2xl font-black text-ink font-heading">
              {{ tier.name }}
            </h3>
          </div>
          <p class="text-xs text-ink-muted mb-6 leading-relaxed">
            {{ tier.tagline }}
          </p>

          <div class="py-4 border-y border-stone-border mb-6">
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-black text-ink font-heading num-tabular">
                {{ formatCurrency(billingCycle === 'monthly' ? tier.monthlyBasePrice : tier.yearlyBasePrice) }}
              </span>
              <span class="text-xs text-ink-light">/ month</span>
            </div>
            <p class="text-xs text-ink-muted mt-1">
              Includes {{ tier.includedUsers }} seats • Extra seats ${{ tier.extraUserPrice }}/mo
            </p>
          </div>

          <div class="space-y-3 mb-8">
            <p class="text-xs font-bold uppercase tracking-wider text-ink font-heading">
              What's included:
            </p>
            <ul class="space-y-2.5 text-xs text-ink-muted">
              <li
                v-for="(f, i) in tier.features"
                :key="i"
                class="flex items-start gap-2.5"
              >
                <div class="w-4 h-4 rounded-full bg-status-green-bg text-status-green flex items-center justify-center shrink-0 mt-0.5">
                  <AppIcon name="check" :size="10" />
                </div>
                <span class="leading-relaxed">{{ f }}</span>
              </li>
            </ul>
          </div>
        </div>

        <RouterLink :to="`/checkout?plan=${tier.id}&cycle=${billingCycle}`">
          <AppButton
            :variant="tier.recommended ? 'primary' : 'outline'"
            size="lg"
            block
          >
            Select {{ tier.name }}
          </AppButton>
        </RouterLink>
      </div>
    </div>

    <!-- Modular Add-Ons Explanation -->
    <div class="bg-white rounded-3xl border border-stone-border p-8 shadow-card space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-border">
        <div>
          <h3 class="text-xl font-bold text-ink font-heading">
            A la Carte Module Pricing
          </h3>
          <p class="text-xs text-ink-muted">
            Add or detach individual functional modules to any base workspace at anytime.
          </p>
        </div>
        <RouterLink to="/checkout">
          <AppButton variant="secondary" size="sm">
            Customize My Plan
          </AppButton>
        </RouterLink>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          v-for="m in MODULE_CATALOG"
          :key="m.id"
          class="p-4 rounded-2xl bg-stone-bg border border-stone-border space-y-2"
        >
          <div class="flex items-center justify-between">
            <AppIcon :name="m.id" :size="18" className="text-signal" />
            <Badge :variant="m.isCore ? 'signal' : 'neutral'" size="sm">{{ m.isCore ? 'Live' : 'Upcoming' }}</Badge>
          </div>
          <h4 class="text-xs font-bold text-ink truncate">{{ m.title }}</h4>
          <p class="text-xs font-extrabold text-ink font-heading num-tabular">
            {{ formatCurrency(billingCycle === 'monthly' ? m.monthlyPrice : m.yearlyPrice) }}/mo
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
