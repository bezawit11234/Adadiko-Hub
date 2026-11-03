<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getAdminApi } from '@/services/admin'
import { useAccess } from '@/composables/useAccess'
import { useSession } from '@/composables/useSession'
import { useToast } from '@/composables/useToast'
import type { StaffUser, StaffRole } from '@/types'
import { formatDate } from '@/utils/format'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'
import TextField from '@/components/common/TextField.vue'

const adminApi = getAdminApi()
const { canInviteStaff } = useAccess()
const { currentUser } = useSession()
const { showToast } = useToast()

const staffList = ref<StaffUser[]>([])
const loading = ref(true)

// Invite modal
const showInviteModal = ref(false)
const showTempPasswordModal = ref(false)
const createdTempPassword = ref('')
const createdStaffEmail = ref('')
const inviteName = ref('')
const inviteEmail = ref('')
const inviteRole = ref<StaffRole>('support')
const isInviting = ref(false)

// Edit modal
const showEditModal = ref(false)
const selectedStaff = ref<StaffUser | null>(null)
const editName = ref('')
const editRole = ref<StaffRole>('support')
const isUpdating = ref(false)

// Delete modal
const showDeleteModal = ref(false)
const staffToDelete = ref<StaffUser | null>(null)
const isDeleting = ref(false)

