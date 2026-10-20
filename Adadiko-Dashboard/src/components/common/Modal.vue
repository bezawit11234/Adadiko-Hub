<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    isOpen?: boolean
    show?: boolean
    title: string
    subtitle?: string
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    maxWidth: 'md',
  }
)

const activeOpen = computed(() => props.isOpen ?? props.show ?? false)

const emit = defineEmits<{
  (e: 'close'): void
}>()

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && activeOpen.value) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})

watch(
  () => activeOpen.value,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="activeOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-deep/60 backdrop-blur-xs"
        @click.self="$emit('close')"
      >
        <div
          :class="[
            'w-full bg-white rounded-2xl border border-stone-border shadow-modal overflow-hidden flex flex-col max-h-[90vh]',
            maxWidth === 'sm' ? 'max-w-md' : '',
            maxWidth === 'md' ? 'max-w-lg' : '',
            maxWidth === 'lg' ? 'max-w-2xl' : '',
            maxWidth === 'xl' ? 'max-w-4xl' : '',
          ]"
          role="dialog"
          aria-modal="true"
        >
          <!-- Modal Header -->
          <div class="px-6 py-4.5 border-b border-stone-border flex items-center justify-between bg-stone-bg/40">
            <div>
              <h2 class="text-lg font-bold text-ink font-heading">
                {{ title }}
              </h2>
              <p v-if="subtitle" class="text-xs text-ink-muted mt-0.5">
                {{ subtitle }}
              </p>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-stone-muted transition-colors"
              aria-label="Close dialog"
              @click="$emit('close')"
            >
              <AppIcon name="x" :size="18" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="px-6 py-5 overflow-y-auto space-y-4">
            <slot />
          </div>

          <!-- Modal Footer -->
          <div
            v-if="$slots.footer"
            class="px-6 py-3.5 bg-stone-subtle border-t border-stone-border flex items-center justify-end gap-2.5"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
