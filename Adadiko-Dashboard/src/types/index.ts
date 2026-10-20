/**
 * Adadiko Dashboard — Core Types
 * Internal Back Office for Adadiko Staff.
 * Comments reference future ERPNext Control Site DocTypes.
 */

// Order stages for step trackers
export type OrderStage = 'Quotation' | 'Sales Order' | 'Delivery' | 'Invoice' | 'Payment' | string

// Generic result envelope returned by all services
export interface ApiResult<T> {
  ok: boolean
  data?: T
  error?: string
}

// Plan tiers for client companies
// ERPNext DocType: "Plan"
export type Plan = 'starter' | 'growth' | 'enterprise'

export interface PlanDefinition {
  key: Plan
  name: string
  baseMonthlyPrice: number
  includedModules: string[]
  maxUsers: number
  description: string
}

// Client organization managed by Adadiko staff
// ERPNext DocType: "Client Company" (control site)
// ERPNext fields: name, company_name, contact_name, contact_email, plan, modules, status, user_count, start_date, renewal_date, site_name
export interface ClientCompany {
  id: string
  name: string
  contactName: string
  contactEmail: string
  plan: Plan
  modules: string[]
  status: 'active' | 'trial' | 'suspended'
  usersCount: number
  startDate: string
  renewalDate: string
  siteName: string // e.g. "apex.adadiko.cloud"
  monthlySpend: number
  notes?: string[]
  activityLog?: {
    id: string
    timestamp: string
    text: string
    staffName: string
  }[]
}

// Catalog module available for client workspaces
// ERPNext DocType: "Module Item" (control site)
// ERPNext fields: module_key, module_name, description, monthly_price, yearly_price, is_active, is_core
export interface ModuleItem {
  key: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  category: 'core' | 'operations' | 'finance' | 'package'
  isActive: boolean
  isCore?: boolean
}

// Order placed by or billed to a client company
// ERPNext DocType: "Client Order" (control site)
// ERPNext fields: name, order_number, client_company, amount, transaction_date, status, plan, invoice_ref
export interface Order {
  id: string
  orderNumber: string
  clientCompanyId: string
  clientCompanyName: string
  amount: number
  date: string
  status: 'paid' | 'pending' | 'failed'
  plan: Plan
  items: string[]
  invoiceRef: string
}

// Subscription contract tracking renewal dates and billing cycles
// ERPNext DocType: "Client Subscription" (control site)
// ERPNext fields: name, client_company, plan, billing_cycle, amount, start_date, renewal_date, status, auto_renew
export interface Subscription {
  id: string
  clientCompanyId: string
  clientCompanyName: string
  plan: Plan
  modules: string[]
  billingCycle: 'monthly' | 'yearly'
  amount: number
  startDate: string
  renewalDate: string
  status: 'active' | 'past_due' | 'expiring' | 'canceled'
  autoRenew: boolean
}

// System activity log and security audit entry
// ERPNext DocType: "Activity Log" (control site)
// ERPNext fields: name, timestamp, log_type, client_company, staff_user, details, ip_address
export interface LogEntry {
  id: string
  timestamp: string
  type: 'sign_in' | 'plan_change' | 'suspension' | 'error' | 'staff_action'
  clientCompanyId?: string
  clientCompanyName?: string
  staffUserId: string
  staffUserName: string
  details: string
  ipAddress?: string
}

// Adadiko staff roles (strictly back office, NOT for clients)
// ERPNext Roles: 'Adadiko Staff', 'System Manager'
export type StaffRole = 'admin' | 'support' | 'billing'

export interface StaffUser {
  id: string
  email: string
  name: string
  role: StaffRole
  avatar?: string
  isDemo: boolean
  lastActive?: string
  createdDate?: string
}

export interface RoleMeta {
  key: StaffRole
  label: string
  description: string
  erpnextRole: string
  allowedRoutes: string[]
}

// Executive overview telemetry for Adadiko staff
export interface AdminOverview {
  activeClients: number
  trialClients: number
  mrr: number
  renewalsDue30Days: number
  signupsOverTime: {
    month: string
    signups: number
  }[]
  clientsByPlan: {
    plan: Plan
    count: number
    percentage: number
  }[]
  needsAttention: {
    id: string
    type: 'overdue_payment' | 'expiring_trial' | 'expiring_plan'
    clientName: string
    clientId: string
    dueDate: string
    amount?: number
    daysRemaining?: number
  }[]
}