const fetchStaff = async () => {
  loading.value = true
  try {
    const res = await adminApi.listStaff()
    if (res.ok && res.data) {
      staffList.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStaff()
  window.addEventListener('adadiko:refresh', fetchStaff)
})

onUnmounted(() => {
  window.removeEventListener('adadiko:refresh', fetchStaff)
})

const getRoleBadge = (role?: string) => {
  const r = (role || '').toLowerCase().trim()
  switch (r) {
    case 'admin':
      return { variant: 'accent' as const, label: 'Adadiko Admin' }
    case 'support':
      return { variant: 'info' as const, label: 'Adadiko Support' }
    case 'billing':
      return { variant: 'success' as const, label: 'Adadiko Billing' }
    default:
      return { variant: 'neutral' as const, label: role || 'Staff' }
  }
}

const isCurrentUser = (staff: StaffUser) => {
  const staffEmail = (staff.email || '').toLowerCase().trim()
  const staffId = (staff.id || '').toLowerCase().trim()
  if (staffId === 'administrator' || staffEmail === 'administrator' || staffEmail === 'admin@example.com') return true
  const currentEmail = (currentUser.value?.email || currentUser.value?.id || '').toLowerCase().trim()
  if (currentEmail && (staffEmail === currentEmail || staffId === currentEmail)) return true
  return false
}

const openEditModal = (staff: StaffUser) => {
  selectedStaff.value = { ...staff }
  editName.value = staff.name
  editRole.value = staff.role
  showEditModal.value = true
}

const openDeleteModal = (staff: StaffUser) => {
  staffToDelete.value = { ...staff }
  showDeleteModal.value = true
}

const handleInviteStaff = async () => {
  if (!inviteName.value || !inviteEmail.value) {
    showToast({ title: 'Validation', message: 'Name and email are required.', type: 'error' })
    return
  }

  isInviting.value = true
  try {
    const res = await adminApi.inviteStaff({
      name: inviteName.value.trim(),
      email: inviteEmail.value.trim(),
      role: inviteRole.value,
    })

    if (res.ok && res.data) {
      showToast({
        title: 'Invitation Sent',
        message: `Invited ${res.data.name} as ${res.data.role.toUpperCase()}.`,
        type: 'success',
      })
      showInviteModal.value = false
      if (res.data.temp_password) {
        createdStaffEmail.value = res.data.email
        createdTempPassword.value = res.data.temp_password
        showTempPasswordModal.value = true
      }
      inviteName.value = ''
      inviteEmail.value = ''
      await fetchStaff()
    } else {
      showToast({ title: 'Invite Failed', message: res.error || 'Failed to invite staff.', type: 'error' })
    }
  } finally {
    isInviting.value = false
  }
}

const handleUpdateStaff = async () => {
  if (!selectedStaff.value) return
  if (!editName.value.trim()) {
    showToast({ title: 'Validation', message: 'Full name cannot be empty.', type: 'error' })
    return
  }

  isUpdating.value = true
  try {
    const targetIdentifier = selectedStaff.value.id || selectedStaff.value.email
    const res = await adminApi.updateStaff(
      targetIdentifier,
      editName.value.trim(),
      editRole.value
    )

    if (res.ok) {
      showToast({
        title: 'Staff Updated',
        message: `Updated profile and role for ${selectedStaff.value.name || targetIdentifier}.`,
        type: 'success',
      })
      showEditModal.value = false
      await fetchStaff()
    } else {
      showToast({
        title: 'Update Failed',
        message: res.error || 'Failed to update staff member.',
        type: 'error',
      })
    }
  } finally {
    isUpdating.value = false
  }
}

const handleDeleteStaff = async () => {
  if (!staffToDelete.value) return

  isDeleting.value = true
  try {
    const targetIdentifier = staffToDelete.value.id || staffToDelete.value.email
    const res = await adminApi.deleteStaff(targetIdentifier)
    if (res.ok) {
      showToast({
        title: 'Staff Member Deleted',
        message: `Removed staff access for ${staffToDelete.value.name || targetIdentifier}.`,
        type: 'success',
      })
      showDeleteModal.value = false
      await fetchStaff()
    } else {
      showToast({
        title: 'Delete Failed',
        message: res.error || 'Failed to remove staff member.',
        type: 'error',
      })
    }
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <PageContainer>
    <SectionHeading
      title="Staff Administration"
      description="Manage Adadiko internal team accounts, authorization roles, and platform permissions."
    >
      <template #actions>
        <AppButton
          variant="primary"
          size="sm"
          @click="showInviteModal = true"
        >
          <AppIcon name="plus" :size="14" class="mr-1.5" />
          Invite Staff Member
        </AppButton>
      </template>
    </SectionHeading>

    <!-- Staff Table -->
    <div class="bg-stone-surface border border-stone-border rounded-2xl shadow-soft overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-stone-subtle/80 border-b border-stone-border text-ink-muted uppercase font-mono text-[11px] tracking-wider">
              <th class="py-3.5 px-4 font-semibold">Staff Member</th>
              <th class="py-3.5 px-4 font-semibold">Assigned Role</th>
              <th class="py-3.5 px-4 font-semibold">Last Active</th>
              <th class="py-3.5 px-4 font-semibold">Status</th>
              <th class="py-3.5 px-4 font-semibold">Joined Date</th>
              <th class="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-border">
            <tr
              v-for="staff in staffList"
              :key="staff.id"
              class="hover:bg-stone-subtle/60 transition-colors"
            >
              <td class="py-3.5 px-4">
                <div class="font-semibold text-sm text-ink">{{ staff.name }}</div>
                <div class="text-[11px] font-mono text-ink-muted">{{ staff.email }}</div>
              </td>

              <td class="py-3.5 px-4">
                <Badge :variant="getRoleBadge(staff.role).variant">
                  {{ getRoleBadge(staff.role).label }}
                </Badge>
              </td>

              <td class="py-3.5 px-4 font-mono text-ink">
                {{ staff.lastActive || '—' }}
              </td>

              <td class="py-3.5 px-4">
                <Badge variant="success">
                  Active
                </Badge>
              </td>

              <td class="py-3.5 px-4 font-mono text-ink-muted text-[11px]">
                {{ staff.createdDate ? formatDate(staff.createdDate) : '—' }}
              </td>

              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click.stop="openEditModal(staff)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-border bg-stone-surface text-ink hover:bg-stone-muted active:bg-stone-muted transition-colors cursor-pointer"
                    title="Edit staff member"
                  >
                    <AppIcon name="edit" :size="12" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    @click.stop="openDeleteModal(staff)"
                    :disabled="isCurrentUser(staff)"
                    :class="
                      isCurrentUser(staff)
                        ? 'opacity-40 cursor-not-allowed text-stone-muted bg-transparent'
                        : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 active:bg-rose-100 cursor-pointer'
                    "
                    class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors"
                    :title="isCurrentUser(staff) ? 'Cannot delete system Administrator or your own account' : 'Delete staff member'"
                  >
                    <AppIcon name="trash" :size="12" />
                    <span>Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Loading Skeleton -->
        <div v-if="loading" class="p-4 space-y-3">
          <div v-for="i in 3" :key="i" class="h-10 bg-stone-muted/40 rounded-xl animate-pulse"></div>
        </div>

        <!-- Empty State -->
        <div v-else-if="staffList.length === 0" class="p-8 text-center text-xs text-ink-muted">
          No staff accounts found.
        </div>
      </div>
    </div>

    <!-- Edit Staff Modal -->
    <Modal
      :show="showEditModal"
      title="Edit Staff Member"
      @close="showEditModal = false"
    >
      <div class="space-y-4 text-xs">
        <div class="p-3 bg-stone-subtle rounded-xl border border-stone-border">
          <div class="text-[11px] font-mono text-ink-muted uppercase tracking-wider">Account Email / ID</div>
          <div class="font-mono text-xs font-semibold text-ink mt-0.5">{{ selectedStaff?.email }}</div>
        </div>

        <div>
          <label for="edit-name" class="block font-medium text-ink mb-1.5">Full Name</label>
          <TextField
            id="edit-name"
            v-model="editName"
            placeholder="e.g. Jordan Miller"
          />
        </div>

        <div>
          <label class="block font-medium text-ink mb-1.5">Assign Staff Role</label>
          <div
            v-if="selectedStaff?.id?.toLowerCase() === 'administrator' || selectedStaff?.email?.toLowerCase() === 'administrator' || selectedStaff?.email?.toLowerCase() === 'admin@example.com'"
            class="p-2.5 bg-stone-subtle text-ink-muted text-[11px] rounded-xl border border-stone-border"
          >
            The root Administrator role cannot be changed.
          </div>
          <div v-else class="space-y-2">
            <label
              class="flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors"
              :class="editRole === 'support' ? 'border-signal bg-signal-subtle' : 'border-stone-border bg-stone-subtle'"
            >
              <input type="radio" value="support" v-model="editRole" class="mt-0.5 text-signal" />
              <div>
                <span class="font-bold text-ink">Adadiko Support</span>
                <p class="text-ink-muted text-[11px] mt-0.5">Read-only client diagnostics and audit logs. Cannot alter billing or suspend.</p>
              </div>
            </label>

            <label
              class="flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors"
              :class="editRole === 'billing' ? 'border-signal bg-signal-subtle' : 'border-stone-border bg-stone-subtle'"
            >
              <input type="radio" value="billing" v-model="editRole" class="mt-0.5 text-signal" />
              <div>
                <span class="font-bold text-ink">Adadiko Billing</span>
                <p class="text-ink-muted text-[11px] mt-0.5">Manage customer orders, invoices, and subscription renewals.</p>
              </div>
            </label>

            <label
              class="flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors"
              :class="editRole === 'admin' ? 'border-signal bg-signal-subtle' : 'border-stone-border bg-stone-subtle'"
            >
              <input type="radio" value="admin" v-model="editRole" class="mt-0.5 text-signal" />
              <div>
                <span class="font-bold text-ink">Adadiko Admin</span>
                <p class="text-ink-muted text-[11px] mt-0.5">Full control across all modules, plans, suspensions, catalog, and staff invites.</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="showEditModal = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" @click="handleUpdateStaff" :loading="isUpdating">
          Save Changes
        </AppButton>
      </template>
    </Modal>

    <!-- Delete Staff Confirmation Modal -->
    <Modal
      :show="showDeleteModal"
      title="Delete Staff Member"
      @close="showDeleteModal = false"
    >
      <div class="space-y-3 text-xs text-ink">
        <p>
          Are you sure you want to remove staff permissions for
          <strong class="text-ink">{{ staffToDelete?.name }}</strong>
          (<span class="font-mono text-ink-muted">{{ staffToDelete?.email }}</span>)?
        </p>
        <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
          <p class="font-semibold mb-0.5">Warning</p>
          This account will lose all staff access and privileges to the Adadiko Dashboard immediately.
        </div>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="showDeleteModal = false">
          Cancel
        </AppButton>
        <AppButton variant="danger" size="sm" @click="handleDeleteStaff" :loading="isDeleting">
          Confirm Delete
        </AppButton>
      </template>
    </Modal>

    <!-- Invite Staff Modal -->
    <Modal
      :show="showInviteModal"
      title="Invite New Staff Member"
      @close="showInviteModal = false"
    >
      <div class="space-y-4 text-xs">
        <div>
          <label for="invite-name" class="block font-medium text-ink mb-1.5">Full Name</label>
          <TextField
            id="invite-name"
            v-model="inviteName"
            placeholder="e.g. Jordan Miller"
          />
        </div>

        <div>
          <label for="invite-email" class="block font-medium text-ink mb-1.5">Corporate Email (e.g. user@adadiko.com)</label>
          <TextField
            id="invite-email"
            v-model="inviteEmail"
            placeholder="jordan.miller@adadiko.com"
          />
        </div>

        <div>
          <label class="block font-medium text-ink mb-1.5">Assign Staff Role</label>
          <div class="space-y-2">
            <label
              class="flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors"
              :class="inviteRole === 'support' ? 'border-signal bg-signal-subtle' : 'border-stone-border bg-stone-subtle'"
            >
              <input type="radio" value="support" v-model="inviteRole" class="mt-0.5 text-signal" />
              <div>
                <span class="font-bold text-ink">Adadiko Support</span>
                <p class="text-ink-muted text-[11px] mt-0.5">Read-only client diagnostics and audit logs. Cannot alter billing or suspend.</p>
              </div>
            </label>

            <label
              class="flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors"
              :class="inviteRole === 'billing' ? 'border-signal bg-signal-subtle' : 'border-stone-border bg-stone-subtle'"
            >
              <input type="radio" value="billing" v-model="inviteRole" class="mt-0.5 text-signal" />
              <div>
                <span class="font-bold text-ink">Adadiko Billing</span>
                <p class="text-ink-muted text-[11px] mt-0.5">Manage customer orders, invoices, and subscription renewals.</p>
              </div>
            </label>

            <label
              class="flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors"
              :class="inviteRole === 'admin' ? 'border-signal bg-signal-subtle' : 'border-stone-border bg-stone-subtle'"
            >
              <input type="radio" value="admin" v-model="inviteRole" class="mt-0.5 text-signal" />
              <div>
                <span class="font-bold text-ink">Adadiko Admin</span>
                <p class="text-ink-muted text-[11px] mt-0.5">Full control across all modules, plans, suspensions, catalog, and staff invites.</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="showInviteModal = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" size="sm" @click="handleInviteStaff" :loading="isInviting">
          Send Staff Invitation
        </AppButton>
      </template>
    </Modal>

    <!-- Temporary Password Modal (Shown once on invite) -->
    <Modal
      :show="showTempPasswordModal"
      title="Staff Account Created"
      @close="showTempPasswordModal = false"
    >
      <div class="text-xs text-ink space-y-3">
        <p>
          Staff member account for <strong>{{ createdStaffEmail }}</strong> was successfully generated.
        </p>
        <p class="text-ink-muted">
          Provide this single-use temporary password to the staff member. It will not be displayed again:
        </p>
        <div class="p-3 bg-stone-muted/70 rounded-xl font-mono text-sm font-bold text-signal select-all border border-stone-border flex items-center justify-between">
          <span>{{ createdTempPassword }}</span>
        </div>
      </div>
      <template #footer>
        <AppButton variant="primary" size="sm" @click="showTempPasswordModal = false">
          Done
        </AppButton>
      </template>
    </Modal>
  </PageContainer>
</template>
