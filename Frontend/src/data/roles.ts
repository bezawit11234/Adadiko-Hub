/**
 * Adadiko Hub Role & Permission Matrix
 *
 * NOTE: Frontend role checks only change what users SEE in the client UI.
 * Real security and authorization enforcement MUST be done by Frappe / ERPNext
 * permissions on the server. When migrating to ERPNext v16, each role below
 * directly inherits the permissions of the corresponding ERPNext standard Role Profile.
 */

import type { Role, RoleDefinition, User } from '@/types'

export type Permission =
  | 'sales:view_dashboard'
  | 'sales:view_team_kpis'
  | 'sales:view_all_orders'
  | 'sales:view_own_orders'
  | 'sales:create_order'
  | 'sales:edit_order'
  | 'sales:approve_order'
  | 'sales:view_customers'
  | 'sales:create_customer'
  | 'sales:view_quotations'
  | 'sales:create_quotation'
  | 'sales:view_deliveries'
  | 'sales:create_delivery'
  | 'sales:view_invoices'
  | 'sales:create_invoice'
  | 'sales:record_payment'
  | 'admin:manage_users'
  | 'admin:manage_plan'
  | 'admin:backoffice'

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  admin: {
    key: 'admin',
    label: 'Company Admin',
    erpnextRole: 'System Manager',
    description: 'Full workspace access, team management, billing, and all modules',
    defaultHome: '/app/sales/dashboard',
  },
  sales_manager: {
    key: 'sales_manager',
    label: 'Sales Manager',
    erpnextRole: 'Sales Manager',
    description: 'Team performance, order approvals, target tracking, and revenue oversight',
    defaultHome: '/app/sales/dashboard',
  },
  sales_rep: {
    key: 'sales_rep',
    label: 'Sales Representative',
    erpnextRole: 'Sales User',
    description: 'Personal pipeline, new orders, follow-ups, and customer relationship log',
    defaultHome: '/app/sales',
  },
  accountant: {
    key: 'accountant',
    label: 'Accountant',
    erpnextRole: 'Accounts User',
    description: 'Read-only financial visibility, invoices tracking, and payment receipt logs',
    defaultHome: '/app/sales/invoices',
  },
  storekeeper: {
    key: 'storekeeper',
    label: 'Storekeeper',
    erpnextRole: 'Stock User',
    description: 'Fulfillment queue, delivery notes dispatch, and inventory dispatches',
    defaultHome: '/app/sales/deliveries',
  },
  adadiko_staff: {
    key: 'adadiko_staff',
    label: 'Adadiko Staff',
    erpnextRole: 'Adadiko Platform Operator',
    description: 'Platform management, client organizations, marketplace catalog and system audit',
    defaultHome: '/admin',
  },
}

// Permission matrix mapping Role -> Permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'sales:view_dashboard',
    'sales:view_team_kpis',
    'sales:view_all_orders',
    'sales:view_own_orders',
    'sales:create_order',
    'sales:edit_order',
    'sales:approve_order',
    'sales:view_customers',
    'sales:create_customer',
    'sales:view_quotations',
    'sales:create_quotation',
    'sales:view_deliveries',
    'sales:create_delivery',
    'sales:view_invoices',
    'sales:create_invoice',
    'sales:record_payment',
    'admin:manage_users',
    'admin:manage_plan',
  ],
  sales_manager: [
    'sales:view_dashboard',
    'sales:view_team_kpis',
    'sales:view_all_orders',
    'sales:view_own_orders',
    'sales:create_order',
    'sales:edit_order',
    'sales:approve_order',
    'sales:view_customers',
    'sales:create_customer',
    'sales:view_quotations',
    'sales:create_quotation',
    'sales:view_deliveries',
    'sales:create_delivery',
    'sales:view_invoices',
    'sales:create_invoice',
  ],
  sales_rep: [
    'sales:view_own_orders',
    'sales:create_order',
    'sales:edit_order',
    'sales:view_customers',
    'sales:create_customer',
    'sales:view_quotations',
    'sales:create_quotation',
    'sales:view_deliveries',
  ],
  accountant: [
    'sales:view_invoices',
    'sales:record_payment',
    'sales:view_customers',
  ],
  storekeeper: [
    'sales:view_deliveries',
    'sales:create_delivery',
  ],
  adadiko_staff: [
    'admin:backoffice',
  ],
}

// Demo test users for manager & stakeholder evaluation
export const DEMO_USERS: Record<Role, User> = {
  sales_rep: {
    id: 'usr_rep_1',
    email: 'tariq.rep@adadiko.demo',
    name: 'Tariq Mensah',
    role: 'sales_rep',
    organizationId: 'org_acme',
    isDemo: true,
  },
  sales_manager: {
    id: 'usr_mgr_1',
    email: 'sarah.mgr@adadiko.demo',
    name: 'Sarah Chen',
    role: 'sales_manager',
    organizationId: 'org_acme',
    isDemo: true,
  },
  admin: {
    id: 'usr_adm_1',
    email: 'marcus.admin@adadiko.demo',
    name: 'Marcus Brody',
    role: 'admin',
    organizationId: 'org_acme',
    isDemo: true,
  },
  accountant: {
    id: 'usr_acc_1',
    email: 'fiona.finance@adadiko.demo',
    name: 'Fiona Gallagher',
    role: 'accountant',
    organizationId: 'org_acme',
    isDemo: true,
  },
  storekeeper: {
    id: 'usr_stk_1',
    email: 'kwame.dispatch@adadiko.demo',
    name: 'Kwame Osei',
    role: 'storekeeper',
    organizationId: 'org_acme',
    isDemo: true,
  },
  adadiko_staff: {
    id: 'usr_staff_1',
    email: 'elena.hq@adadiko.io',
    name: 'Elena Rostova',
    role: 'adadiko_staff',
    organizationId: 'org_adadiko_hq',
    isDemo: true,
  },
}
