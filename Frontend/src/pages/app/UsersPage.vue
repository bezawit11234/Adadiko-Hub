<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ROLE_DEFINITIONS, ROLE_PERMISSIONS, type Permission } from '@/data/roles'
import { useSession } from '@/composables/useSession'
import { useToast } from '@/composables/useToast'
import { getAuthApi } from '@/services/auth'
import type { User, Role } from '@/types'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import Field from '@/components/common/Field.vue'
import TextField from '@/components/common/TextField.vue'

const { currentUser, currentRole } = useSession()
const route = useRoute()
const toast = useToast()
const authApi = getAuthApi()
const showWelcome = computed(() => route.query.welcome === '1')
const isAdmin = computed(() => currentRole.value === 'admin')

const users = ref<User[]>(currentUser.value ? [currentUser.value] : [])
const loadingUsers = ref(false)

// Invite User Modal
const isInviteModalOpen = ref(false)
const inviteName = ref('')
const inviteEmail = ref('')
const inviteRole = ref<Role>('sales_rep')
const invitePassword = ref('password123')
const isSubmitting = ref(false)

const columns = computed<Column[]>(() => {
  const base: Column[] = [
    { key: 'name', label: 'Team Member' },
    { key: 'email', label: 'Email Address' },
    { key: 'role', label: 'Workspace Role' },
    { key: 'erpnext', label: 'ERPNext Role Profile' },
    { key: 'status', label: 'Status' },
  ]
  if (isAdmin.value) base.push({ key: 'actions', label: 'Actions', align: 'right' })
  return base
})

const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const selectedUser = ref<User | null>(null)
const editName = ref('')
const editRole = ref<Role>('sales_rep')
const editPassword = ref('')

async function loadTeamMembers() {
  loadingUsers.value = true
  try {
    const res = await authApi.listUsers()
    if (res.ok && res.data && res.data.length > 0) {
      users.value = res.data
    } else if (currentUser.value) {
      users.value = [currentUser.value]
    } else {
      users.value = []
    }
  } finally {
    loadingUsers.value = false
  }
}

onMounted(() => {
  loadTeamMembers()
})

async function handleInviteUser() {
  if (!inviteName.value || !inviteEmail.value) {
    toast.error('Validation error', 'Please provide a name and email address.')
    return
  }

  isSubmitting.value = true
  try {
    const res = await authApi.inviteUser(
      inviteName.value,
      inviteEmail.value,
      inviteRole.value,
      invitePassword.value || 'password123'
    )

    if (res.ok && res.data) {
      toast.success(
        'Teammate Account Created',
        `User ${inviteEmail.value} can now sign in as ${ROLE_DEFINITIONS[inviteRole.value].label} with their password.`
      )
      isInviteModalOpen.value = false
      inviteName.value = ''
      inviteEmail.value = ''
      invitePassword.value = 'password123'
      await loadTeamMembers()
    } else {
      toast.error('Failed to create account', res.error || 'Could not register user.')
    }
  } finally {
    isSubmitting.value = false
  }
}

function openEdit(user: User): void {
  selectedUser.value = user
  editName.value = user.name
  editRole.value = user.role
  editPassword.value = ''
  isEditModalOpen.value = true
}

function openDelete(user: User): void {
  selectedUser.value = user
  isDeleteModalOpen.value = true
}

