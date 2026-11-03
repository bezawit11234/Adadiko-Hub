/**
 * Adadiko Dashboard — Staff Roles & Permissions Matrix
 */

import type { StaffRole, RoleMeta } from '@/types'

export const ROLE_DEFINITIONS: Record<StaffRole, RoleMeta> = {
  admin: {
    key: 'admin',
    label: 'Adadiko Admin',
    backendRole: 'Adadiko Admin / Adadiko Staff',
    description: 'Full workspace access: manage all client companies, plans, catalog, subscriptions, orders, logs, and staff invites.',
    allowedRoutes: ['/overview', '/clients', '/orders', '/subscriptions', '/catalog', '/logs', '/staff'],
  },
  support: {
    key: 'support',
    label: 'Adadiko Support',
    backendRole: 'Adadiko Support / Adadiko Staff',
    description: 'Read-only client company diagnostics, internal support notes, and activity audit logs.',
    allowedRoutes: ['/overview', '/clients', '/logs', '/staff'],
  },
  billing: {
    key: 'billing',
    label: 'Adadiko Billing',
    backendRole: 'Adadiko Billing / Adadiko Staff',
    description: 'Financial oversight: customer orders, subscription renewals, and payment collection.',
    allowedRoutes: ['/overview', '/orders', '/subscriptions', '/staff'],
  },
}
