<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import TextField from '@/components/common/TextField.vue'

const searchQuery = ref('')

const faqs = [
  {
    q: 'How does Adadiko Hub connect with ERPNext / Frappe v16?',
    a: 'Adadiko Hub screens interact strictly via our typed Service layer (SalesApi, AuthApi). In this mock phase, data is handled by in-memory reactive state. In the upcoming Frappe phase, FrappeSalesApi calls the ERPNext REST endpoints (like erpnext.selling.doctype.sales_order.sales_order.make_delivery_note).',
  },
  {
    q: 'Can our company add modules after signing up?',
    a: 'Yes! Organization admins can visit Workspace Plan (/app/plan) at any time to toggle on additional business modules such as Inventory, Purchasing, and Finance.',
  },
  {
    q: 'What role differences exist in the Sales module?',
    a: 'Sales Reps see only their assigned customers and orders; Sales Managers see aggregate revenue metrics, SVG pipeline charts, and pending discount approvals; Accountants access invoices and record payments read-only; Storekeepers handle delivery packing dispatches.',
  },
  {
    q: 'Why are plain words used instead of ERP jargon?',
    a: 'Adadiko Hub is designed for fast staff onboarding. Instead of "Accounts Receivable Aging Balance" we display "Customer owes", and instead of "Submit Stock Entry Dispatch" we display "Create delivery".',
  },
]
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
    <div class="text-center space-y-3">
      <Badge variant="signal" size="sm">Knowledge Base</Badge>
      <h1 class="text-3xl sm:text-4xl font-black text-ink font-heading tracking-tight">
        Adadiko Hub Documentation & Help
      </h1>
      <p class="text-sm text-ink-muted">
        Everything you need to know about our modular business suite and Frappe integration.
      </p>
    </div>

    <!-- Search Input -->
    <div class="max-w-xl mx-auto">
      <TextField v-model="searchQuery" placeholder="Search questions or topics...">
        <template #prefix>
          <AppIcon name="search" :size="16" />
        </template>
      </TextField>
    </div>

    <!-- FAQ Accordion / Cards -->
    <div class="space-y-4">
      <div
        v-for="(faq, idx) in faqs"
        :key="idx"
        class="bg-white p-6 rounded-2xl border border-stone-border shadow-soft space-y-2"
      >
        <h3 class="text-base font-bold text-ink font-heading flex items-start gap-2.5">
          <AppIcon name="help-circle" :size="18" className="text-signal shrink-0 mt-0.5" />
          <span>{{ faq.q }}</span>
        </h3>
        <p class="text-sm text-ink-muted leading-relaxed pl-7">
          {{ faq.a }}
        </p>
      </div>
    </div>
  </div>
</template>
