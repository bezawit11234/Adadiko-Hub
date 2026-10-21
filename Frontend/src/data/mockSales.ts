/**
 * Mock Data for Adadiko Hub Sales Service
 * Kept strictly inside the data/ layer. Never imported directly by UI screens.
 * Starts completely EMPTY — no sample companies, no sample customers, no fake orders.
 */

import type {
  Customer,
  Quotation,
  SalesOrder,
  DeliveryNote,
  SalesInvoice,
  Payment,
  ApprovalRequest,
  SalesSummary,
} from '@/types'

export const MOCK_CUSTOMERS: Customer[] = []

export const MOCK_CATALOG_ITEMS: {
  itemCode: string
  itemName: string
  rate: number
  stockAvailable: number
  warehouse: string
}[] = []

export const MOCK_QUOTATIONS: Quotation[] = []

export const MOCK_SALES_ORDERS: SalesOrder[] = []

export const MOCK_DELIVERIES: DeliveryNote[] = []

export const MOCK_INVOICES: SalesInvoice[] = []

export const MOCK_PAYMENTS: Payment[] = []

export const MOCK_APPROVALS: ApprovalRequest[] = []

export const MOCK_SALES_SUMMARY: SalesSummary = {
  salesToday: 0.0,
  salesThisMonth: 0.0,
  salesMonthTarget: 0.0,
  openOrdersCount: 0,
  openOrdersValue: 0.0,
  unpaidInvoicesCount: 0,
  unpaidInvoicesTotal: 0.0,
  pipelineCounts: {
    quotations: 0,
    orders: 0,
    delivered: 0,
    invoiced: 0,
    paid: 0,
  },
  recentOrdersOverTime: [],
  teamPerformance: [],
}
