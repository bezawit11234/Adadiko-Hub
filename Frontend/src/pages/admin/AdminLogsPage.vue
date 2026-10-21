<script setup lang="ts">
import { ref } from 'vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'

interface PlatformLog {
  id: string
  timestamp: string
  level: string
  event: string
  tenant: string
  details: string
}

const logs = ref<PlatformLog[]>([])

const columns: Column[] = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'level', label: 'Level' },
  { key: 'event', label: 'Event Type' },
  { key: 'tenant', label: 'Tenant Organization' },
  { key: 'details', label: 'Event Details' },
]
</script>

<template>
  <PageContainer max-width="2xl">
    <SampleNotice text="Back Office Platform Audit Logs: Comprehensive audit trail of Frappe API sync events and multi-tenant security logs." />

    <SectionHeading
      title="Platform Audit & System Logs"
      description="Inspect multi-tenant audit events, Frappe REST API invocations, and security logs."
    >
      <template #badge>
        <Badge variant="signal" size="sm">Audit Stream</Badge>
      </template>
    </SectionHeading>

    <DataTable
      :columns="columns"
      :rows="logs"
      empty-title="No system audit logs recorded yet"
      empty-description="System events, API dispatches, and authentication activity will be captured here."
    >
      <template #timestamp="{ value }">
        <span class="font-mono text-xs text-ink-muted">{{ value }}</span>
      </template>

      <template #level="{ value }">
        <Badge
          :variant="value === 'INFO' ? 'info' : value === 'WARN' ? 'warning' : 'neutral'"
          size="sm"
        >
          {{ value }}
        </Badge>
      </template>

      <template #event="{ value }">
        <span class="font-bold text-xs text-ink">{{ value }}</span>
      </template>

      <template #tenant="{ value }">
        <span class="text-xs text-ink-muted">{{ value }}</span>
      </template>

      <template #details="{ value }">
        <span class="font-mono text-xs text-ink-muted">{{ value }}</span>
      </template>
    </DataTable>
  </PageContainer>
</template>
