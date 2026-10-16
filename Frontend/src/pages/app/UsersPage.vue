<script setup lang="ts">
import { ref } from 'vue'
import { DEMO_USERS, ROLE_DEFINITIONS, ROLE_PERMISSIONS, type Permission } from '@/data/roles'
import { useSession } from '@/composables/useSession'
import { useToast } from '@/composables/useToast'
import type { User, Role } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import Field from '@/components/common/Field.vue'
import TextField from '@/components/common/TextField.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'

const { currentUser } = useSession()
const toast = useToast()

const users = ref<User[]>([
  DEMO_USERS.admin,
  DEMO_USERS.sales_manager,
  DEMO_USERS.sales_rep,
  DEMO_USERS.accountant,
  DEMO_USERS.storekeeper,
])

// Invite User Modal
const isInviteModalOpen = ref(false)
const inviteName = ref('')
const inviteEmail = ref('')
const inviteRole = ref<Role>('sales_rep')

const columns: Column[] = [
  { key: 'name', label: 'Team Member' },
  { key: 'email', label: 'Email Address' },
  { key: 'role', label: 'Workspace Role' },
  { key: 'erpnext', label: 'ERPNext Role Profile' },
  { key: 'status', label: 'Status' },
]

function handleInviteUser() {
  if (!inviteName.value || !inviteEmail.value) {
    toast.error('Validation error', 'Please provide a name and email address.')
    return
  }

  const newUser: User = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    name: inviteName.value,
    email: inviteEmail.value,
    role: inviteRole.value,
    organizationId: 'org_acme',
    isDemo: false,
  }

  users.value.push(newUser)
  toast.success('Invitation Sent', `Invitation emailed to ${inviteEmail.value} as ${ROLE_DEFINITIONS[inviteRole.value].label}.`)
  isInviteModalOpen.value = false
  inviteName.value = ''
  inviteEmail.value = ''
}

// Permission matrix keys
const permissionsList: { key: Permission; label: string }[] = [
  { key: 'sales:view_dashboard', label: 'View Revenue Dashboard & Analytics' },
  { key: 'sales:view_own_orders', label: 'View Own Assigned Orders' },
  { key: 'sales:view_all_orders', label: 'View All Organization Orders' },
  { key: 'sales:create_order', label: 'Create New Sales Orders' },
  { key: 'sales:approve_order', label: 'Approve Quotation / Discount Requests' },
  { key: 'sales:create_delivery', label: 'Create & Dispatch Delivery Notes' },
  { key: 'sales:view_invoices', label: 'View Sales Invoices & Receivables' },
  { key: 'sales:record_payment', label: 'Record Customer Payment Entries' },
  { key: 'admin:manage_users', label: 'Manage Team & Assign Roles' },
  { key: 'admin:manage_plan', label: 'Manage Plan & Subscribed Modules' },
]

const matrixRoles: Role[] = ['sales_rep', 'sales_manager', 'accountant', 'storekeeper', 'admin']
</script>

