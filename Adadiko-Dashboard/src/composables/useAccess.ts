/**
 * Adadiko Dashboard — Access Control Composable
 *
 * Enforces staff capability matrix across routes, actions, and buttons.
 */

import { computed } from 'vue'
import { useSession } from './useSession'
import { ROLE_DEFINITIONS } from '@/data/roles'

export function useAccess() {
  const { currentRole, currentRoleMeta } = useSession()

  const canAccessRoute = (path: string): boolean => {
    // Normalizing sub-paths like /clients/cli_apex -> /clients
    const base = '/' + path.split('/')[1]
    const allowed = currentRoleMeta.value?.allowedRoutes || []
    return allowed.includes(base) || base === '/'
  }

  // Capability flags based on staff role
  const canManagePlans = computed(() => currentRole.value === 'admin')
  const canSuspendClients = computed(() => currentRole.value === 'admin')
  const canManageBilling = computed(() => currentRole.value === 'admin' || currentRole.value === 'billing')
  const canRenewSubscriptions = computed(() => currentRole.value === 'admin' || currentRole.value === 'billing')
  const canEditCatalog = computed(() => currentRole.value === 'admin')
  const canInviteStaff = computed(() => currentRole.value === 'admin')
  const canViewClients = computed(() => currentRole.value === 'admin' || currentRole.value === 'support')
  const canViewLogs = computed(() => currentRole.value === 'admin' || currentRole.value === 'support')

  return {
    currentRole,
    currentRoleMeta,
    canAccessRoute,
    canManagePlans,
    canSuspendClients,
    canManageBilling,
    canRenewSubscriptions,
    canEditCatalog,
    canInviteStaff,
    canViewClients,
    canViewLogs,
    roleDefinitions: ROLE_DEFINITIONS,
  }
}
