<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'

export type DocumentStepName =
  | 'Lead'
  | 'Opportunity'
  | 'Quotation'
  | 'Sales Order'
  | 'Delivery'
  | 'Invoice'
  | 'Payment'

export interface StepInfo {
  step: DocumentStepName
  label?: string
  docId?: string
  linkPath?: string
  isCurrent?: boolean
  notUsed?: boolean
  status?: string
}

const props = withDefaults(
  defineProps<{
    currentDocType: DocumentStepName
    stepsData?: Partial<Record<DocumentStepName, { docId?: string; notUsed?: boolean; status?: string; linkPath?: string }>>
    nextStepLabel?: string
    nextStepAction?: () => void
    nextStepDisabled?: boolean
    nextStepTitle?: string
  }>(),
  {
    stepsData: () => ({}),
    nextStepDisabled: false,
  }
)

const emit = defineEmits<{
  (e: 'next-step'): void
}>()

const router = useRouter()

const ALL_STEPS: DocumentStepName[] = [
  'Lead',
  'Opportunity',
  'Quotation',
  'Sales Order',
  'Delivery',
  'Invoice',
  'Payment',
]

function getStepRoute(step: DocumentStepName, docId?: string): string {
  if (!docId) return ''
  switch (step) {
    case 'Lead':
      return `/app/sales/leads?id=${encodeURIComponent(docId)}`
    case 'Opportunity':
      return `/app/sales/opportunities?id=${encodeURIComponent(docId)}`
    case 'Quotation':
      return `/app/sales/quotations?id=${encodeURIComponent(docId)}`
    case 'Sales Order':
      return `/app/sales/orders/${encodeURIComponent(docId)}`
    case 'Delivery':
      return `/app/sales/deliveries?id=${encodeURIComponent(docId)}`
    case 'Invoice':
      return `/app/sales/invoices/${encodeURIComponent(docId)}`
    case 'Payment':
      return `/app/sales/payments?id=${encodeURIComponent(docId)}`
    default:
      return ''
  }
}

const processedSteps = computed(() => {
  const currentIndex = ALL_STEPS.indexOf(props.currentDocType)

  return ALL_STEPS.map((step, idx) => {
    const data = props.stepsData[step]
    const docId = data?.docId
    const notUsed = !!data?.notUsed
    const hasDoc = !!docId && !notUsed
    const isCurrent = step === props.currentDocType
    const linkPath = data?.linkPath || getStepRoute(step, docId)

    // A step is green only if a real linked document exists
    const isGreen = hasDoc

    // Label under step
    let statusLabel = 'not yet'
    if (notUsed) {
      statusLabel = 'not used'
    } else if (hasDoc) {
      statusLabel = docId
    } else if (idx < currentIndex) {
      statusLabel = 'not used'
    }

    return {
      step,
      idx,
      docId,
      notUsed,
      hasDoc,
      isGreen,
      isCurrent,
      statusLabel,
      linkPath,
    }
  })
})

// Default context-sensitive next step computation
const computedNextStep = computed(() => {
  if (props.nextStepLabel) {
    return {
      label: props.nextStepLabel,
      action: props.nextStepAction || (() => emit('next-step')),
      disabled: props.nextStepDisabled,
      title: props.nextStepTitle || '',
    }
  }

  const soData = props.stepsData['Sales Order']
  const dnData = props.stepsData['Delivery']
  const invData = props.stepsData['Invoice']
  const payData = props.stepsData['Payment']

  switch (props.currentDocType) {
    case 'Lead':
      return {
        label: 'Create Opportunity',
        action: () => emit('next-step'),
        disabled: props.nextStepDisabled,
      }
    case 'Opportunity':
      return {
        label: 'Create Quotation',
        action: () => emit('next-step'),
        disabled: props.nextStepDisabled,
      }
    case 'Quotation':
      return {
        label: 'Create Sales Order',
        action: () => emit('next-step'),
        disabled: props.nextStepDisabled,
      }
    case 'Sales Order':
      if (!dnData?.docId && !dnData?.notUsed) {
        return {
          label: 'Create Delivery Note',
          action: () => emit('next-step'),
          disabled: props.nextStepDisabled,
        }
      }
      if (!invData?.docId) {
        return {
          label: 'Create Sales Invoice',
          action: () => emit('next-step'),
          disabled: props.nextStepDisabled,
        }
      }
      if (!payData?.docId) {
        return {
          label: 'Record Payment',
          action: () => emit('next-step'),
          disabled: props.nextStepDisabled,
        }
      }
      return {
        label: 'Order Completed',
        action: () => {},
        disabled: true,
      }
    case 'Delivery':
      return {
        label: 'Create Sales Invoice',
        action: () => emit('next-step'),
        disabled: props.nextStepDisabled,
      }
    case 'Invoice':
      if (payData?.docId) {
        return {
          label: 'Invoice Paid',
          action: () => {},
          disabled: true,
        }
      }
      return {
        label: 'Record Payment',
        action: () => emit('next-step'),
        disabled: props.nextStepDisabled,
      }
    case 'Payment':
      return {
        label: 'Payment Settled',
        action: () => {},
        disabled: true,
      }
    default:
      return {
        label: 'Next Step',
        action: () => emit('next-step'),
        disabled: props.nextStepDisabled,
      }
  }
})

