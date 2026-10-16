<script setup lang="ts">
import { ref } from 'vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatDate } from '@/utils/format'

const clients = ref([
  {
    id: 'org_acme',
    name: 'Apex Wholesale Ltd',
    plan: 'growth',
    modules: ['sales'],
    adminEmail: 'marcus.admin@adadiko.demo',
    status: 'Active',
    joinedDate: '2026-01-15',
  },
  {
    id: 'org_bluenile',
    name: 'Blue Nile Trading PLC',
    plan: 'starter',
    modules: ['sales'],
    adminEmail: 'admin@bluenile.example',
    status: 'Active',
    joinedDate: '2026-01-28',
  },
  {
    id: 'org_horizon',
    name: 'Horizon Smart Solar Ltd',
    plan: 'enterprise',
    modules: ['sales', 'inventory', 'purchasing'],
    adminEmail: 'ops@horizon-solar.example',
    status: 'Active',
    joinedDate: '2026-02-10',
  },
  {
    id: 'org_sahara',
    name: 'Sahara Grocers Cooperative',
    plan: 'growth',
    modules: ['sales'],
    adminEmail: 'finance@saharagrocers.example',
    status: 'Trial',
    joinedDate: '2026-03-01',
  },
])

const columns: Column[] = [
  { key: 'name', label: 'Client Organization' },
  { key: 'plan', label: 'Subscription Plan' },
  { key: 'modules', label: 'Subscribed Modules' },
  { key: 'adminEmail', label: 'Primary Admin' },
  { key: 'joinedDate', label: 'Provisioned Date' },
  { key: 'status', label: 'Status' },
]
</script>

<template>
  <PageContainer max-width="2xl">
    <SampleNotice text="Back Office Client Directory: Tenant organizations provisioned across Adadiko multi-tenant infrastructure." />

    <SectionHeading
      title="Client Organizations"
      description="Manage tenant organizations, inspect active subscriptions, and view primary administrator contacts."
    >
      <template #badge>
        <Badge variant="signal" size="sm">{{ clients.length }} Tenants</Badge>
      </template>
    </SectionHeading>

    <DataTable :columns="columns" :rows="clients">
      <template #name="{ row }">
        <div>
          <span class="font-bold text-ink">{{ row.name }}</span>
          <p class="text-xs font-mono text-ink-muted">{{ row.id }}</p>
        </div>
      </template>

      <template #plan="{ value }">
        <span class="text-xs font-bold uppercase tracking-wider text-ink font-heading">
          {{ value }}
        </span>
      </template>

      <template #modules="{ value }">
        <div class="flex flex-wrap gap-1">
          <span
            v-for="m in value"
            :key="m"
            class="px-2 py-0.5 rounded text-[10px] bg-signal-subtle text-signal font-bold uppercase"
          >
            {{ m }}
          </span>
        </div>
      </template>

      <template #adminEmail="{ value }">
        <span class="text-xs text-ink-muted font-mono">{{ value }}</span>
      </template>

      <template #joinedDate="{ value }">
        <span class="text-xs text-ink-muted">{{ formatDate(value) }}</span>
      </template>

      <template #status="{ value }">
        <Badge :variant="value === 'Active' ? 'success' : 'warning'" size="sm" dot>
          {{ value }}
        </Badge>
      </template>
    </DataTable>
  </PageContainer>
</template>
