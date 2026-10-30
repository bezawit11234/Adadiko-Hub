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
import { setAppCurrency, getAppCurrency } from '@/utils/format'
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
  listItems(): Promise<ApiResult<{ itemCode: string; itemName: string; rate: number; stockAvailable: number; warehouse: string }[]>>
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

const STORAGE_KEY_SALES = 'adadiko_mock_sales_store'

interface MockSalesState {
  customers: Customer[]
  quotations: Quotation[]
  orders: SalesOrder[]
  deliveries: DeliveryNote[]
  invoices: SalesInvoice[]
  payments: Payment[]
  approvals: ApprovalRequest[]
  summary: SalesSummary
}

function getInitialMockState(): MockSalesState {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SALES)
      if (raw) return JSON.parse(raw)
    } catch {
      // fallback
    }
  }
  return {
    customers: [],
    quotations: [],
    orders: [],
    deliveries: [],
    invoices: [],
    payments: [],
    approvals: [],
    summary: {
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
    },
  }
}

// In-memory state for mock adapter, starts EMPTY and saves to browser storage
class MockSalesApi implements SalesApi {
  private state: MockSalesState = getInitialMockState()

  private get customers() { return this.state.customers }
  private get quotations() { return this.state.quotations }
  private get orders() { return this.state.orders }
  private get deliveries() { return this.state.deliveries }
  private get invoices() { return this.state.invoices }
  private get payments() { return this.state.payments }
  private get approvals() { return this.state.approvals }
  private get summary() { return this.state.summary }

