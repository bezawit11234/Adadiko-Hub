/**
 * Adadiko Dashboard — Staff Roles & Permissions Matrix
 *
 * NOTE: Frontend role checks only govern visibility and client navigation.
 * Real security enforcement must be done by ERPNext permissions on the control site server.
 */

import type { StaffRole, StaffUser, RoleMeta } from '@/types'

export const ROLE_DEFINITIONS: Record<StaffRole, RoleMeta> = {
  admin: {
    key: 'admin',
    label: 'Adadiko Admin',
    erpnextRole: 'System Manager / Adadiko Staff',
    description: 'Full workspace access: manage all client companies, plans, catalog, subscriptions, orders, logs, and staff invites.',
    allowedRoutes: ['/overview', '/clients', '/orders', '/subscriptions', '/catalog', '/logs', '/staff'],
  },
  support: {
    key: 'support',
    label: 'Adadiko Support',
    erpnextRole: 'Adadiko Support Staff',
    description: 'Read-only client company diagnostics, internal support notes, and activity audit logs. Cannot alter billing or suspend tenants.',
    allowedRoutes: ['/overview', '/clients', '/logs'],
  },
  billing: {
    key: 'billing',
    label: 'Adadiko Billing',
    erpnextRole: 'Adadiko Billing Staff',
    description: 'Financial oversight: customer invoices, order records, subscription contract renewals, and payment collection.',
    allowedRoutes: ['/overview', '/orders', '/subscriptions'],
  },
}

export const DEMO_STAFF: Record<StaffRole, StaffUser> = {
  admin: {
    id: 'staff_adm_1',
    name: 'Elena Rostova',
    email: 'elena.admin@adadiko.internal',
    role: 'admin',
    isDemo: true,
    lastActive: 'Just now',
    createdDate: '2025-11-01',
  },
  support: {
    id: 'staff_sup_1',
    name: 'Sam O\'Connor',
    email: 'sam.support@adadiko.internal',
    role: 'support',
    isDemo: true,
    lastActive: '12m ago',
    createdDate: '2026-01-10',
  },
  billing: {
    id: 'staff_bil_1',
    name: 'Fiona Gallagher',
    email: 'fiona.billing@adadiko.internal',
    role: 'billing',
    isDemo: true,
    lastActive: '1h ago',
    createdDate: '2026-01-15',
  },
}