async function handleEditUser(): Promise<void> {
  if (!selectedUser.value || !editName.value.trim()) {
    toast.error('Validation error', 'Enter a name for this teammate.')
    return
  }
  isSubmitting.value = true
  try {
    const res = await authApi.updateUser(selectedUser.value.id, {
      name: editName.value.trim(),
      role: editRole.value,
      password: editPassword.value.trim() || undefined,
    })
    if (!res.ok || !res.data) {
      toast.error('Could not save in ERPNext', res.error || 'The user was not updated.')
      return
    }
    toast.success('Teammate updated', 'Name, role, and password were saved in ERPNext.')
    isEditModalOpen.value = false
    await loadTeamMembers()
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteUser(): Promise<void> {
  if (!selectedUser.value) return
  isSubmitting.value = true
  try {
    const res = await authApi.deleteUser(selectedUser.value.id)
    if (!res.ok) {
      toast.error('Could not remove in ERPNext', res.error || 'The user was not deleted.')
      return
    }
    toast.success('Teammate removed', 'This person can no longer sign in.')
    isDeleteModalOpen.value = false
    selectedUser.value = null
    await loadTeamMembers()
  } finally {
    isSubmitting.value = false
  }
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
    <div
      v-if="showWelcome"
      class="rounded-2xl border border-signal/30 bg-signal-subtle/50 p-4 text-sm text-ink"
    >
      <p class="font-bold text-ink">Your workspace is ready.</p>
      <p class="mt-1 text-ink-muted">
        Invite your team with a name, email, role, and password. They will sign in from the Sign In page whenever they open the site. You will also sign in with the password you just created the next time you return.
      </p>
    </div>
    <SampleNotice text="Team & Access Control: User profiles with Frappe v16 Role Profile mappings and Sales permission matrix." />

    <SectionHeading
      title="Team Members & Permissions"
      description="Manage staff members, invite coworkers, and inspect the Sales module permission hierarchy."
    >
      <template #badge>
        <Badge variant="signal" size="sm">{{ users.length }} Active Staff</Badge>
      </template>
      <template #actions>
        <AppButton v-if="isAdmin" variant="primary" size="sm" @click="isInviteModalOpen = true">
          <AppIcon name="plus" :size="16" />
          <span>Invite User</span>
        </AppButton>
      </template>
    </SectionHeading>

    <!-- Users Table -->
    <DataTable
      :columns="columns"
      :rows="users"
      :loading="loadingUsers"
      empty-title="No team members registered yet"
      empty-description="Invite coworkers to grant them role-specific access to this workspace."
    >
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

      <template #status>
        <Badge variant="success" size="sm" dot>
          Active
        </Badge>
      </template>

      <template #actions="{ row }">
        <div v-if="isAdmin" class="flex justify-end gap-2">
          <AppButton variant="outline" size="sm" @click="openEdit(row)">Edit</AppButton>
          <AppButton
            v-if="row.id !== currentUser?.id"
            variant="danger"
            size="sm"
            @click="openDelete(row)"
          >
            <AppIcon name="trash" :size="14" />
            <span>Delete</span>
          </AppButton>
        </div>
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

        <Field label="Initial Password" required hint="Password the teammate will use to sign in">
          <TextField v-model="invitePassword" type="password" placeholder="e.g. password123" />
        </Field>
      </div>

      <template #footer>
        <AppButton variant="ghost" size="sm" @click="isInviteModalOpen = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" :loading="isSubmitting" @click="handleInviteUser">
          Create Account & Invite
        </AppButton>
      </template>
    </Modal>

    <Modal
      :is-open="isEditModalOpen"
      title="Edit teammate"
      subtitle="Changes are saved on the ERPNext User record."
      max-width="md"
      @close="isEditModalOpen = false"
    >
      <div class="space-y-4 text-xs">
        <Field label="Full Name" required>
          <TextField v-model="editName" />
        </Field>
        <Field label="Workspace Role" required>
          <select
            v-model="editRole"
            class="block w-full rounded-xl border border-stone-border bg-white px-3.5 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
          >
            <option v-for="r in matrixRoles" :key="r" :value="r">
              {{ ROLE_DEFINITIONS[r].label }} ({{ ROLE_DEFINITIONS[r].erpnextRole }})
            </option>
          </select>
        </Field>
        <Field label="New password" hint="Leave blank to keep the current password.">
          <TextField v-model="editPassword" type="password" placeholder="Optional" />
        </Field>
      </div>
      <template #footer>
        <AppButton variant="ghost" size="sm" @click="isEditModalOpen = false">Cancel</AppButton>
        <AppButton variant="primary" size="sm" :loading="isSubmitting" @click="handleEditUser">
          Save in ERPNext
        </AppButton>
      </template>
    </Modal>

    <Modal
      :is-open="isDeleteModalOpen"
      title="Remove teammate"
      subtitle="This deletes or disables the User in ERPNext."
      max-width="sm"
      @close="isDeleteModalOpen = false"
    >
      <p class="text-sm text-ink">
        Remove <strong>{{ selectedUser?.name }}</strong> ({{ selectedUser?.email }}) from this workspace?
      </p>
      <template #footer>
        <AppButton variant="ghost" size="sm" @click="isDeleteModalOpen = false">Cancel</AppButton>
        <AppButton variant="danger" size="sm" :loading="isSubmitting" @click="handleDeleteUser">
          Delete in ERPNext
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
