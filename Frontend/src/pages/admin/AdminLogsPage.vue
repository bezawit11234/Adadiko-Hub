<script setup lang="ts">
import { ref } from 'vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'

const logs = ref([
  { id: 'LOG-8812', timestamp: '2026-03-12 10:14:22', level: 'INFO', event: 'Frappe REST Dispatch', tenant: 'Apex Wholesale Ltd', details: 'POST /api/resource/Sales Order (SO-2026-0104)' },
  { id: 'LOG-8811', timestamp: '2026-03-12 10:02:15', level: 'AUTH', event: 'User Sign In', tenant: 'Apex Wholesale Ltd', details: 'User sarah.mgr@adadiko.demo authenticated successfully' },
  { id: 'LOG-8810', timestamp: '2026-03-12 09:45:00', level: 'SYSTEM', event: 'Database Backup', tenant: 'System Cluster', details: 'Automated snapshot tenant_db_acme completed (42ms)' },
  { id: 'LOG-8809', timestamp: '2026-03-12 08:30:19', level: 'INFO', event: 'Module License Check', tenant: 'Horizon Solar Ltd', details: 'Validated permissions for module: sales, inventory' },
  { id: 'LOG-8808', timestamp: '2026-03-11 18:22:40', level: 'WARN', event: 'Rate Limit Warning', tenant: 'Sahara Grocers', details: 'Tenant approaching 80% hourly Frappe API quota' },
])

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

    <DataTable :columns="columns" :rows="logs">
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
