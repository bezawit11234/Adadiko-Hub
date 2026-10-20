<script setup lang="ts">
// Adadiko Dashboard — Staff Authentication Shell
</script>

<template>
  <div class="min-h-screen bg-stone-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <!-- Logo -->
      <div class="w-12 h-12 rounded-2xl bg-signal mx-auto flex items-center justify-center font-heading font-black text-white text-2xl shadow-lift">
        A
      </div>
      <h1 class="mt-4 font-heading font-bold text-2xl text-ink tracking-tight">
        Adadiko Dashboard
      </h1>
      <p class="mt-1 text-sm text-ink-muted">
        Internal Back Office &bull; Staff Authentication
      </p>
      <div class="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        <span>Adadiko Staff Only — Not for client accounts</span>
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
      <div class="bg-stone-surface py-8 px-6 shadow-card border border-stone-border rounded-2xl sm:px-10">
        <router-view />
      </div>
      
      <p class="mt-6 text-center text-xs text-ink-light">
        Looking for your company workspace?
        <span class="text-ink font-medium">Visit your client portal URL</span>
      </p>
    </div>
  </div>
</template>