  private saveState(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(this.state))
      } catch {
        // ignore
      }
    }
  }

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
    this.saveState()
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
    this.saveState()
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
      quotationId: payload.quotationId,
    }
    this.orders.unshift(newOrder)
    this.summary.openOrdersCount++
    this.summary.openOrdersValue += newOrder.grandTotal
    this.summary.pipelineCounts.orders++
    this.saveState()
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
    this.saveState()

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
    this.saveState()

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
    this.saveState()

    return { ok: true, data: payment }
  }

  async getSalesSummary(): Promise<ApiResult<SalesSummary>> {
    await this.delay()
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = today.slice(0, 7)

    const paidInvoices = this.invoices.filter((i) => i.status === 'Paid' || i.outstandingAmount <= 0)
    const unpaidInvoices = this.invoices.filter((i) => i.status !== 'Paid' && i.outstandingAmount > 0)
    const openOrders = this.orders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled')
    const completedOrders = this.orders.filter((o) => o.status === 'Completed' || o.billingStatus === 'Paid')

    const salesToday =
      this.payments
        .filter((p) => p.date === today)
        .reduce((acc, p) => acc + p.amount, 0) ||
      paidInvoices
        .filter((i) => i.postingDate === today)
        .reduce((acc, i) => acc + i.grandTotal, 0)

    const salesThisMonth =
      this.payments
        .filter((p) => (p.date || '').startsWith(currentMonth))
        .reduce((acc, p) => acc + p.amount, 0) ||
      paidInvoices
        .filter((i) => (i.postingDate || '').startsWith(currentMonth))
        .reduce((acc, i) => acc + i.grandTotal, 0)

    const summary: SalesSummary = {
      salesToday,
      salesThisMonth,
      salesMonthTarget: 60000.0,
      openOrdersCount: openOrders.length,
      openOrdersValue: openOrders.reduce((acc, o) => acc + o.grandTotal, 0),
      unpaidInvoicesCount: unpaidInvoices.length,
      unpaidInvoicesTotal: unpaidInvoices.reduce((acc, i) => acc + i.outstandingAmount, 0),
      pipelineCounts: {
        quotations: this.quotations.length,
        orders: this.orders.length,
        delivered: this.deliveries.length,
        invoiced: this.invoices.length,
        paid: paidInvoices.length,
      },
      recentOrdersOverTime: this.summary.recentOrdersOverTime || [],
      teamPerformance: this.summary.teamPerformance || [],
      recentCompletedOrders: completedOrders.slice(0, 5),
      currency: getAppCurrency(),
    }

    return { ok: true, data: summary }
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
    this.saveState()
    return { ok: true, data: { ...found } }
  }

  async listItems(): Promise<ApiResult<{ itemCode: string; itemName: string; rate: number; stockAvailable: number; warehouse: string }[]>> {
    await this.delay()
    return {
      ok: true,
      data: [
        { itemCode: 'ITEM-SOLAR-PANEL', itemName: 'Solar Panel 400W Monocrystalline', rate: 180, stockAvailable: 50, warehouse: 'Main Warehouse' },
        { itemCode: 'ITEM-BATTERY-PACK', itemName: 'Lithium Battery Pack 5kWh', rate: 1250, stockAvailable: 20, warehouse: 'Main Warehouse' },
        { itemCode: 'ITEM-HYBRID-INV', itemName: 'Hybrid Inverter 5kVA', rate: 850, stockAvailable: 15, warehouse: 'Main Warehouse' },
        { itemCode: 'ITEM-CABLE-KIT', itemName: 'Solar Cable & Connector Kit 100m', rate: 95, stockAvailable: 100, warehouse: 'Main Warehouse' },
      ],
    }
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
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.create_customer', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: payload.name,
        email: payload.email,
        phone: payload.phone,
        territory: payload.territory,
        customer_group: payload.group,
        notes: payload.notes,
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
      itemCode: i.itemCode,
      itemName: i.itemName,
      qty: i.qty,
      rate: i.rate,
    }))
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.create_quotation', {
      method: 'POST',
      body: JSON.stringify({
        customer: payload.customerId || payload.customerName,
        valid_till: payload.validTill,
        items: docItems,
        submit: false,
      }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: mapQuotation(res.data) }
  }

  async listItems(): Promise<ApiResult<{ itemCode: string; itemName: string; rate: number; stockAvailable: number; warehouse: string }[]>> {
    const res = await frappeFetch<any[]>('/api/method/adadiko_hub.api.list_items')
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      return { ok: true, data: res.data }
    }
    return {
      ok: true,
      data: [
        { itemCode: 'ITEM-SOLAR-PANEL', itemName: 'Solar Panel 400W Monocrystalline', rate: 180, stockAvailable: 50, warehouse: 'Main Warehouse' },
        { itemCode: 'ITEM-BATTERY-PACK', itemName: 'Lithium Battery Pack 5kWh', rate: 1250, stockAvailable: 20, warehouse: 'Main Warehouse' },
        { itemCode: 'ITEM-HYBRID-INV', itemName: 'Hybrid Inverter 5kVA', rate: 850, stockAvailable: 15, warehouse: 'Main Warehouse' },
        { itemCode: 'ITEM-CABLE-KIT', itemName: 'Solar Cable & Connector Kit 100m', rate: 95, stockAvailable: 100, warehouse: 'Main Warehouse' },
      ],
    }
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
    const res = await frappeFetch<any>(
      `/api/method/adadiko_hub.api.get_sales_order_details?sales_order_id=${encodeURIComponent(id)}`
    )
    if (res.ok && res.data) {
      const order = mapSalesOrder(res.data)
      if (res.data.invoice_id) order.invoiceId = res.data.invoice_id
      if (res.data.delivery_note_id) order.deliveryNoteId = res.data.delivery_note_id
      if (res.data.quotation_id) order.quotationId = res.data.quotation_id
      return { ok: true, data: order }
    }

    const fallbackRes = await frappeFetch<any>(`/api/resource/Sales%20Order/${encodeURIComponent(id)}`)
    if (!fallbackRes.ok || !fallbackRes.data) return { ok: false, error: fallbackRes.error }
    return { ok: true, data: mapSalesOrder(fallbackRes.data) }
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
        submit: true,
        quotation_id: payload.quotationId,
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
    const customRes = await frappeFetch<any[]>('/api/method/adadiko_hub.api.list_deliveries')
    if (customRes.ok && Array.isArray(customRes.data)) {
      return { ok: true, data: customRes.data.map(mapDeliveryNote) }
    }

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
      `/api/resource/Delivery%20Note?fields=${fields}&order_by=posting_date%20desc,creation%20desc&limit_page_length=100`
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
    const customRes = await frappeFetch<any[]>('/api/method/adadiko_hub.api.list_sales_invoices')
    if (customRes.ok && Array.isArray(customRes.data)) {
      return { ok: true, data: customRes.data.map(mapSalesInvoice) }
    }

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
      `/api/resource/Sales%20Invoice?fields=${fields}&order_by=posting_date%20desc,creation%20desc&limit_page_length=100`
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
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.get_sales_summary')
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    if (res.data.currency) {
      setAppCurrency(res.data.currency)
    }
    const summary: SalesSummary = {
      salesToday: Number(res.data.sales_today ?? res.data.salesToday ?? 0),
      salesThisMonth: Number(res.data.sales_month ?? res.data.salesThisMonth ?? 0),
      salesMonthTarget: Number(res.data.sales_month_target ?? res.data.salesMonthTarget ?? 60000),
      openOrdersCount: Number(res.data.open_orders_count ?? res.data.open_orders ?? 0),
      openOrdersValue: Number(res.data.open_orders_value ?? 0),
      unpaidInvoicesCount: Number(res.data.unpaid_invoices_count ?? 0),
      unpaidInvoicesTotal: Number(res.data.unpaid_invoices_total ?? res.data.unpaid_invoices ?? 0),
      pipelineCounts: {
        quotations: Number(res.data.pipeline_counts?.quotations ?? 0),
        orders: Number(res.data.pipeline_counts?.orders ?? 0),
        delivered: Number(res.data.pipeline_counts?.delivered ?? 0),
        invoiced: Number(res.data.pipeline_counts?.invoiced ?? 0),
        paid: Number(res.data.pipeline_counts?.paid ?? 0),
      },
      recentOrdersOverTime: res.data.recent_orders_over_time || [],
      teamPerformance: res.data.team_performance || [],
      recentCompletedOrders: Array.isArray(res.data.recent_completed_orders)
        ? res.data.recent_completed_orders.map(mapSalesOrder)
        : [],
      currency: res.data.currency || getAppCurrency(),
    }
    return { ok: true, data: summary }
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
  let mode = (import.meta.env.VITE_API_MODE as string) || 'frappe'
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('adadiko_api_mode')
    if (stored === 'mock') mode = 'mock'
    else mode = 'frappe'
  }
  if (mode === 'frappe') {
    return frappeApiInstance
  }
  return mockApiInstance
}

