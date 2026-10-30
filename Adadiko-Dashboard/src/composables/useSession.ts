/**
 * Adadiko Dashboard — Staff Session Composable
 */

import { ref, computed } from 'vue'
import type { StaffUser, StaffRole } from '@/types'
import { getAuthApi } from '@/services/auth'
import { ROLE_DEFINITIONS } from '@/data/roles'

const authApi = getAuthApi()
const currentUser = ref<StaffUser | null>(authApi.getCurrentUser())
const envDefaultMode = (import.meta.env.VITE_API_MODE as string) || 'mock'
const apiMode = ref<'mock' | 'frappe'>(envDefaultMode === 'frappe' ? 'frappe' : 'mock')

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

  const switchRole = (role: StaffRole) => {
    const updated = authApi.switchRole(role)
    currentUser.value = { ...updated }
  }

  const setApiMode = (mode: 'mock' | 'frappe') => {
    apiMode.value = mode
    if (typeof window !== 'undefined') {
      ;(window as any).__ADADIKO_API_MODE = mode
    }
  }

  const loginAsDemo = async (role: StaffRole) => {
    switchRole(role)
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
    apiMode,
    switchRole,
    setApiMode,
    loginAsDemo,
    login,
    logout,
    restoreSession,
  }
}