<template>
  <PageContainer max-width="2xl">
    <SampleNotice text="Team & Access Control: User profiles with Frappe v16 Role Profile mappings and Sales permission matrix." />

    <SectionHeading
      title="Team Members & Permissions"
      description="Manage staff members, invite coworkers, and inspect the Sales module permission hierarchy."
    >
      <template #badge>
        <Badge variant="signal" size="sm">{{ users.length }} Active Staff</Badge>
      </template>
      <template #actions>
        <AppButton variant="primary" size="sm" @click="isInviteModalOpen = true">
          <AppIcon name="plus" :size="16" />
          <span>Invite User</span>
        </AppButton>
      </template>
    </SectionHeading>

    <!-- Users Table -->
    <DataTable :columns="columns" :rows="users">
      <template #name="{ row }">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-ink-navy text-white flex items-center justify-center font-bold text-xs uppercase">
            {{ row.name.charAt(0) }}
          </div>
          <div>
            <span class="font-bold text-ink">{{ row.name }}</span>
            <span v-if="row.id === currentUser?.id" class="text-[10px] text-signal font-semibold ml-1.5">(You)</span>
          </div>
        </div>
      </template>

      <template #email="{ value }">
        <span class="text-xs text-ink-muted font-mono">{{ value }}</span>
      </template>

      <template #role="{ value }">
        <Badge variant="signal" size="sm">
          {{ ROLE_DEFINITIONS[value as Role]?.label }}
        </Badge>
      </template>

      <template #erpnext="{ row }">
        <span class="text-xs font-mono text-ink-muted">
          {{ ROLE_DEFINITIONS[row.role as Role]?.erpnextRole }}
        </span>
      </template>

      <template #status="{ row }">
        <Badge :variant="row.isDemo ? 'info' : 'success'" size="sm" dot>
          {{ row.isDemo ? 'Demo Account' : 'Active' }}
        </Badge>
      </template>
    </DataTable>

    <!-- ROLE-PERMISSION MATRIX FOR SALES -->
    <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 sm:p-8 space-y-4">
      <div class="pb-3 border-b border-stone-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 class="text-base font-bold text-ink font-heading flex items-center gap-2">
            <AppIcon name="shield" :size="18" className="text-signal" />
            <span>Sales Role-Permission Matrix</span>
          </h3>
          <p class="text-xs text-ink-muted">
            Defines operational visibility across the Quotation-to-Cash lifecycle.
          </p>
        </div>
        <span class="text-[11px] text-ink-light italic">
          Server-enforced in production via ERPNext Role Permissions
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-stone-bg/60 border-b border-stone-border text-[11px] uppercase tracking-wider text-ink-muted">
            <tr>
              <th class="px-4 py-3 font-semibold">Permission Action</th>
              <th v-for="r in matrixRoles" :key="r" class="px-3 py-3 font-semibold text-center">
                {{ ROLE_DEFINITIONS[r].label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-border/60">
            <tr v-for="perm in permissionsList" :key="perm.key" class="hover:bg-stone-bg/30">
              <td class="px-4 py-2.5 font-medium text-ink">
                {{ perm.label }}
              </td>
              <td v-for="r in matrixRoles" :key="r" class="px-3 py-2.5 text-center">
                <div
                  v-if="ROLE_PERMISSIONS[r].includes(perm.key)"
                  class="w-5 h-5 rounded-full bg-status-green-bg text-status-green inline-flex items-center justify-center"
                >
                  <AppIcon name="check" :size="12" />
                </div>
                <div v-else class="text-stone-border font-bold text-sm select-none">
                  —
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invite User Dialog -->
    <Modal
      :is-open="isInviteModalOpen"
      title="Invite Team Member"
      subtitle="Send a workspace invite link to join your organization."
      max-width="md"
      @close="isInviteModalOpen = false"
    >
      <div class="space-y-4 text-xs">
        <Field label="Full Name" required>
          <TextField v-model="inviteName" placeholder="e.g. Samuel Kiptoo" />
        </Field>

        <Field label="Work Email Address" required>
          <TextField v-model="inviteEmail" type="email" placeholder="samuel@company.example" />
        </Field>

        <Field label="Assigned Role" required hint="Determines screens and capabilities visible to this user">
          <select
            v-model="inviteRole"
            class="block w-full rounded-xl border border-stone-border bg-white px-3.5 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
          >
            <option v-for="r in matrixRoles" :key="r" :value="r">
              {{ ROLE_DEFINITIONS[r].label }} ({{ ROLE_DEFINITIONS[r].erpnextRole }})
            </option>
          </select>
        </Field>
      </div>

      <template #footer>
        <AppButton variant="ghost" size="sm" @click="isInviteModalOpen = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" @click="handleInviteUser">
          Send Invitation
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
