/**
 * Adadiko Hub Sales Service Layer
 *
 * Implements the SalesApi interface with two adapters:
 * 1. MockSalesApi: In-memory reactive state with simulated micro-delays for instant testing.
 * 2. FrappeSalesApi: Direct client for ERPNext / Frappe v16 REST API endpoints.
 */

import type {
  ApiResult,
  Customer,
  Quotation,
  SalesOrder,
  DeliveryNote,
  SalesInvoice,
  Payment,
  SalesSummary,
  ApprovalRequest,
} from '@/types'
import {
  MOCK_CUSTOMERS,
  MOCK_QUOTATIONS,
  MOCK_SALES_ORDERS,
  MOCK_DELIVERIES,
  MOCK_INVOICES,
  MOCK_PAYMENTS,
  MOCK_APPROVALS,
  MOCK_SALES_SUMMARY,
} from '@/data/mockSales'

export interface SalesApi {
  listCustomers(query?: string): Promise<ApiResult<Customer[]>>
  getCustomer(id: string): Promise<ApiResult<Customer>>
  createCustomer(payload: Omit<Customer, 'id' | 'createdDate'>): Promise<ApiResult<Customer>>
  listQuotations(): Promise<ApiResult<Quotation[]>>
  createQuotation(payload: Omit<Quotation, 'id'>): Promise<ApiResult<Quotation>>
  listSalesOrders(): Promise<ApiResult<SalesOrder[]>>
  getSalesOrder(id: string): Promise<ApiResult<SalesOrder>>
  createSalesOrder(payload: Omit<SalesOrder, 'id' | 'stage' | 'status' | 'deliveryStatus' | 'billingStatus'>): Promise<ApiResult<SalesOrder>>
  createDelivery(salesOrderId: string): Promise<ApiResult<DeliveryNote>>
  listDeliveries(): Promise<ApiResult<DeliveryNote[]>>
  createInvoiceFromOrder(salesOrderId: string): Promise<ApiResult<SalesInvoice>>
  listSalesInvoices(): Promise<ApiResult<SalesInvoice[]>>
  getSalesInvoice(id: string): Promise<ApiResult<SalesInvoice>>
  recordPayment(
    invoiceId: string,
    amount: number,
    mode: 'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash',
    referenceNo: string
  ): Promise<ApiResult<Payment>>
  getSalesSummary(): Promise<ApiResult<SalesSummary>>
  listApprovals(): Promise<ApiResult<ApprovalRequest[]>>
  decideApproval(id: string, decision: 'Approved' | 'Rejected'): Promise<ApiResult<ApprovalRequest>>
}

// In-memory state for mock adapter
class MockSalesApi implements SalesApi {
  private customers = [...MOCK_CUSTOMERS]
  private quotations = [...MOCK_QUOTATIONS]
  private orders = [...MOCK_SALES_ORDERS]
  private deliveries = [...MOCK_DELIVERIES]
  private invoices = [...MOCK_INVOICES]
  private payments = [...MOCK_PAYMENTS]
  private approvals = [...MOCK_APPROVALS]
  private summary = { ...MOCK_SALES_SUMMARY }

