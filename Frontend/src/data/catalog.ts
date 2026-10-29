/**
 * Adadiko Hub Module Marketplace & Catalog Data
 */
import type { ModuleProduct, ModuleKey } from '@/types'

export const MODULE_CATALOG: ModuleProduct[] = [
  {
    id: 'sales',
    title: 'Sales & Customer Pipeline',
    tagline: 'Close deals faster from quotation to payment without paperwork friction.',
    description:
      'Manage customers, quotations, sales orders, dispatches, and invoices in one seamless pipeline designed for business velocity. Built to sync natively with ERPNext Selling.',
    monthlyPrice: 39,
    yearlyPrice: 32,
    badge: 'Core Priority',
    isCore: true,
    color: '#F08A3C',
    includedFeatures: [
      'Customer directory with outstanding balance tracking',
      'Quotation generation & instant order conversion',
      'Sales orders with inventory safety stock alerts',
      'Delivery note dispatch queue for storekeepers',
      'One-click invoice generation & payment recording',
      'Sales rep individual daily task & follow-up workspace',
      'Manager dashboard with revenue SVG trend & team targets',
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory & Warehousing',
    tagline: 'Precise multi-warehouse stock levels, reorder alerts, and serial tracking.',
    description:
      'Gain real-time visibility across bin locations, warehouse transfers, serialized items, and automated reorder triggers powered by Frappe Stock Engine.',
    monthlyPrice: 49,
    yearlyPrice: 39,
    badge: 'Coming Soon',
    isCore: false,
    color: '#1E8E5A',
    includedFeatures: [
      'Multi-warehouse stock balances & valuation',
      'Real-time low stock & reorder point automation',
      'Stock reconciliation and physical audit logs',
      'Batch, expiry, and serial number tracking',
      'Inter-warehouse transfer requests and receipts',
    ],
  },
  {
    id: 'purchasing',
    title: 'Procurement & Purchasing',
    tagline: 'Automate RFQs, purchase orders, and supplier payment terms.',
    description:
      'Streamline vendor onboarding, automated purchase requisitions, three-way matching against purchase receipts, and supplier statement reconciliation.',
    monthlyPrice: 39,
    yearlyPrice: 32,
    badge: 'Coming Soon',
    isCore: false,
    color: '#2C7BE5',
    includedFeatures: [
      'Vendor directory and price comparison sheets',
      'Purchase requisitions and managerial approvals',
      'Purchase Orders with delivery schedule tracking',
      'Three-way matching (PO, Receipt, Supplier Invoice)',
      'Automated replenishment orders based on sales forecasts',
    ],
  },
  {
    id: 'finance',
    title: 'Financial Accounting',
    tagline: 'General ledger, tax compliance, bank feeds, and P&L reporting.',
    description:
      'Double-entry bookkeeping aligned with IFRS standards. Automated journal entries, cash flow statements, VAT/sales tax returns, and real-time balance sheets.',
    monthlyPrice: 59,
    yearlyPrice: 48,
    badge: 'Coming Soon',
    isCore: false,
    color: '#8A5CF6',
    includedFeatures: [
      'Multi-currency General Ledger and Chart of Accounts',
      'Automated bank reconciliation via CSV / API',
      'Real-time P&L, Balance Sheet, and Cash Flow reports',
      'Sales tax / VAT compliance calculation & filing',
      'Accounts Receivable / Accounts Payable aging reports',
    ],
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing & Assembly',
    tagline: 'Bills of materials, work orders, capacity planning, and job cards.',
    description:
      'Plan production runs, monitor machine utilization, manage multi-level BOMs with scrap calculation, and compute precise product costing.',
    monthlyPrice: 69,
    yearlyPrice: 55,
    badge: 'Coming Soon',
    isCore: false,
    color: '#D97706',
    includedFeatures: [
      'Multi-level Bill of Materials (BOM) with scrap tracking',
      'Work order scheduling & operator job card tablets',
      'Workstation capacity and downtime tracking',
      'Raw material staging and WIP valuation',
      'Finished goods quality inspection gates',
    ],
  },
]

export interface PricingTier {
  id: 'starter' | 'growth' | 'enterprise'
  name: string
  tagline: string
  monthlyBasePrice: number
  yearlyBasePrice: number
  includedUsers: number
  extraUserPrice: number
  features: string[]
  recommended?: boolean
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter Workspace',
    tagline: 'Perfect for agile single-site commercial teams getting organized.',
    monthlyBasePrice: 49,
    yearlyBasePrice: 39,
    includedUsers: 3,
    extraUserPrice: 12,
    features: [
      'Access to any 1 core module (e.g. Sales)',
      'Up to 3 team members included',
      'Standard email support (24h response)',
      'Daily automated cloud backups',
      'Ready for high-availability enterprise cloud deployment',
    ],
  },
  {
    id: 'growth',
    name: 'Growth Suite',
    tagline: 'Designed for scaling companies orchestrating cross-department workflows.',
    monthlyBasePrice: 119,
    yearlyBasePrice: 99,
    includedUsers: 10,
    extraUserPrice: 10,
    recommended: true,
    features: [
      'Access to Sales + up to 2 additional modules',
      '10 team members included with role permissions',
      'Priority live chat & email support',
      'Custom invoice templates & branding',
      'Role-based approval hierarchies (Manager & Reps)',
      'Webhook & REST API access for external apps',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Custom',
    tagline: 'For established enterprises demanding dedicated instances & compliance.',
    monthlyBasePrice: 249,
    yearlyBasePrice: 199,
    includedUsers: 25,
    extraUserPrice: 8,
    features: [
      'All 5 business modules included',
      '25 team members with granular permissions',
      'Dedicated Frappe / ERPNext isolated database',
      '99.9% uptime SLA and dedicated account manager',
      'Custom DocType workflows and scripts onboarding',
      'Single Sign-On (SAML / Google Workspace / Azure AD)',
    ],
  },
]
