/**
 * Adadiko Hub Access Control Composable
 *
 * NOTE: Frontend role checks only change what people SEE.
 * Real enforcement will be done by ERPNext permissions on the server
 * via standard Frappe User Permission and Role Permission rules.
 */

import { computed } from 'vue'
import type { ModuleKey, Role } from '@/types'
import { ROLE_PERMISSIONS, type Permission, ROLE_DEFINITIONS } from '@/data/roles'
import { useSession } from './useSession'

export function useAccess() {
  const { currentRole, currentOrg } = useSession()

  /**
   * Check if the active organization has bought and enabled the given module.
   * Maps module keys in one canonical place (lowercase, trimmed).
   */
  function canUseModule(moduleKey: string): boolean {
    if (!currentOrg.value || !currentOrg.value.subscribedModules) return false
    const normalized = moduleKey.toLowerCase().trim()
    return currentOrg.value.subscribedModules.some(
      (m) => m.toLowerCase().trim() === normalized
    )
  }

  /**
   * Check if the currently signed-in user's role has permission to perform an action
   */
  function can(permission: Permission): boolean {
    const role: Role = currentRole.value
    const permissions = ROLE_PERMISSIONS[role] || []
    return permissions.includes(permission)
  }

  /**
   * Compute default landing page for the user's role
   */
  const roleHomeRoute = computed(() => {
    const role = currentRole.value
    return ROLE_DEFINITIONS[role]?.defaultHome || '/app/sales'
  })

  return {
    canUseModule,
    can,
    roleHomeRoute,
  }
}