  private async delay(ms = 80): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async listCustomers(query?: string): Promise<ApiResult<Customer[]>> {
    await this.delay()
    if (!query) {
      return { ok: true, data: [...this.customers] }
    }
    const q = query.toLowerCase()
    const filtered = this.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.territory.toLowerCase().includes(q)
    )
    return { ok: true, data: filtered }
  }

  async getCustomer(id: string): Promise<ApiResult<Customer>> {
    await this.delay()
    const found = this.customers.find((c) => c.id === id)
    if (!found) return { ok: false, error: `Customer with ID ${id} not found.` }
    return { ok: true, data: { ...found } }
  }

  async createCustomer(payload: Omit<Customer, 'id' | 'createdDate'>): Promise<ApiResult<Customer>> {
    await this.delay()
    const newCustomer: Customer = {
      ...payload,
      id: `CUST-${String(this.customers.length + 1).padStart(3, '0')}`,
      createdDate: new Date().toISOString().split('T')[0],
      amountOwed: 0,
    }
    this.customers.unshift(newCustomer)
    return { ok: true, data: newCustomer }
  }

  async listQuotations(): Promise<ApiResult<Quotation[]>> {
    await this.delay()
    return { ok: true, data: [...this.quotations] }
  }

  async createQuotation(payload: Omit<Quotation, 'id'>): Promise<ApiResult<Quotation>> {
    await this.delay()
    const newQuotation: Quotation = {
      ...payload,
      id: `QTN-2026-${String(this.quotations.length + 82).padStart(4, '0')}`,
    }
    this.quotations.unshift(newQuotation)
    this.summary.pipelineCounts.quotations++
    return { ok: true, data: newQuotation }
  }

  async listSalesOrders(): Promise<ApiResult<SalesOrder[]>> {
    await this.delay()
    return { ok: true, data: [...this.orders] }
  }

  async getSalesOrder(id: string): Promise<ApiResult<SalesOrder>> {
    await this.delay()
    const found = this.orders.find((o) => o.id === id)
    if (!found) return { ok: false, error: `Sales order ${id} not found.` }
    return { ok: true, data: { ...found } }
  }

  async createSalesOrder(
    payload: Omit<SalesOrder, 'id' | 'stage' | 'status' | 'deliveryStatus' | 'billingStatus'>
  ): Promise<ApiResult<SalesOrder>> {
    await this.delay()
    const newOrder: SalesOrder = {
      ...payload,
      id: `SO-2026-${String(this.orders.length + 105).padStart(4, '0')}`,
      stage: 'Sales Order',
      status: 'To Deliver and Bill',
      deliveryStatus: 'Not Delivered',
      billingStatus: 'Not Billed',
    }
    this.orders.unshift(newOrder)
    this.summary.openOrdersCount++
    this.summary.openOrdersValue += newOrder.grandTotal
    this.summary.pipelineCounts.orders++
    return { ok: true, data: newOrder }
  }

  async createDelivery(salesOrderId: string): Promise<ApiResult<DeliveryNote>> {
    await this.delay()
    const order = this.orders.find((o) => o.id === salesOrderId)
    if (!order) return { ok: false, error: `Order ${salesOrderId} not found.` }

    const newDelivery: DeliveryNote = {
      id: `DN-2026-${String(this.deliveries.length + 53).padStart(4, '0')}`,
      salesOrderId: order.id,
      customerName: order.customerName,
      postingDate: new Date().toISOString().split('T')[0],
      items: [...order.items],
      status: 'Delivered',
      carrier: 'Main Store Dispatch',
      preparedBy: 'Storekeeper Kwame',
    }
    this.deliveries.unshift(newDelivery)

    // Advance order stage to Delivery & Invoice
    order.deliveryStatus = 'Fully Delivered'
    order.deliveryNoteId = newDelivery.id
    order.stage = 'Invoice'
    order.status = 'To Bill'
    this.summary.pipelineCounts.delivered++

    return { ok: true, data: newDelivery }
  }

  async listDeliveries(): Promise<ApiResult<DeliveryNote[]>> {
    await this.delay()
    return { ok: true, data: [...this.deliveries] }
  }

  async createInvoiceFromOrder(salesOrderId: string): Promise<ApiResult<SalesInvoice>> {
    await this.delay()
    const order = this.orders.find((o) => o.id === salesOrderId)
    if (!order) return { ok: false, error: `Order ${salesOrderId} not found.` }

    const today = new Date().toISOString().split('T')[0]
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const newInvoice: SalesInvoice = {
      id: `SINV-2026-${String(this.invoices.length + 45).padStart(4, '0')}`,
      salesOrderId: order.id,
      customerName: order.customerName,
      customerId: order.customerId,
      postingDate: today,
      dueDate,
      items: [...order.items],
      grandTotal: order.grandTotal,
      amountPaid: 0,
      outstandingAmount: order.grandTotal,
      status: 'Unpaid',
    }
    this.invoices.unshift(newInvoice)

    // Advance order state
    order.billingStatus = 'Partially Billed'
    order.invoiceId = newInvoice.id
    order.stage = 'Payment'
    order.status = 'To Bill'

    // Update customer debt
    const customer = this.customers.find((c) => c.id === order.customerId)
    if (customer) {
      customer.amountOwed += order.grandTotal
    }

    this.summary.unpaidInvoicesCount++
    this.summary.unpaidInvoicesTotal += order.grandTotal
    this.summary.pipelineCounts.invoiced++

    return { ok: true, data: newInvoice }
  }

  async listSalesInvoices(): Promise<ApiResult<SalesInvoice[]>> {
    await this.delay()
    return { ok: true, data: [...this.invoices] }
  }

  async getSalesInvoice(id: string): Promise<ApiResult<SalesInvoice>> {
    await this.delay()
    const found = this.invoices.find((i) => i.id === id)
    if (!found) return { ok: false, error: `Invoice ${id} not found.` }
    return { ok: true, data: { ...found } }
  }

  async recordPayment(
    invoiceId: string,
    amount: number,
    mode: 'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash',
    referenceNo: string
  ): Promise<ApiResult<Payment>> {
    await this.delay()
    const invoice = this.invoices.find((i) => i.id === invoiceId)
    if (!invoice) return { ok: false, error: `Invoice ${invoiceId} not found.` }

    const payment: Payment = {
      id: `PAY-2026-${String(this.payments.length + 22).padStart(4, '0')}`,
      invoiceId: invoice.id,
      customerName: invoice.customerName,
      amount,
      date: new Date().toISOString().split('T')[0],
      modeOfPayment: mode,
      referenceNo,
      receivedBy: 'Finance Desk',
    }
    this.payments.unshift(payment)

    invoice.amountPaid += amount
    invoice.outstandingAmount = Math.max(0, invoice.outstandingAmount - amount)
    if (invoice.outstandingAmount === 0) {
      invoice.status = 'Paid'
      this.summary.unpaidInvoicesCount = Math.max(0, this.summary.unpaidInvoicesCount - 1)
      this.summary.pipelineCounts.paid++
    }

    // Customer balance update
    const customer = this.customers.find((c) => c.id === invoice.customerId)
    if (customer) {
      customer.amountOwed = Math.max(0, customer.amountOwed - amount)
    }

    // Associated Sales Order completion check
    if (invoice.salesOrderId) {
      const order = this.orders.find((o) => o.id === invoice.salesOrderId)
      if (order && invoice.status === 'Paid') {
        order.billingStatus = 'Paid'
        order.status = 'Completed'
        order.stage = 'Payment'
      }
    }

    this.summary.salesToday += amount
    this.summary.salesThisMonth += amount

    return { ok: true, data: payment }
  }

  async getSalesSummary(): Promise<ApiResult<SalesSummary>> {
    await this.delay()
    return { ok: true, data: { ...this.summary } }
  }

  async listApprovals(): Promise<ApiResult<ApprovalRequest[]>> {
    await this.delay()
    return { ok: true, data: [...this.approvals] }
  }

  async decideApproval(id: string, decision: 'Approved' | 'Rejected'): Promise<ApiResult<ApprovalRequest>> {
    await this.delay()
    const found = this.approvals.find((a) => a.id === id)
    if (!found) return { ok: false, error: `Approval ${id} not found.` }
    found.status = decision
    return { ok: true, data: { ...found } }
  }
}

