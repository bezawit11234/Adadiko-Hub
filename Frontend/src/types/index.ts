/**
 * Adadiko Hub Core Types
 * Prepares the schema for Frappe / ERPNext v16 integration.
 */

// Module identifier for marketplace, licensing, and access control
export type ModuleKey = 'sales' | 'inventory' | 'purchasing' | 'finance' | 'manufacturing'

// System roles mapped to ERPNext Role Profiles
// ERPNext Roles: 'System Manager', 'Sales Manager', 'Sales User', 'Accounts User', 'Stock User'
export type Role =
  | 'admin'          // Company Admin -> ERPNext: System Manager
  | 'sales_manager'  // Sales Manager -> ERPNext: Sales Manager
  | 'sales_rep'      // Sales Rep     -> ERPNext: Sales User
  | 'accountant'     // Accountant    -> ERPNext: Accounts User
  | 'storekeeper'    // Storekeeper   -> ERPNext: Stock User
  | 'adadiko_staff'  // Adadiko Staff -> Back-office Admin operator

export interface RoleDefinition {
  key: Role
  label: string
  erpnextRole: string
  description: string
  defaultHome: string
}

// User representation
// ERPNext DocType: "User" (fields: name, email, first_name, last_name, roles, enabled)
export interface User {
  id: string
  email: string
  name: string
  role: Role
  organizationId: string
  avatar?: string
  isDemo?: boolean
}

// Organization representation
// ERPNext DocType: "Company" (fields: name, company_name, default_currency, country)
export interface Organization {
  id: string
  name: string
  slug?: string
  siteName?: string
  plan: 'starter' | 'growth' | 'enterprise'
  billingCycle: 'monthly' | 'yearly'
  subscribedModules: ModuleKey[]
  createdDate: string
  status: 'active' | 'trial' | 'suspended'
  currency?: string
}

// Result envelope returned by every service method
export interface ApiResult<T> {
  ok: boolean
  data?: T
  error?: string
}

// --- SALES MODULE DOCTYPES ---

// Customer representation
// ERPNext DocType: "Customer"
// ERPNext fields: name, customer_name, customer_group, territory, customer_type, email_id, mobile_no, outstanding_amount
export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  territory: string
  group: string
  status: 'Active' | 'Prospect' | 'Inactive'
  amountOwed: number      // ERPNext: outstanding_amount
  assignedTo: string      // User ID or Sales Rep name (for ownership filters)
  address?: string
  notes?: string
  createdDate: string
}

// Item row inside Quotations, Sales Orders, Deliveries, and Invoices
// ERPNext DocType: "Sales Order Item" / "Quotation Item" / "Delivery Note Item"
// ERPNext fields: item_code, item_name, qty, rate, amount, stock_qty, warehouse
export interface OrderItem {
  id: string
  itemCode: string
  itemName: string
  qty: number
  rate: number
  amount: number          // qty * rate
  stockAvailable: number  // Available in Main Store
  warehouse?: string
}

// Quotation
// ERPNext DocType: "Quotation"
// ERPNext fields: name, quotation_to, party_name, transaction_date, valid_till, items, net_total, total_taxes_and_charges, grand_total, status
export interface Quotation {
  id: string
  customerName: string
  customerId: string
  date: string
  validTill: string
  items: OrderItem[]
  subtotal: number
  taxAmount: number
  grandTotal: number
  status: 'Draft' | 'Submitted' | 'Ordered' | 'Expired' | 'Rejected'
  createdBy: string
}

// Sales Order
// ERPNext DocType: "Sales Order"
// ERPNext fields: name, customer, transaction_date, delivery_date, items, net_total, total_taxes_and_charges, grand_total, status, delivery_status, billing_status
export type OrderStage = 'Quotation' | 'Sales Order' | 'Delivery' | 'Invoice' | 'Payment'

export interface SalesOrder {
  id: string
  customerName: string
  customerId: string
  orderDate: string
  deliveryDate: string
  items: OrderItem[]
  subtotal: number
  taxAmount: number
  grandTotal: number
  status: 'Draft' | 'To Deliver and Bill' | 'To Deliver' | 'To Bill' | 'Completed' | 'Cancelled'
  stage: OrderStage
  deliveryStatus: 'Not Delivered' | 'Partially Delivered' | 'Fully Delivered'
  billingStatus: 'Not Billed' | 'Partially Billed' | 'Fully Billed' | 'Paid'
  deliveryNoteId?: string
  invoiceId?: string
  quotationId?: string
  assignedTo: string
  notes?: string
}

// Delivery Note
// ERPNext DocType: "Delivery Note"
// ERPNext fields: name, customer, posting_date, items, status, against_sales_order
export interface DeliveryNote {
  id: string
  salesOrderId: string
  customerName: string
  postingDate: string
  items: OrderItem[]
  status: 'Draft' | 'Submitted' | 'Delivered' | 'Return'
  carrier?: string
  trackingNo?: string
  preparedBy: string
}

// Sales Invoice
// ERPNext DocType: "Sales Invoice"
// ERPNext fields: name, customer, posting_date, due_date, items, grand_total, outstanding_amount, status, against_sales_order
export interface SalesInvoice {
  id: string
  salesOrderId?: string
  customerName: string
  customerId: string
  postingDate: string
  dueDate: string
  items: OrderItem[]
  grandTotal: number
  amountPaid: number
  outstandingAmount: number  // "Customer owes"
  status: 'Unpaid' | 'Paid' | 'Overdue' | 'Partially Paid'
}

// Payment Entry
// ERPNext DocType: "Payment Entry"
// ERPNext fields: name, payment_type, party_type, party, paid_amount, reference_no, reference_date, mode_of_payment
export interface Payment {
  id: string
  invoiceId: string
  customerName: string
  amount: number
  date: string
  modeOfPayment: 'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash'
  referenceNo: string
  receivedBy: string
  notes?: string
}

// Approval Request (for Sales Manager approval workflow)
// Maps to ERPNext Workflow Action / Approval state
export interface ApprovalRequest {
  id: string
  documentType: 'Sales Order' | 'Quotation' | 'Discount'
  documentId: string
  customerName: string
  amount: number
  requestedBy: string
  requestDate: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

// Sales Summary KPI metrics
export interface SalesSummary {
  salesToday: number
  salesThisMonth: number
  salesMonthTarget: number
  openOrdersCount: number
  openOrdersValue: number
  unpaidInvoicesCount: number
  unpaidInvoicesTotal: number
  pipelineCounts: {
    quotations: number
    orders: number
    delivered: number
    invoiced: number
    paid: number
  }
  recentOrdersOverTime: { date: string; amount: number; count: number }[]
  teamPerformance: {
    repId: string
    repName: string
    ordersClosed: number
    revenue: number
    targetRevenue: number
    targetPct: number
  }[]
  recentCompletedOrders?: SalesOrder[]
  currency?: string
}

// Catalog Product for Marketplace & Pricing
export interface ModuleProduct {
  id: ModuleKey
  title: string
  tagline: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  badge?: string
  includedFeatures: string[]
  isCore?: boolean
  color: string
}