function handleNextStep() {
  if (computedNextStep.value.disabled) return
  if (props.nextStepAction) {
    props.nextStepAction()
  } else {
    computedNextStep.value.action()
  }
}
</script>

<template>
  <div class="w-full bg-white p-4 sm:p-5 rounded-2xl border border-stone-border shadow-soft">
    <!-- Header with Next Step button -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-border/60">
      <div>
        <div class="text-[11px] font-mono uppercase tracking-wider text-ink-muted">ERPNext Sales Lifecycle</div>
        <div class="text-xs font-semibold text-ink flex items-center gap-1.5 mt-0.5">
          <span>Current Document:</span>
          <span class="px-2 py-0.5 rounded-full bg-signal-subtle text-signal font-bold text-[11px]">
            {{ currentDocType }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="handleNextStep"
          :disabled="computedNextStep.disabled"
          :class="[
            'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer',
            computedNextStep.disabled
              ? 'bg-stone-subtle text-ink-muted border border-stone-border opacity-70 cursor-not-allowed'
              : 'bg-signal hover:bg-signal-hover active:bg-signal-hover text-white shadow-signal/20'
          ]"
          :title="computedNextStep.title || computedNextStep.label"
        >
          <span>{{ computedNextStep.label }}</span>
          <AppIcon name="arrow-right" :size="14" v-if="!computedNextStep.disabled" />
          <AppIcon name="check" :size="14" v-else />
        </button>
      </div>
    </div>

    <!-- Stepper Pipeline -->
    <div class="flex items-start justify-between relative overflow-x-auto pt-1 pb-2">
      <div
        v-for="(st, idx) in processedSteps"
        :key="st.step"
        class="flex-1 min-w-[90px] flex flex-col items-center relative text-center px-1"
      >
        <!-- Connecting Line -->
        <div
          v-if="idx > 0"
          :class="[
            'absolute top-4 -left-1/2 w-full h-[2px] -z-0 transition-colors duration-200',
            st.isGreen
              ? 'bg-status-green'
              : 'bg-stone-border'
          ]"
        />

        <!-- Step Circle -->
        <div class="relative z-10 flex items-center justify-center">
          <!-- Green Circle when real document exists -->
          <component
            :is="st.linkPath ? RouterLink : 'div'"
            :to="st.linkPath || undefined"
            v-if="st.isGreen"
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-transform hover:scale-105',
              st.isCurrent
                ? 'bg-status-green text-white ring-4 ring-status-green/30'
                : 'bg-status-green text-white hover:bg-emerald-600'
            ]"
            :title="`${st.step}: ${st.docId || 'Linked'}`"
          >
            <AppIcon name="check" :size="14" />
          </component>

          <!-- Current Step without docId yet -->
          <div
            v-else-if="st.isCurrent"
            class="w-8 h-8 rounded-full bg-signal text-white flex items-center justify-center ring-4 ring-signal/20 font-bold text-xs shadow-sm"
            :title="`${st.step}: Current Document`"
          >
            <span>{{ idx + 1 }}</span>
          </div>

          <!-- Skipped / Not used -->
          <div
            v-else-if="st.notUsed"
            class="w-8 h-8 rounded-full bg-stone-subtle text-ink-muted border border-stone-border flex items-center justify-center text-xs font-bold"
            title="Step not used in this workflow"
          >
            <span>—</span>
          </div>

          <!-- Upcoming / Not yet reached -->
          <div
            v-else
            class="w-8 h-8 rounded-full bg-stone-bg text-ink-muted border border-stone-border flex items-center justify-center text-xs font-semibold"
            :title="`${st.step}: Not yet created`"
          >
            <span>{{ idx + 1 }}</span>
          </div>
        </div>

        <!-- Step Name -->
        <div class="mt-2 text-xs font-bold text-ink">
          {{ st.step }}
        </div>

        <!-- Document ID or Not Used / Not Yet badge -->
        <div class="mt-0.5">
          <component
            :is="st.linkPath ? RouterLink : 'span'"
            :to="st.linkPath || undefined"
            v-if="st.hasDoc"
            class="text-[10px] font-mono text-signal hover:underline font-semibold block truncate max-w-[85px]"
            :title="st.docId"
          >
            {{ st.docId }}
          </component>

          <span
            v-else-if="st.notUsed"
            class="text-[10px] text-ink-muted italic block"
          >
            not used
          </span>

          <span
            v-else
            class="text-[10px] text-ink-muted/80 block"
          >
            not yet
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