/**
 * Empty FrappeSalesApi Adapter
 *
 * Prepares the production integration with ERPNext v16 backend.
 * Each method below documents the corresponding ERPNext DocType and Frappe method.
 */
class FrappeSalesApi implements SalesApi {
  // TODO: ERPNext Call: GET /api/resource/Customer?fields=["name","customer_name","email_id","mobile_no","territory","outstanding_amount"]
  async listCustomers(query?: string): Promise<ApiResult<Customer[]>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: GET /api/resource/Customer/:id
  async getCustomer(id: string): Promise<ApiResult<Customer>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: POST /api/resource/Customer
  async createCustomer(payload: Omit<Customer, 'id' | 'createdDate'>): Promise<ApiResult<Customer>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: GET /api/resource/Quotation
  async listQuotations(): Promise<ApiResult<Quotation[]>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: POST /api/resource/Quotation
  async createQuotation(payload: Omit<Quotation, 'id'>): Promise<ApiResult<Quotation>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: GET /api/resource/Sales Order
  async listSalesOrders(): Promise<ApiResult<SalesOrder[]>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: GET /api/resource/Sales Order/:id
  async getSalesOrder(id: string): Promise<ApiResult<SalesOrder>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: POST /api/resource/Sales Order
  async createSalesOrder(payload: Omit<SalesOrder, 'id' | 'stage' | 'status' | 'deliveryStatus' | 'billingStatus'>): Promise<ApiResult<SalesOrder>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: POST /api/method/erpnext.selling.doctype.sales_order.sales_order.make_delivery_note
  async createDelivery(salesOrderId: string): Promise<ApiResult<DeliveryNote>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: GET /api/resource/Delivery Note
  async listDeliveries(): Promise<ApiResult<DeliveryNote[]>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: POST /api/method/erpnext.selling.doctype.sales_order.sales_order.make_sales_invoice
  async createInvoiceFromOrder(salesOrderId: string): Promise<ApiResult<SalesInvoice>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: GET /api/resource/Sales Invoice
  async listSalesInvoices(): Promise<ApiResult<SalesInvoice[]>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: GET /api/resource/Sales Invoice/:id
  async getSalesInvoice(id: string): Promise<ApiResult<SalesInvoice>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: POST /api/resource/Payment Entry
  async recordPayment(invoiceId: string, amount: number, mode: string, referenceNo: string): Promise<ApiResult<Payment>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: GET /api/method/erpnext.selling.doctype.sales_order.sales_order.get_sales_analytics
  async getSalesSummary(): Promise<ApiResult<SalesSummary>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: GET /api/resource/Workflow Action?filters=[["reference_doctype","=","Sales Order"]]
  async listApprovals(): Promise<ApiResult<ApprovalRequest[]>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }

  // TODO: ERPNext Call: POST /api/method/frappe.model.workflow.apply_workflow
  async decideApproval(id: string, decision: 'Approved' | 'Rejected'): Promise<ApiResult<ApprovalRequest>> {
    return { ok: false, error: 'Frappe integration pending backend configuration.' }
  }
}

// Singleton instances
const mockApiInstance = new MockSalesApi()
const frappeApiInstance = new FrappeSalesApi()

/**
 * Access adapter based on environment variable VITE_API_MODE (mock | frappe)
 */
export function getSalesApi(): SalesApi {
  const mode = import.meta.env.VITE_API_MODE
  if (mode === 'frappe') {
    return frappeApiInstance
  }
  return mockApiInstance
}
