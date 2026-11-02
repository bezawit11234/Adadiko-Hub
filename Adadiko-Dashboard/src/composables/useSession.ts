/**
 * Adadiko Dashboard — Staff Session Composable
 */

import { ref, computed } from 'vue'
import type { StaffUser, StaffRole } from '@/types'
import { getAuthApi } from '@/services/auth'
import { ROLE_DEFINITIONS } from '@/data/roles'

const authApi = getAuthApi()
const currentUser = ref<StaffUser | null>(authApi.getCurrentUser())

export function useSession() {
  const isAuthenticated = computed(() => !!currentUser.value)
  const currentRole = computed<StaffRole>(() => currentUser.value?.role || 'admin')
  const currentRoleMeta = computed(() => ROLE_DEFINITIONS[currentRole.value])

  const restoreSession = async () => {
    if ('restoreSession' in authApi && typeof (authApi as any).restoreSession === 'function') {
      const user = await (authApi as any).restoreSession()
      if (user) {
        currentUser.value = user
      } else {
        currentUser.value = null
      }
    }
  }

  const login = async (email: string, password?: string) => {
    const res = await authApi.login(email, password)
    if (res.ok && res.data) {
      currentUser.value = res.data
    }
    return res
  }

  const logout = async () => {
    await authApi.logout()
    currentUser.value = null
  }

  return {
    currentUser,
    isAuthenticated,
    currentRole,
    currentRoleMeta,
    login,
    logout,
    restoreSession,
  }
}
