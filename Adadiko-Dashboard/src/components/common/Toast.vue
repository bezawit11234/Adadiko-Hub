<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import AppIcon from './AppIcon.vue'

const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4"
    >
      <TransitionGroup
        enter-active-class="transform ease-out duration-200 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto rounded-xl border border-stone-border bg-stone-surface p-4 shadow-lift flex items-start gap-3"
        >
          <div class="shrink-0 mt-0.5">
            <div
              v-if="toast.type === 'success'"
              class="w-6 h-6 rounded-full bg-status-green-bg text-status-green flex items-center justify-center"
            >
              <AppIcon name="check" :size="14" />
            </div>
            <div
              v-else-if="toast.type === 'error'"
              class="w-6 h-6 rounded-full bg-status-red-bg text-status-red flex items-center justify-center"
            >
              <AppIcon name="alert-circle" :size="14" />
            </div>
            <div
              v-else-if="toast.type === 'warning'"
              class="w-6 h-6 rounded-full bg-status-amber-bg text-status-amber flex items-center justify-center"
            >
              <AppIcon name="alert-triangle" :size="14" />
            </div>
            <div
              v-else
              class="w-6 h-6 rounded-full bg-signal-subtle text-signal flex items-center justify-center"
            >
              <AppIcon name="sparkles" :size="14" />
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-ink">
              {{ toast.title }}
            </p>
            <p v-if="toast.message" class="text-xs text-ink-muted mt-0.5">
              {{ toast.message }}
            </p>
          </div>

          <button
            type="button"
            class="shrink-0 text-ink-light hover:text-ink p-1 rounded-md"
            @click="dismiss(toast.id)"
          >
            <AppIcon name="x" :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
