<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAdminApi } from '@/services/admin'
import { useAccess } from '@/composables/useAccess'
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
const { showToast } = useToast()

const staffList = ref<StaffUser[]>([])
const loading = ref(true)

// Invite modal
const showInviteModal = ref(false)
const inviteName = ref('')
const inviteEmail = ref('')
const inviteRole = ref<StaffRole>('support')
const isInviting = ref(false)

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
})

const getRoleBadge = (role: StaffRole) => {
  switch (role) {
    case 'admin':
      return { variant: 'accent' as const, label: 'Adadiko Admin' }
    case 'support':
      return { variant: 'info' as const, label: 'Adadiko Support' }
    case 'billing':
      return { variant: 'success' as const, label: 'Adadiko Billing' }
  }
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
</script>

<template>
  <PageContainer>
    <SectionHeading
      title="Staff Administration"
      description="Manage Adadiko internal team accounts, authorization roles, and platform permissions."
    >
      <template #actions>
        <AppButton
          v-if="canInviteStaff"
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
              <th class="py-3.5 px-4 font-semibold">Account Class</th>
              <th class="py-3.5 px-4 font-semibold text-right">Joined Date</th>
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
                <Badge :variant="staff.isDemo ? 'warning' : 'neutral'">
                  {{ staff.isDemo ? 'Demo Profile' : 'Production Staff' }}
                </Badge>
              </td>

              <td class="py-3.5 px-4 font-mono text-ink-muted text-right text-[11px]">
                {{ staff.createdDate ? formatDate(staff.createdDate) : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invite Staff Modal -->
    <Modal
      :show="showInviteModal"
      title="Invite New Staff Member"
      @close="showInviteModal = false"
    >
      <div class="space-y-4 text-xs">
        <TextField
          id="invite-name"
          label="Full Name"
          v-model="inviteName"
          placeholder="e.g. Jordan Miller"
        />

        <TextField
          id="invite-email"
          label="Corporate Email (@adadiko.internal)"
          v-model="inviteEmail"
          placeholder="jordan.miller@adadiko.internal"
        />

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
  </PageContainer>
</template>
