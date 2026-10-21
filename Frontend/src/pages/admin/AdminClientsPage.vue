<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import { formatDate } from '@/utils/format'

interface ClientRow {
  id: string
  name: string
  plan: string
  modules: string[]
  adminEmail: string
  status: string
  joinedDate: string
}

const clients = ref<ClientRow[]>([])

onMounted(() => {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('adadiko_mock_accounts')
      if (raw) {
        const accounts = JSON.parse(raw)
        clients.value = accounts.map((acc: any) => ({
          id: acc.organization?.id || acc.user?.organizationId || 'org_client',
          name: acc.organization?.name || `${acc.user?.name || 'Client'}'s Organization`,
          plan: acc.organization?.plan || 'starter',
          modules: acc.organization?.subscribedModules || ['sales'],
          adminEmail: acc.user?.email || 'admin@example.com',
          status: acc.organization?.status === 'active' ? 'Active' : 'Trial',
          joinedDate: acc.organization?.createdDate || new Date().toISOString().split('T')[0],
        }))
      }
    } catch {
      clients.value = []
    }
  }
})

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

    <DataTable
      :columns="columns"
      :rows="clients"
      empty-title="No client organizations registered yet"
      empty-description="When clients sign up or complete checkout, their provisioned tenant records will appear here."
    >
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
