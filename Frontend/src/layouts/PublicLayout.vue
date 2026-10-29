<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import CommandPalette from '@/components/layout/CommandPalette.vue'

const mobileMenuOpen = ref(false)

const navLinks = [
  { name: 'Products', path: '/products' },
  { name: 'Solutions', path: '/solutions' },
  { name: 'Solutions', path: '/solutions' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'Help & Docs', path: '/help' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-stone-bg text-ink selection:bg-signal-subtle selection:text-signal">
    <!-- Top Announcement Bar -->
    <div class="bg-ink-navy text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
      <span class="w-1.5 h-1.5 rounded-full bg-signal" />
      <span>Adadiko Hub Enterprise Cloud — Powered by High-Performance Architecture.</span>
      <RouterLink to="/checkout" class="underline text-signal hover:text-white ml-1">
        Get Started Free →
      </RouterLink>
    </div>

    <!-- Navigation Header -->
    <header class="sticky top-0 z-30 bg-stone-bg/90 backdrop-blur-md border-b border-stone-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2.5 group">
          <div class="w-9 h-9 rounded-xl bg-ink-navy flex items-center justify-center text-white font-heading font-black text-xl tracking-tighter group-hover:bg-signal transition-colors">
            A
          </div>
          <div class="flex flex-col">
            <span class="text-lg font-black tracking-tight text-ink font-heading leading-tight">
              Adadiko <span class="text-signal">Hub</span>
            </span>
            <span class="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
              Modular Business Suite
            </span>
          </div>
        </RouterLink>

        <!-- Desktop Navigation Links -->
        <nav class="hidden md:flex items-center gap-7">
          <RouterLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            active-class="text-signal font-semibold"
          >
            {{ link.name }}
          </RouterLink>
        </nav>

        <!-- Actions -->
        <div class="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <RouterLink to="/sign-in">
            <AppButton variant="ghost" size="sm">
              Sign In
            </AppButton>
          </RouterLink>
          <RouterLink to="/checkout">
            <AppButton variant="primary" size="sm">
              Start Free Trial
            </AppButton>
          </RouterLink>
        </div>

        <!-- Mobile Hamburger Toggle -->
        <button
          type="button"
          class="md:hidden p-2 rounded-lg text-ink hover:bg-stone-muted"
          aria-label="Toggle Navigation Menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <AppIcon :name="mobileMenuOpen ? 'x' : 'command'" :size="20" />
        </button>
      </div>

      <!-- Mobile dropdown -->
      <div v-if="mobileMenuOpen" class="md:hidden border-b border-stone-border bg-stone-bg px-4 py-4 space-y-3">
        <RouterLink
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          class="block py-2 text-sm font-medium text-ink"
          @click="mobileMenuOpen = false"
        >
          {{ link.name }}
        </RouterLink>
        <div class="pt-3 border-t border-stone-border flex flex-col gap-2">
          <div class="flex items-center justify-between py-1">
            <span class="text-xs font-medium text-ink-muted">Appearance</span>
            <ThemeToggle size="sm" showLabel />
          </div>
          <RouterLink to="/sign-in" @click="mobileMenuOpen = false">
            <AppButton variant="outline" size="sm" block>
              Sign In
            </AppButton>
          </RouterLink>
          <RouterLink to="/checkout" @click="mobileMenuOpen = false">
            <AppButton variant="primary" size="sm" block>
              Start Free Trial
            </AppButton>
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- Main Public Content View -->
    <main class="flex-1">
      <RouterView />
    </main>

    <!-- Footer -->
    <footer class="bg-ink-navy text-stone-bg/80 border-t border-ink-deep pt-16 pb-12 mt-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-ink-muted/30">
          <div class="md:col-span-2 space-y-4">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-signal flex items-center justify-center text-white font-heading font-black text-lg">
                A
              </div>
              <span class="text-xl font-black text-white font-heading">
                Adadiko Hub
              </span>
            </div>
            <p class="text-sm text-stone-bg/70 max-w-sm leading-relaxed">
              White-label modular business software assembled around your operational reality. Deploy the Sales module today; unlock Inventory, Purchasing, and Finance on demand.
            </p>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-deep border border-ink-muted/40 text-xs text-stone-bg/90">
              <span class="w-2 h-2 rounded-full bg-status-green" />
              <span>Enterprise Cloud Engine Active</span>
            </div>
          </div>

          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-white mb-3 font-heading">
              Modules
            </h4>
            <ul class="space-y-2 text-sm">
              <li><RouterLink to="/products/sales" class="hover:text-white transition-colors">Sales & CRM</RouterLink></li>
              <li><RouterLink to="/products/inventory" class="hover:text-white transition-colors">Inventory & Stock</RouterLink></li>
              <li><RouterLink to="/products/purchasing" class="hover:text-white transition-colors">Purchasing</RouterLink></li>
              <li><RouterLink to="/products/finance" class="hover:text-white transition-colors">Finance & Ledger</RouterLink></li>
              <li><RouterLink to="/products/manufacturing" class="hover:text-white transition-colors">Manufacturing</RouterLink></li>
            </ul>
          </div>

          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-white mb-3 font-heading">
              Platform
            </h4>
            <ul class="space-y-2 text-sm">
              <li><RouterLink to="/solutions" class="hover:text-white transition-colors">Wholesale & Distribution</RouterLink></li>
              <li><RouterLink to="/pricing" class="hover:text-white transition-colors">Pricing & Plans</RouterLink></li>
              <li><RouterLink to="/help" class="hover:text-white transition-colors">Help Center</RouterLink></li>
            </ul>
          </div>

          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-white mb-3 font-heading">
              Sign In & Access
            </h4>
            <ul class="space-y-2 text-sm">
              <li><RouterLink to="/sign-in" class="hover:text-white transition-colors">Sign in to workspace</RouterLink></li>
              <li><RouterLink to="/checkout" class="hover:text-white transition-colors">Start a new workspace</RouterLink></li>
            </ul>
          </div>
        </div>

        <div class="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-bg/50 gap-4">
          <p>© 2026 Adadiko Systems Inc. All rights reserved. Enterprise Cloud Edition.</p>
          <div class="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Architecture</span>
          </div>
        </div>
      </div>
    </footer>

    <!-- Global Command Palette -->
    <CommandPalette />
  </div>
</template>
