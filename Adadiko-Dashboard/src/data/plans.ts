/**
 * Adadiko Dashboard — Platform Plan Definitions
 */

import type { PlanDefinition } from '@/types'

export const PLAN_DEFINITIONS: Record<string, PlanDefinition> = {
  starter: {
    key: 'starter',
    name: 'Starter',
    baseMonthlyPrice: 49,
    maxUsers: 5,
    includedModules: ['sales', 'inventory'],
    description: 'Essential business tools for micro-enterprises and boutique traders.',
  },
  growth: {
    key: 'growth',
    name: 'Growth',
    baseMonthlyPrice: 129,
    maxUsers: 25,
    includedModules: ['sales', 'inventory', 'purchasing', 'finance'],
    description: 'Comprehensive operations platform for expanding distribution and retail companies.',
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    baseMonthlyPrice: 299,
    maxUsers: 100,
    includedModules: ['sales', 'inventory', 'purchasing', 'finance', 'manufacturing', 'crm', 'hr'],
    description: 'Full ERP suite with custom integrations, multi-entity support, and priority SLA.',
  },
}
