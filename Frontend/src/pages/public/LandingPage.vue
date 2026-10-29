<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import { MODULE_CATALOG } from '@/data/catalog'
</script>

<template>
  <div class="space-y-24 py-12 md:py-20">
    <!-- HERO SECTION -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <!-- Hero Text -->
        <div class="lg:col-span-7 space-y-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal-subtle border border-signal/20 text-xs font-semibold text-signal">
            <span class="w-2 h-2 rounded-full bg-signal" />
            <span>Modern High-Performance Cloud Business Architecture</span>
          </div>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-ink font-heading leading-[1.08]">
            Modular business software <span class="text-signal underline decoration-signal/30">assembled</span> around your company.
          </h1>

          <p class="text-lg text-ink-muted leading-relaxed max-w-2xl">
            Adadiko Hub lets organizations buy and run only what they need. Start with our fully equipped <strong>Sales Pipeline</strong> today; activate Inventory, Purchasing, and Finance when your team is ready.
          </p>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <RouterLink to="/checkout">
              <AppButton variant="primary" size="lg">
                <span>Start Free Trial</span>
                <AppIcon name="arrow-right" :size="18" />
              </AppButton>
            </RouterLink>
            <RouterLink to="/sign-in">
              <AppButton variant="outline" size="lg">
                <AppIcon name="user" :size="18" className="text-signal" />
                <span>Sign In to Workspace</span>
              </AppButton>
            </RouterLink>
          </div>

          <!-- Trust Badges -->
          <div class="pt-6 border-t border-stone-border flex flex-wrap items-center gap-6 text-xs text-ink-muted">
            <div class="flex items-center gap-2">
              <AppIcon name="shield" :size="16" className="text-status-green" />
              <span>Multi-tenant data isolation</span>
            </div>
            <div class="flex items-center gap-2">
              <AppIcon name="check" :size="16" className="text-status-green" />
              <span>Role-based UI access</span>
            </div>
            <div class="flex items-center gap-2">
              <AppIcon name="refresh" :size="16" className="text-status-green" />
              <span>Native Frappe API ready</span>
            </div>
          </div>
        </div>

        <!-- Hero Diagram / Graphic -->
        <div class="lg:col-span-5">
          <div class="bg-white rounded-3xl border border-stone-border shadow-card p-6 relative overflow-hidden">
            <div class="absolute -top-12 -right-12 w-48 h-48 bg-signal-subtle rounded-full blur-2xl pointer-events-none" />

            <div class="flex items-center justify-between pb-4 border-b border-stone-border">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-status-red" />
                <span class="w-3 h-3 rounded-full bg-status-amber" />
                <span class="w-3 h-3 rounded-full bg-status-green" />
              </div>
              <span class="text-[11px] font-mono text-ink-light">workspace.adadiko.app</span>
            </div>

            <div class="py-6 space-y-4">
              <!-- Simulated Active Module Card -->
              <div class="p-4 rounded-2xl bg-signal-subtle border border-signal/30 shadow-xs">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-signal text-white flex items-center justify-center font-bold">
                      <AppIcon name="orders" :size="18" />
                    </div>
                    <div>
                      <h4 class="text-sm font-bold text-ink font-heading">
                        Sales Pipeline
                      </h4>
                      <p class="text-[11px] text-signal font-semibold">
                        ACTIVE • Live Core Module
                      </p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm" dot>Running</Badge>
                </div>
                <div class="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div class="p-2 bg-white rounded-lg border border-signal/20">
                    <p class="text-[10px] text-ink-muted">Quotes</p>
                    <p class="text-xs font-bold text-ink num-tabular">8 active</p>
                  </div>
                  <div class="p-2 bg-white rounded-lg border border-signal/20">
                    <p class="text-[10px] text-ink-muted">Orders</p>
                    <p class="text-xs font-bold text-ink num-tabular">$34,270</p>
                  </div>
                  <div class="p-2 bg-white rounded-lg border border-signal/20">
                    <p class="text-[10px] text-ink-muted">Invoiced</p>
                    <p class="text-xs font-bold text-ink num-tabular">98% collected</p>
                  </div>
                </div>
              </div>

              <!-- Dockable Modules Stack -->
              <div class="space-y-2">
                <div class="p-3 rounded-xl bg-stone-bg/60 border border-stone-border flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <AppIcon name="inventory" :size="16" className="text-status-green" />
                    <span class="text-xs font-medium text-ink">Inventory & Stock</span>
                  </div>
                  <span class="text-[10px] font-semibold text-ink-muted px-2 py-0.5 rounded bg-stone-muted">
                    Dock on demand
                  </span>
                </div>

                <div class="p-3 rounded-xl bg-stone-bg/60 border border-stone-border flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <AppIcon name="purchasing" :size="16" className="text-status-blue" />
                    <span class="text-xs font-medium text-ink">Procurement & POs</span>
                  </div>
                  <span class="text-[10px] font-semibold text-ink-muted px-2 py-0.5 rounded bg-stone-muted">
                    Dock on demand
                  </span>
                </div>

                <div class="p-3 rounded-xl bg-stone-bg/60 border border-stone-border flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <AppIcon name="finance" :size="16" className="text-purple-600" />
                    <span class="text-xs font-medium text-ink">Finance & Ledger</span>
                  </div>
                  <span class="text-[10px] font-semibold text-ink-muted px-2 py-0.5 rounded bg-stone-muted">
                    Dock on demand
                  </span>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-stone-border text-center">
              <span class="text-xs text-ink-muted">Pay only for active modules • Cancel or scale anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- MODULE MARKETPLACE HIGHLIGHT -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto space-y-4 mb-12">
        <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink font-heading">
          The Adadiko Module Marketplace
        </h2>
        <p class="text-base text-ink-muted">
          Pick the tools your business demands today. Staff sign in to an uncluttered workspace tailored strictly to their subscribed capabilities.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="mod in MODULE_CATALOG"
          :key="mod.id"
          class="bg-white rounded-2xl border border-stone-border p-6 shadow-soft flex flex-col justify-between hover:shadow-card transition-all duration-200"
        >
          <div>
            <div class="flex items-start justify-between mb-4">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                :style="{ backgroundColor: mod.color }"
              >
                <AppIcon :name="mod.id" :size="22" />
              </div>
              <Badge :variant="mod.isCore ? 'signal' : 'neutral'" size="sm" dot>
                {{ mod.badge }}
              </Badge>
            </div>

            <h3 class="text-xl font-bold text-ink font-heading mb-2">
              {{ mod.title }}
            </h3>
            <p class="text-sm text-ink-muted leading-relaxed mb-6">
              {{ mod.tagline }}
            </p>

            <ul class="space-y-2 mb-6 text-xs text-ink-muted">
              <li
                v-for="(feat, idx) in mod.includedFeatures.slice(0, 3)"
                :key="idx"
                class="flex items-start gap-2"
              >
                <AppIcon name="check" :size="14" className="text-status-green mt-0.5" />
                <span>{{ feat }}</span>
              </li>
            </ul>
          </div>

          <div class="pt-4 border-t border-stone-border flex items-center justify-between">
            <div>
              <span class="text-lg font-bold text-ink font-heading num-tabular">${{ mod.monthlyPrice }}</span>
              <span class="text-xs text-ink-light"> / mo</span>
            </div>
            <RouterLink :to="`/products/${mod.id}`">
              <AppButton variant="outline" size="sm">
                Details & Features
              </AppButton>
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="mt-8 text-center">
        <RouterLink to="/products">
          <AppButton variant="ghost" size="md">
            <span>View All Modules in Full Marketplace</span>
            <AppIcon name="arrow-right" :size="16" />
          </AppButton>
        </RouterLink>
      </div>
    </section>

    <!-- VALUE PROPOSITION: PLAIN WORDS & ACCESSIBLE ERP -->
    <section class="bg-stone-subtle border-y border-stone-border py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-white p-6 rounded-2xl border border-stone-border shadow-2xs space-y-3">
            <div class="w-10 h-10 rounded-xl bg-signal-subtle text-signal flex items-center justify-center">
              <AppIcon name="zap" :size="20" />
            </div>
            <h4 class="text-lg font-bold text-ink font-heading">
              Plain Words, Zero Jargon
            </h4>
            <p class="text-sm text-ink-muted leading-relaxed">
              We ditched confusing acronyms. Instead of obscure ledger codes, your team sees "Customer owes", "Create delivery", and "Payment received".
            </p>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-stone-border shadow-2xs space-y-3">
            <div class="w-10 h-10 rounded-xl bg-status-green-bg text-status-green flex items-center justify-center">
              <AppIcon name="shield" :size="20" />
            </div>
            <h4 class="text-lg font-bold text-ink font-heading">
              Role-Tailored Workspaces
            </h4>
            <p class="text-sm text-ink-muted leading-relaxed">
              Sales Reps see their daily targets; Storekeepers only see packing dispatches; Accountants review invoices read-only. Clean and focused.
            </p>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-stone-border shadow-2xs space-y-3">
            <div class="w-10 h-10 rounded-xl bg-status-blue-bg text-status-blue flex items-center justify-center">
              <AppIcon name="layers" :size="20" />
            </div>
            <h4 class="text-lg font-bold text-ink font-heading">
              High-Performance ERP Core
            </h4>
            <p class="text-sm text-ink-muted leading-relaxed">
              Architected from the ground up to connect cleanly with ERPNext DocTypes: Quotation, Sales Order, Delivery Note, and Payment Entry.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FINAL CTA BANNER -->
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-ink-navy text-white rounded-3xl p-8 sm:p-12 shadow-lift border border-ink-deep flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div class="space-y-3">
          <Badge variant="signal" size="sm">Get Started in 60 Seconds</Badge>
          <h2 class="text-2xl sm:text-3xl font-black font-heading tracking-tight">
            Ready to streamline your sales operations?
          </h2>
          <p class="text-sm text-stone-bg/70 max-w-lg">
            Spin up a dedicated organization workspace, invite your team, and test the entire sales cycle right away.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 shrink-0">
          <RouterLink to="/checkout">
            <AppButton variant="primary" size="lg" block>
              Start Free Trial
            </AppButton>
          </RouterLink>
          <RouterLink to="/sign-in">
            <AppButton variant="outline" size="lg" block>
              Sign In
            </AppButton>
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
