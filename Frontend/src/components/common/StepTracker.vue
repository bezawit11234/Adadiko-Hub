<script setup lang="ts">
import { computed } from 'vue'
import DocumentStepTracker, { type DocumentStepName } from './DocumentStepTracker.vue'
import type { OrderStage } from '@/types'

const props = withDefaults(
  defineProps<{
    currentStage?: OrderStage
    currentDocType?: DocumentStepName
    stepsData?: Partial<Record<DocumentStepName, { docId?: string; notUsed?: boolean; status?: string; linkPath?: string }>>
    isCompleted?: boolean
    hasQuotation?: boolean
    quotationId?: string
    salesOrderId?: string
    deliveryNoteId?: string
    invoiceId?: string
    paymentId?: string
    nextStepLabel?: string
    nextStepAction?: () => void
  }>(),
  {
    currentStage: 'Sales Order',
    isCompleted: false,
    hasQuotation: false,
  }
)

const emit = defineEmits<{
  (e: 'next-step'): void
}>()

const computedDocType = computed<DocumentStepName>(() => {
  if (props.currentDocType) return props.currentDocType
  switch (props.currentStage) {
    case 'Quotation':
      return 'Quotation'
    case 'Sales Order':
      return 'Sales Order'
    case 'Delivery':
      return 'Delivery'
    case 'Invoice':
      return 'Invoice'
    case 'Payment':
      return 'Payment'
    default:
      return 'Sales Order'
  }
})

const mergedStepsData = computed(() => {
  if (props.stepsData && Object.keys(props.stepsData).length > 0) {
    return props.stepsData
  }

  return {
    'Lead': { notUsed: true },
    'Opportunity': { notUsed: true },
    'Quotation': {
      docId: props.quotationId,
      notUsed: !props.hasQuotation && !props.quotationId,
    },
    'Sales Order': {
      docId: props.salesOrderId,
    },
    'Delivery': {
      docId: props.deliveryNoteId,
    },
    'Invoice': {
      docId: props.invoiceId,
    },
    'Payment': {
      docId: props.paymentId || (props.isCompleted ? 'PAID' : undefined),
    },
  }
})
</script>

<template>
  <DocumentStepTracker
    :current-doc-type="computedDocType"
    :steps-data="mergedStepsData"
    :next-step-label="nextStepLabel"
    :next-step-action="nextStepAction"
    @next-step="emit('next-step')"
  />
</template>
