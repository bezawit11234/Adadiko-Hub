/**
 * Adadiko Dashboard — Core Types
 * Internal Back Office for Adadiko Staff.
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
  siteName: string
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

// Adadiko staff roles (strictly back office)
export type StaffRole = 'admin' | 'support' | 'billing'

export interface StaffUser {
  id: string
  email: string
  name: string
  role: StaffRole
  avatar?: string
  lastActive?: string
  createdDate?: string
  temp_password?: string
}

export interface RoleMeta {
  key: StaffRole
  label: string
  description: string
  backendRole?: string
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
