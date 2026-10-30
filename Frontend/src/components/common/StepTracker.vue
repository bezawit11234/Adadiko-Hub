<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import type { OrderStage } from '@/types'

const props = withDefaults(
  defineProps<{
    currentStage: OrderStage
    steps?: OrderStage[]
    isCompleted?: boolean
    hasQuotation?: boolean
  }>(),
  {
    steps: () => ['Quotation', 'Sales Order', 'Delivery', 'Invoice', 'Payment'],
    isCompleted: false,
    hasQuotation: false,
  }
)

const currentIndex = computed(() => {
  if (props.isCompleted) return props.steps.length
  const idx = props.steps.indexOf(props.currentStage)
  return idx >= 0 ? idx : 0
})

function getStepState(idx: number): 'completed' | 'current' | 'upcoming' | 'skipped' {
  if (idx === 0 && !props.hasQuotation) return 'skipped'
  if (props.isCompleted || idx < currentIndex.value) return 'completed'
  if (idx === currentIndex.value) return 'current'
  return 'upcoming'
}

function getStepLabel(step: string, idx: number): string {
  if (idx === 0 && !props.hasQuotation) {
    return 'No quotation (order created directly)'
  }
  return step
}
</script>

<template>
  <div class="w-full bg-white p-4 sm:p-5 rounded-2xl border border-stone-border shadow-soft">
    <div class="flex items-center justify-between relative">
      <div
        v-for="(step, idx) in steps"
        :key="step"
        class="flex-1 flex flex-col items-center relative text-center group"
      >
        <!-- Connecting Line between steps -->
        <div
          v-if="idx > 0"
          :class="[
            'absolute top-4 -left-1/2 w-full h-[2px] -z-0 transition-colors duration-300',
            idx === 1 && !hasQuotation
              ? 'bg-stone-border'
              : idx <= currentIndex
              ? 'bg-signal'
              : 'bg-stone-border',
          ]"
        />

        <!-- Step Circle Indicator -->
        <div class="relative z-10 flex items-center justify-center">
          <!-- Step 0 with no quotation: grey circle with dash -->
          <div
            v-if="getStepState(idx) === 'skipped'"
            class="w-8 h-8 rounded-full bg-stone-bg text-ink-muted border border-stone-border flex items-center justify-center text-xs font-bold"
            title="No quotation (order created directly)"
          >
            <span>—</span>
          </div>

          <div
            v-else-if="getStepState(idx) === 'completed'"
            class="w-8 h-8 rounded-full bg-status-green text-white flex items-center justify-center shadow-xs transition-transform duration-200"
            :title="`${step}: Completed`"
          >
            <AppIcon name="check" :size="14" />
          </div>

          <div
            v-else-if="getStepState(idx) === 'current'"
            class="w-8 h-8 rounded-full bg-signal text-white flex items-center justify-center ring-4 ring-signal/20 font-bold text-xs shadow-sm transition-transform duration-200"
            :title="`${step}: In Progress`"
          >
            <span>{{ idx + 1 }}</span>
          </div>

          <div
            v-else
            class="w-8 h-8 rounded-full bg-stone-bg text-ink-light border border-stone-border flex items-center justify-center text-xs font-semibold"
            :title="`${step}: Upcoming`"
          >
            <span>{{ idx + 1 }}</span>
          </div>
        </div>

        <!-- Step Label -->
        <span
          :class="[
            'mt-2 text-xs font-medium tracking-tight px-1',
            getStepState(idx) === 'skipped'
              ? 'text-ink-muted italic'
              : getStepState(idx) === 'current'
              ? 'text-signal font-bold'
              : getStepState(idx) === 'completed'
              ? 'text-ink font-semibold'
              : 'text-ink-muted',
          ]"
        >
          {{ getStepLabel(step, idx) }}
        </span>
      </div>
    </div>
  </div>
</template>
