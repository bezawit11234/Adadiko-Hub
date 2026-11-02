/**
 * Adadiko Dashboard — Platform Plan Definitions
 * Real control site plans: Sales, Sales + Inventory, Full.
 */

import type { PlanDefinition } from '@/types'

export const PLAN_DEFINITIONS: Record<string, PlanDefinition> = {
  sales: {
    key: 'sales',
    name: 'Sales',
    baseMonthlyPrice: 39,
    maxUsers: 5,
    includedModules: ['sales'],
    description: 'Essential customer pipeline, quotations, CRM and sales order processing.',
  },
  sales_inventory: {
    key: 'sales_+_inventory',
    name: 'Sales + Inventory',
    baseMonthlyPrice: 79,
    maxUsers: 15,
    includedModules: ['sales', 'inventory'],
    description: 'Integrated sales, customer invoicing, stock warehouses and inventory control.',
  },
  'sales_+_inventory': {
    key: 'sales_+_inventory',
    name: 'Sales + Inventory',
    baseMonthlyPrice: 79,
    maxUsers: 15,
    includedModules: ['sales', 'inventory'],
    description: 'Integrated sales, customer invoicing, stock warehouses and inventory control.',
  },
  full: {
    key: 'full',
    name: 'Full',
    baseMonthlyPrice: 199,
    maxUsers: 50,
    includedModules: ['sales', 'inventory', 'purchasing', 'finance', 'manufacturing'],
    description: 'Complete platform suite with multi-entity accounting, procurement, manufacturing & assembly.',
  },
  // Legacy aliases
  starter: {
    key: 'sales',
    name: 'Sales',
    baseMonthlyPrice: 39,
    maxUsers: 5,
    includedModules: ['sales'],
    description: 'Essential customer pipeline, quotations, CRM and sales order processing.',
  },
  growth: {
    key: 'sales_+_inventory',
    name: 'Sales + Inventory',
    baseMonthlyPrice: 79,
    maxUsers: 15,
    includedModules: ['sales', 'inventory'],
    description: 'Integrated sales, customer invoicing, stock warehouses and inventory control.',
  },
  enterprise: {
    key: 'full',
    name: 'Full',
    baseMonthlyPrice: 199,
    maxUsers: 50,
    includedModules: ['sales', 'inventory', 'purchasing', 'finance', 'manufacturing'],
    description: 'Complete platform suite with multi-entity accounting, procurement, manufacturing & assembly.',
  },
}
