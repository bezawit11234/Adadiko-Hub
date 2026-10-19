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
import { frappeFetch } from './frappeHttp'
import {
  mapCustomer,
  mapQuotation,
  mapSalesOrder,
  mapDeliveryNote,
  mapSalesInvoice,
  mapApprovalRequest,
} from './mappers'

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
  async listCustomers(query?: string): Promise<ApiResult<Customer[]>> {
    const fields = encodeURIComponent(
      JSON.stringify([
        'name',
        'customer_name',
        'email_id',
        'mobile_no',
        'territory',
        'customer_group',
        'owner',
        'creation',
        'disabled',
      ])
    )
    const res = await frappeFetch<any[]>(
      `/api/resource/Customer?fields=${fields}&order_by=creation%20desc&limit_page_length=100`
    )
    if (!res.ok || !res.data) return { ok: false, error: res.error }

    let list = res.data.map(mapCustomer)
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.territory.toLowerCase().includes(q)
      )
    }
    return { ok: true, data: list }
  }

  async getCustomer(id: string): Promise<ApiResult<Customer>> {
    const res = await frappeFetch<any>(`/api/resource/Customer/${encodeURIComponent(id)}`)
    if (!res.ok || !res.data) return { ok: false, error: res.error }

    const customer = mapCustomer(res.data)

    // Calculate real outstanding balance from unpaid Sales Invoices
    try {
      const invFilters = encodeURIComponent(
        JSON.stringify([
          ['customer', '=', id],
          ['docstatus', '=', 1],
          ['outstanding_amount', '>', 0],
        ])
      )
      const invRes = await frappeFetch<any[]>(
        `/api/resource/Sales%20Invoice?filters=${invFilters}&fields=%5B%22outstanding_amount%22%5D&limit_page_length=100`
      )
      if (invRes.ok && Array.isArray(invRes.data)) {
        customer.amountOwed = invRes.data.reduce(
          (sum, inv) => sum + Number(inv.outstanding_amount || 0),
          0
        )
      }
    } catch {
      // non-fatal
    }

    return { ok: true, data: customer }
  }

  async createCustomer(payload: Omit<Customer, 'id' | 'createdDate'>): Promise<ApiResult<Customer>> {
    const res = await frappeFetch<any>('/api/resource/Customer', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: payload.name,
        customer_type: 'Company',
        customer_group: payload.group || 'Commercial',
        territory: payload.territory || 'All Territories',
        email_id: payload.email,
        mobile_no: payload.phone,
      }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: mapCustomer(res.data) }
  }

  async listQuotations(): Promise<ApiResult<Quotation[]>> {
    const fields = encodeURIComponent(
      JSON.stringify([
        'name',
        'party_name',
        'customer_name',
        'transaction_date',
        'valid_till',
        'net_total',
        'total_taxes_and_charges',
        'grand_total',
        'status',
        'owner',
        'docstatus',
      ])
    )
    const res = await frappeFetch<any[]>(
      `/api/resource/Quotation?fields=${fields}&order_by=creation%20desc&limit_page_length=100`
    )
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: res.data.map(mapQuotation) }
  }

  async createQuotation(payload: Omit<Quotation, 'id'>): Promise<ApiResult<Quotation>> {
    const docItems = payload.items.map((i) => ({
      item_code: i.itemCode,
      qty: i.qty,
      rate: i.rate,
    }))
    const res = await frappeFetch<any>('/api/resource/Quotation', {
      method: 'POST',
      body: JSON.stringify({
        quotation_to: 'Customer',
        party_name: payload.customerId || payload.customerName,
        transaction_date: payload.date || new Date().toISOString().split('T')[0],
        valid_till: payload.validTill,
        items: docItems,
      }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: mapQuotation(res.data) }
  }

  async listSalesOrders(): Promise<ApiResult<SalesOrder[]>> {
    const fields = encodeURIComponent(
      JSON.stringify([
        'name',
        'customer',
        'customer_name',
        'transaction_date',
        'delivery_date',
        'net_total',
        'total_taxes_and_charges',
        'grand_total',
        'status',
        'delivery_status',
        'billing_status',
        'owner',
        'docstatus',
      ])
    )
    const res = await frappeFetch<any[]>(
      `/api/resource/Sales%20Order?fields=${fields}&order_by=creation%20desc&limit_page_length=100`
    )
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: res.data.map(mapSalesOrder) }
  }

  async getSalesOrder(id: string): Promise<ApiResult<SalesOrder>> {
    const res = await frappeFetch<any>(`/api/resource/Sales%20Order/${encodeURIComponent(id)}`)
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    const order = mapSalesOrder(res.data)

    // Lookup linked Sales Invoice if any
    try {
      const invRes = await frappeFetch<any[]>(
        `/api/resource/Sales%20Invoice?filters=%5B%5B%22Sales%20Invoice%20Item%22%2C%22sales_order%22%2C%22%3D%22%2C%22${encodeURIComponent(id)}%22%5D%5D&fields=%5B%22name%22%5D&limit=1`
      )
      if (invRes.ok && invRes.data && invRes.data.length > 0) {
        order.invoiceId = invRes.data[0].name
      }
    } catch {
      // non-fatal
    }

    return { ok: true, data: order }
  }


  async createSalesOrder(
    payload: Omit<SalesOrder, 'id' | 'stage' | 'status' | 'deliveryStatus' | 'billingStatus'>
  ): Promise<ApiResult<SalesOrder>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.create_sales_order', {
      method: 'POST',
      body: JSON.stringify({
        customer: payload.customerId || payload.customerName,
        delivery_date: payload.deliveryDate,
        items: payload.items,
        submit: false,
      }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: mapSalesOrder(res.data) }
  }

  async createDelivery(salesOrderId: string): Promise<ApiResult<DeliveryNote>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.create_delivery_from_order', {
      method: 'POST',
      body: JSON.stringify({ sales_order_id: salesOrderId }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: mapDeliveryNote(res.data) }
  }

  async listDeliveries(): Promise<ApiResult<DeliveryNote[]>> {
    const fields = encodeURIComponent(
      JSON.stringify([
        'name',
        'customer',
        'customer_name',
        'posting_date',
        'status',
        'grand_total',
        'owner',
        'docstatus',
        'against_sales_order',
      ])
    )
    const res = await frappeFetch<any[]>(
      `/api/resource/Delivery%20Note?fields=${fields}&order_by=creation%20desc&limit_page_length=100`
    )
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: res.data.map(mapDeliveryNote) }
  }

  async createInvoiceFromOrder(salesOrderId: string): Promise<ApiResult<SalesInvoice>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.create_invoice_from_order', {
      method: 'POST',
      body: JSON.stringify({ sales_order_id: salesOrderId }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: mapSalesInvoice(res.data) }
  }

  async listSalesInvoices(): Promise<ApiResult<SalesInvoice[]>> {
    const fields = encodeURIComponent(
      JSON.stringify([
        'name',
        'customer',
        'customer_name',
        'posting_date',
        'due_date',
        'grand_total',
        'outstanding_amount',
        'status',
        'owner',
        'docstatus',
        'against_sales_order',
      ])
    )
    const res = await frappeFetch<any[]>(
      `/api/resource/Sales%20Invoice?fields=${fields}&order_by=creation%20desc&limit_page_length=100`
    )
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: res.data.map(mapSalesInvoice) }
  }

  async getSalesInvoice(id: string): Promise<ApiResult<SalesInvoice>> {
    const res = await frappeFetch<any>(`/api/resource/Sales%20Invoice/${encodeURIComponent(id)}`)
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: mapSalesInvoice(res.data) }
  }

  async recordPayment(
    invoiceId: string,
    amount: number,
    mode: 'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash',
    referenceNo: string
  ): Promise<ApiResult<Payment>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.record_payment_for_invoice', {
      method: 'POST',
      body: JSON.stringify({
        invoice_id: invoiceId,
        amount,
        mode,
        reference_no: referenceNo,
      }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    const payment: Payment = {
      id: res.data.name || `PAY-${Date.now()}`,
      invoiceId,
      customerName: res.data.party_name || '',
      amount,
      date: new Date().toISOString().split('T')[0],
      modeOfPayment: mode,
      referenceNo,
      receivedBy: res.data.owner || 'Finance Desk',
    }
    return { ok: true, data: payment }
  }

  async getSalesSummary(): Promise<ApiResult<SalesSummary>> {
    const res = await frappeFetch<SalesSummary>('/api/method/adadiko_hub.api.get_sales_summary')
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: res.data }
  }

  async listApprovals(): Promise<ApiResult<ApprovalRequest[]>> {
    const res = await frappeFetch<any[]>('/api/method/adadiko_hub.api.list_approvals')
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: res.data.map(mapApprovalRequest) }
  }

  async decideApproval(id: string, decision: 'Approved' | 'Rejected'): Promise<ApiResult<ApprovalRequest>> {
    if (decision === 'Approved') {
      const res = await frappeFetch<any>('/api/method/adadiko_hub.api.approve_sales_order', {
        method: 'POST',
        body: JSON.stringify({ order_id: id }),
      })
      if (!res.ok) return { ok: false, error: res.error }
    } else {
      const res = await frappeFetch<any>('/api/method/adadiko_hub.api.reject_sales_order', {
        method: 'POST',
        body: JSON.stringify({ order_id: id, reason: 'Rejected by sales manager' }),
      })
      if (!res.ok) return { ok: false, error: res.error }
    }
    return {
      ok: true,
      data: {
        id,
        documentType: 'Sales Order',
        documentId: id,
        customerName: '',
        amount: 0,
        requestedBy: '',
        requestDate: new Date().toISOString().split('T')[0],
        reason: decision === 'Approved' ? 'Order approved' : 'Order rejected',
        status: decision,
      },
    }
  }
}

// Singleton instances
const mockApiInstance = new MockSalesApi()
const frappeApiInstance = new FrappeSalesApi()

/**
 * Access adapter based on environment variable VITE_API_MODE (mock | frappe)
 */
export function getSalesApi(): SalesApi {
  let mode = import.meta.env.VITE_API_MODE
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('adadiko_api_mode')
    if (stored === 'mock' || stored === 'frappe') mode = stored
  }
  if (mode === 'frappe') {
    return frappeApiInstance
  }
  return mockApiInstance
}

