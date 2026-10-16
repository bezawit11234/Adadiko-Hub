<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import CommandPalette from '@/components/layout/CommandPalette.vue'
</script>

<template>
  <div class="min-h-screen bg-stone-bg flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-signal-subtle selection:text-signal">
    <!-- Top Bar -->
    <div class="max-w-md w-full mx-auto flex items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-ink-navy flex items-center justify-center text-white font-heading font-black text-lg">
          A
        </div>
        <span class="text-lg font-black tracking-tight text-ink font-heading">
          Adadiko <span class="text-signal">Next</span>
        </span>
      </RouterLink>

      <RouterLink to="/" class="text-xs font-semibold text-ink-muted hover:text-ink">
        ← Back to website
      </RouterLink>
    </div>

    <!-- Centered Form Container -->
    <div class="max-w-md w-full mx-auto my-8">
      <div class="bg-white rounded-2xl border border-stone-border shadow-card p-6 sm:p-8">
        <RouterView />
      </div>
    </div>

    <!-- Bottom Footer -->
    <div class="max-w-md w-full mx-auto text-center text-xs text-ink-light space-y-2">
      <p>Secure client workspace powered by ERPNext / Frappe v16.</p>
      <div class="flex items-center justify-center gap-4">
        <RouterLink to="/help" class="hover:underline">Help & Support</RouterLink>
        <span>•</span>
        <RouterLink to="/demo" class="hover:underline">Demo Accounts</RouterLink>
      </div>
    </div>

    <CommandPalette />
  </div>
</template>
