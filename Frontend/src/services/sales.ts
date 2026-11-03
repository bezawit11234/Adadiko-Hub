/**
 * Adadiko Hub Sales Service Layer
 *
 * Implements the SalesApi interface with two adapters:
 * 1. MockSalesApi: In-memory reactive state with simulated micro-delays for instant testing.
 * 2. FrappeSalesApi: Direct client for ERPNext / Frappe v16 REST API endpoints.
 */

import type {
  ApiResult,
  Lead,
  Opportunity,
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
  listLeads(query?: string): Promise<ApiResult<Lead[]>>
  getLead(id: string): Promise<ApiResult<Lead>>
  createLead(payload: { name: string; companyName?: string; email?: string; phone?: string; source?: string }): Promise<ApiResult<Lead>>
  convertLeadToCustomer(leadId: string): Promise<ApiResult<Customer>>
  convertLeadToOpportunity(leadId: string): Promise<ApiResult<Opportunity>>
  convertLeadToQuotation(leadId: string): Promise<ApiResult<Quotation>>

  listOpportunities(query?: string): Promise<ApiResult<Opportunity[]>>
  getOpportunity(id: string): Promise<ApiResult<Opportunity>>
  createOpportunity(payload: { partyName: string; partyType?: 'Lead' | 'Customer'; expectedValue?: number; expectedCloseDate?: string }): Promise<ApiResult<Opportunity>>
  convertOpportunityToQuotation(opportunityId: string): Promise<ApiResult<Quotation>>
  markOpportunityLost(opportunityId: string, reason?: string): Promise<ApiResult<Opportunity>>

  listCustomers(query?: string): Promise<ApiResult<Customer[]>>
  getCustomer(id: string): Promise<ApiResult<Customer>>
  createCustomer(payload: Omit<Customer, 'id' | 'createdDate'>): Promise<ApiResult<Customer>>
  listQuotations(): Promise<ApiResult<Quotation[]>>
  createQuotation(payload: Omit<Quotation, 'id'>): Promise<ApiResult<Quotation>>
  convertQuotationToSalesOrder(quotationId: string): Promise<ApiResult<SalesOrder>>
  listSalesOrders(): Promise<ApiResult<SalesOrder[]>>
  getSalesOrder(id: string): Promise<ApiResult<SalesOrder>>
  createSalesOrder(payload: Omit<SalesOrder, 'id' | 'stage' | 'status' | 'deliveryStatus' | 'billingStatus'>): Promise<ApiResult<SalesOrder>>
  approveSalesOrder(id: string): Promise<ApiResult<SalesOrder>>
  rejectSalesOrder(id: string, reason?: string): Promise<ApiResult<void>>
  listItems(): Promise<ApiResult<{ itemCode: string; itemName: string; rate: number; stockAvailable: number; warehouse: string }[]>>
  createItem(payload: { itemCode: string; itemName?: string; rate?: number; isStockItem?: boolean; openingStock?: number; warehouse?: string }): Promise<ApiResult<{ itemCode: string; itemName: string; rate: number; stockAvailable: number; warehouse: string; isStockItem: boolean }>>
  createDelivery(salesOrderId: string): Promise<ApiResult<DeliveryNote>>
  listDeliveries(): Promise<ApiResult<DeliveryNote[]>>
  createInvoiceFromOrder(salesOrderId: string, updateStock?: boolean): Promise<ApiResult<SalesInvoice>>
  listSalesInvoices(): Promise<ApiResult<SalesInvoice[]>>
  getSalesInvoice(id: string): Promise<ApiResult<SalesInvoice>>
  listPayments(): Promise<ApiResult<Payment[]>>
  recordAdvancePayment(orderId: string, amount: number, mode?: string, referenceNo?: string): Promise<ApiResult<Payment>>
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
  leads: Lead[]
  opportunities: Opportunity[]
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
      if (raw) {
        const parsed = JSON.parse(raw)
        if (!parsed.leads) parsed.leads = []
        if (!parsed.opportunities) parsed.opportunities = []
        return parsed
      }
    } catch {
      // fallback
    }
  }
  return {
    leads: [],
    opportunities: [],
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

  private get leads() { return this.state.leads }
  private get opportunities() { return this.state.opportunities }
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

  async listLeads(query?: string): Promise<ApiResult<Lead[]>> {
    await this.delay()
    if (!query) return { ok: true, data: [...this.leads] }
    const q = query.toLowerCase()
    return {
      ok: true,
      data: this.leads.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.companyName.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q)
      ),
    }
  }

  async getLead(id: string): Promise<ApiResult<Lead>> {
    await this.delay()
    const found = this.leads.find((l) => l.id === id)
    if (!found) return { ok: false, error: `Lead ${id} not found.` }
    return { ok: true, data: { ...found } }
  }

  async createLead(payload: { name: string; companyName?: string; email?: string; phone?: string; source?: string }): Promise<ApiResult<Lead>> {
    await this.delay()
    const lead: Lead = {
      id: `LEAD-2026-${String(this.leads.length + 1).padStart(4, '0')}`,
      name: payload.name,
      companyName: payload.companyName || payload.name,
      email: payload.email || '',
      phone: payload.phone || '',
      source: payload.source || 'Direct Contact',
      status: 'Open',
      owner: 'Sales Rep',
      createdDate: new Date().toISOString().split('T')[0],
    }
    this.leads.unshift(lead)
    this.saveState()
    return { ok: true, data: lead }
  }

  async convertLeadToCustomer(leadId: string): Promise<ApiResult<Customer>> {
    await this.delay()
    const lead = this.leads.find((l) => l.id === leadId)
    if (!lead) return { ok: false, error: `Lead ${leadId} not found.` }

    const customer: Customer = {
      id: `CUST-2026-${String(this.customers.length + 1).padStart(4, '0')}`,
      name: lead.companyName || lead.name,
      email: lead.email,
      phone: lead.phone,
      territory: 'All Territories',
      group: 'Commercial',
      status: 'Active',
      amountOwed: 0,
      assignedTo: 'Sales Rep',
      createdDate: new Date().toISOString().split('T')[0],
    }
    this.customers.unshift(customer)
    lead.status = 'Converted'
    lead.customer = customer.id
    this.saveState()
    return { ok: true, data: customer }
  }

  async convertLeadToOpportunity(leadId: string): Promise<ApiResult<Opportunity>> {
    await this.delay()
    const lead = this.leads.find((l) => l.id === leadId)
    if (!lead) return { ok: false, error: `Lead ${leadId} not found.` }

    const opp: Opportunity = {
      id: `OPP-2026-${String(this.opportunities.length + 1).padStart(4, '0')}`,
      partyName: lead.companyName || lead.name,
      partyType: 'Lead',
      expectedValue: 5000,
      stage: 'Open',
      expectedCloseDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      owner: 'Sales Rep',
      createdDate: new Date().toISOString().split('T')[0],
    }
    this.opportunities.unshift(opp)
    lead.status = 'Replied'
    this.saveState()
    return { ok: true, data: opp }
  }

  async convertLeadToQuotation(leadId: string): Promise<ApiResult<Quotation>> {
    await this.delay()
    const lead = this.leads.find((l) => l.id === leadId)
    if (!lead) return { ok: false, error: `Lead ${leadId} not found.` }

    const qtn: Quotation = {
      id: `QTN-2026-${String(this.quotations.length + 1).padStart(4, '0')}`,
      customerName: lead.companyName || lead.name,
      customerId: lead.id,
      date: new Date().toISOString().split('T')[0],
      validTill: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items: [],
      subtotal: 0,
      taxAmount: 0,
      grandTotal: 0,
      status: 'Draft',
      createdBy: 'Sales Rep',
    }
    this.quotations.unshift(qtn)
    this.saveState()
    return { ok: true, data: qtn }
  }

  async listOpportunities(query?: string): Promise<ApiResult<Opportunity[]>> {
    await this.delay()
    if (!query) return { ok: true, data: [...this.opportunities] }
    const q = query.toLowerCase()
    return {
      ok: true,
      data: this.opportunities.filter((o) => o.partyName.toLowerCase().includes(q)),
    }
  }

  async getOpportunity(id: string): Promise<ApiResult<Opportunity>> {
    await this.delay()
    const found = this.opportunities.find((o) => o.id === id)
    if (!found) return { ok: false, error: `Opportunity ${id} not found.` }
    return { ok: true, data: { ...found } }
  }

  async createOpportunity(payload: { partyName: string; partyType?: 'Lead' | 'Customer'; expectedValue?: number; expectedCloseDate?: string }): Promise<ApiResult<Opportunity>> {
    await this.delay()
    const opp: Opportunity = {
      id: `OPP-2026-${String(this.opportunities.length + 1).padStart(4, '0')}`,
      partyName: payload.partyName,
      partyType: payload.partyType || 'Lead',
      expectedValue: payload.expectedValue || 0,
      stage: 'Open',
      expectedCloseDate: payload.expectedCloseDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      owner: 'Sales Rep',
      createdDate: new Date().toISOString().split('T')[0],
    }
    this.opportunities.unshift(opp)
    this.saveState()
    return { ok: true, data: opp }
  }

  async convertOpportunityToQuotation(opportunityId: string): Promise<ApiResult<Quotation>> {
    await this.delay()
    const opp = this.opportunities.find((o) => o.id === opportunityId)
    if (!opp) return { ok: false, error: `Opportunity ${opportunityId} not found.` }

    const qtn: Quotation = {
      id: `QTN-2026-${String(this.quotations.length + 1).padStart(4, '0')}`,
      customerName: opp.partyName,
      customerId: opp.partyName,
      date: new Date().toISOString().split('T')[0],
      validTill: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items: [],
      subtotal: opp.expectedValue || 0,
      taxAmount: 0,
      grandTotal: opp.expectedValue || 0,
      status: 'Draft',
      createdBy: 'Sales Rep',
    }
    this.quotations.unshift(qtn)
    opp.stage = 'Quotation'
    opp.quotationId = qtn.id
    this.saveState()
    return { ok: true, data: qtn }
  }

  async markOpportunityLost(opportunityId: string, reason = 'Lost'): Promise<ApiResult<Opportunity>> {
    await this.delay()
    const opp = this.opportunities.find((o) => o.id === opportunityId)
    if (!opp) return { ok: false, error: `Opportunity ${opportunityId} not found.` }
    opp.stage = 'Lost'
    this.saveState()
    return { ok: true, data: opp }
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

  async convertQuotationToSalesOrder(quotationId: string): Promise<ApiResult<SalesOrder>> {
    await this.delay()
    const quote = this.quotations.find((q) => q.id === quotationId)
    if (!quote) return { ok: false, error: `Quotation ${quotationId} not found.` }
    quote.status = 'Ordered'
    const newOrder: SalesOrder = {
      id: `SO-2026-${String(this.orders.length + 105).padStart(4, '0')}`,
      customerName: quote.customerName,
      customerId: quote.customerId,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      items: [...quote.items],
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      grandTotal: quote.grandTotal,
      stage: 'Sales Order',
      status: 'Draft',
      deliveryStatus: 'Not Delivered',
      billingStatus: 'Not Billed',
      quotationId: quote.id,
      assignedTo: quote.createdBy,
    }
    this.orders.unshift(newOrder)
    this.saveState()
    return { ok: true, data: newOrder }
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

  async approveSalesOrder(id: string): Promise<ApiResult<SalesOrder>> {
    await this.delay()
    const order = this.orders.find((o) => o.id === id)
    if (!order) return { ok: false, error: `Order ${id} not found.` }
    order.status = 'To Deliver and Bill'
    this.saveState()
    return { ok: true, data: order }
  }

  async rejectSalesOrder(id: string, reason = 'Rejected by manager'): Promise<ApiResult<void>> {
    await this.delay()
    const idx = this.orders.findIndex((o) => o.id === id)
    if (idx !== -1) {
      this.orders[idx].status = 'Cancelled'
      this.saveState()
    }
    return { ok: true }
  }

  async createSalesOrder(
    payload: Omit<SalesOrder, 'id' | 'stage' | 'status' | 'deliveryStatus' | 'billingStatus'>
  ): Promise<ApiResult<SalesOrder>> {
    await this.delay()
    const newOrder: SalesOrder = {
      ...payload,
      id: `SO-2026-${String(this.orders.length + 105).padStart(4, '0')}`,
      stage: 'Sales Order',
      status: 'Draft',
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

  async createItem(payload: { itemCode: string; itemName?: string; rate?: number; isStockItem?: boolean; openingStock?: number; warehouse?: string }): Promise<ApiResult<{ itemCode: string; itemName: string; rate: number; stockAvailable: number; warehouse: string; isStockItem: boolean }>> {
    await this.delay()
    return {
      ok: true,
      data: {
        itemCode: payload.itemCode,
        itemName: payload.itemName || payload.itemCode,
        rate: payload.rate || 0,
        isStockItem: payload.isStockItem !== false,
        stockAvailable: payload.openingStock || 0,
        warehouse: payload.warehouse || 'Stores',
      },
    }
  }

  async recordAdvancePayment(orderId: string, amount: number, mode = 'Bank Transfer', referenceNo?: string): Promise<ApiResult<Payment>> {
    await this.delay()
    const order = this.orders.find((o) => o.id === orderId)
    if (!order) return { ok: false, error: `Order ${orderId} not found.` }
    const pay: Payment = {
      id: `PAY-2026-${String(this.payments.length + 301).padStart(4, '0')}`,
      salesOrderId: orderId,
      customerName: order.customerName,
      amount,
      date: new Date().toISOString().split('T')[0],
      postingDate: new Date().toISOString().split('T')[0],
      modeOfPayment: mode as any,
      mode: mode as any,
      referenceNo: referenceNo || `ADV-${Date.now()}`,
      reconciled: true,
      receivedBy: 'Accountant',
    }
    this.payments.unshift(pay)
    order.advancePaymentId = pay.id
    order.advancePaid = (order.advancePaid || 0) + amount
    this.saveState()
    return { ok: true, data: pay }
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

  async listPayments(): Promise<ApiResult<Payment[]>> {
    await this.delay()
    return { ok: true, data: [...this.payments] }
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
    const openLeads = this.leads.filter((l) => l.status === 'Open' || l.status === 'Replied')
    const openOpps = this.opportunities.filter((o) => (o.stage === 'Open' || o.status === 'Open'))
    const quotesWaiting = this.quotations.filter((q) => q.status === 'Draft' || q.status === 'Submitted')

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
      openLeadsCount: openLeads.length,
      openOpportunitiesCount: openOpps.length,
      quotationsWaitingCount: quotesWaiting.length,
      pipelineCounts: {
        leads: openLeads.length,
        opportunities: openOpps.length,
        quotations: this.quotations.length,
        quotationsWaiting: quotesWaiting.length,
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
  async listLeads(query?: string): Promise<ApiResult<Lead[]>> {
    const res = await frappeFetch<any[]>('/api/method/adadiko_hub.api.list_leads')
    if (!res.ok || !res.data) return { ok: true, data: [] }
    let list = res.data
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(
        (l: any) =>
          (l.name && l.name.toLowerCase().includes(q)) ||
          (l.companyName && l.companyName.toLowerCase().includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.phone && l.phone.toLowerCase().includes(q))
      )
    }
    return { ok: true, data: list }
  }

  async getLead(id: string): Promise<ApiResult<Lead>> {
    const res = await frappeFetch<any>(`/api/resource/Lead/${encodeURIComponent(id)}`)
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    const l = res.data
    return {
      ok: true,
      data: {
        id: l.name,
        name: l.lead_name || l.name,
        companyName: l.company_name || '',
        email: l.email_id || '',
        phone: l.mobile_no || l.phone || '',
        source: l.source || 'Direct',
        status: l.status || 'Open',
        customer: l.customer || '',
        owner: l.owner || '',
        createdDate: String(l.creation || '').slice(0, 10),
      },
    }
  }

  async createLead(payload: { name: string; companyName?: string; email?: string; phone?: string; source?: string }): Promise<ApiResult<Lead>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.create_lead', {
      method: 'POST',
      body: JSON.stringify({
        lead_name: payload.name,
        company_name: payload.companyName,
        email: payload.email,
        phone: payload.phone,
        source: payload.source,
      }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: res.data }
  }

  async convertLeadToCustomer(leadId: string): Promise<ApiResult<Customer>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.convert_lead_to_customer', {
      method: 'POST',
      body: JSON.stringify({ lead_id: leadId }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: res.data }
  }

  async convertLeadToOpportunity(leadId: string): Promise<ApiResult<Opportunity>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.convert_lead_to_opportunity', {
      method: 'POST',
      body: JSON.stringify({ lead_id: leadId }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: res.data }
  }

  async convertLeadToQuotation(leadId: string): Promise<ApiResult<Quotation>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.convert_lead_to_quotation', {
      method: 'POST',
      body: JSON.stringify({ lead_id: leadId }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return {
      ok: true,
      data: {
        id: `QTN-LEAD-${leadId}`,
        customerName: leadId,
        customerId: leadId,
        date: new Date().toISOString().split('T')[0],
        validTill: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        items: [],
        subtotal: 0,
        taxAmount: 0,
        grandTotal: 0,
        status: 'Draft',
        createdBy: 'Sales Rep',
      },
    }
  }

  async listOpportunities(query?: string): Promise<ApiResult<Opportunity[]>> {
    const res = await frappeFetch<any[]>('/api/method/adadiko_hub.api.list_opportunities')
    if (!res.ok || !res.data) return { ok: true, data: [] }
    let list = res.data
    if (query) {
      const q = query.toLowerCase()
      list = list.filter((o: any) => o.partyName && o.partyName.toLowerCase().includes(q))
    }
    return { ok: true, data: list }
  }

  async getOpportunity(id: string): Promise<ApiResult<Opportunity>> {
    const res = await frappeFetch<any>(`/api/resource/Opportunity/${encodeURIComponent(id)}`)
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    const o = res.data
    return {
      ok: true,
      data: {
        id: o.name,
        partyName: o.party_name || o.name,
        partyType: o.opportunity_from || 'Lead',
        expectedValue: Number(o.opportunity_amount || 0),
        stage: o.status || 'Open',
        expectedCloseDate: String(o.expected_closing || '').slice(0, 10),
        owner: o.owner || '',
        createdDate: String(o.creation || '').slice(0, 10),
      },
    }
  }

  async createOpportunity(payload: { partyName: string; partyType?: 'Lead' | 'Customer'; expectedValue?: number; expectedCloseDate?: string }): Promise<ApiResult<Opportunity>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.create_opportunity', {
      method: 'POST',
      body: JSON.stringify({
        party_name: payload.partyName,
        party_type: payload.partyType || 'Lead',
        expected_value: payload.expectedValue || 0,
        expected_close_date: payload.expectedCloseDate,
      }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: res.data }
  }

  async convertOpportunityToQuotation(opportunityId: string): Promise<ApiResult<Quotation>> {
    const res = await frappeFetch<any>('/api/method/erpnext.crm.doctype.opportunity.opportunity.make_quotation', {
      method: 'POST',
      body: JSON.stringify({ source_name: opportunityId }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return {
      ok: true,
      data: {
        id: res.data.name || `QTN-OPP-${opportunityId}`,
        customerName: res.data.party_name || opportunityId,
        customerId: res.data.party_name || opportunityId,
        date: res.data.transaction_date || new Date().toISOString().split('T')[0],
        validTill: res.data.valid_till || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        items: [],
        subtotal: Number(res.data.net_total || 0),
        taxAmount: Number(res.data.total_taxes_and_charges || 0),
        grandTotal: Number(res.data.grand_total || 0),
        status: 'Draft',
        createdBy: res.data.owner || 'Sales Rep',
      },
    }
  }

  async markOpportunityLost(opportunityId: string, reason = 'Lost'): Promise<ApiResult<Opportunity>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.mark_opportunity_lost', {
      method: 'POST',
      body: JSON.stringify({ opportunity_id: opportunityId, reason }),
    })
    if (!res.ok) return { ok: false, error: res.error }
    return {
      ok: true,
      data: {
        id: opportunityId,
        partyName: '',
        partyType: 'Lead',
        expectedValue: 0,
        stage: 'Lost',
        expectedCloseDate: '',
        owner: '',
        createdDate: '',
      },
    }
  }

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
        customer_type: payload.customerType || 'Company',
        address: payload.address,
      }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: mapCustomer(res.data.message || res.data) }
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
        party_name: payload.customerId || payload.customerName,
        party_type: payload.partyType || 'Customer',
        valid_till: payload.validTill,
        items: docItems,
        submit: payload.status === 'Submitted',
      }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: mapQuotation(res.data.message || res.data) }
  }

  async convertQuotationToSalesOrder(quotationId: string): Promise<ApiResult<SalesOrder>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.convert_quotation_to_sales_order', {
      method: 'POST',
      body: JSON.stringify({ quotation_id: quotationId }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: mapSalesOrder(res.data.message || res.data) }
  }

  async createItem(payload: { itemCode: string; itemName?: string; rate?: number; isStockItem?: boolean; openingStock?: number; warehouse?: string }): Promise<ApiResult<{ itemCode: string; itemName: string; rate: number; stockAvailable: number; warehouse: string; isStockItem: boolean }>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.create_item', {
      method: 'POST',
      body: JSON.stringify({
        item_code: payload.itemCode,
        item_name: payload.itemName,
        rate: payload.rate || 0,
        is_stock_item: payload.isStockItem !== false ? 1 : 0,
        opening_stock: payload.openingStock || 0,
        warehouse: payload.warehouse,
      }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: res.data.message || res.data }
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
      const raw = res.data.message || res.data
      const order = mapSalesOrder(raw)
      if (raw.invoice_id) order.invoiceId = raw.invoice_id
      if (raw.delivery_note_id) order.deliveryNoteId = raw.delivery_note_id
      if (raw.quotation_id) order.quotationId = raw.quotation_id
      if (raw.opportunity_id) order.opportunityId = raw.opportunity_id
      if (raw.lead_id) order.leadId = raw.lead_id
      if (raw.payment_id) order.paymentId = raw.payment_id
      if (raw.advance_payment_id) order.advancePaymentId = raw.advance_payment_id
      if (raw.advance_paid) order.advancePaid = raw.advance_paid
      if (raw.has_stock_items !== undefined) order.hasStockItems = raw.has_stock_items
      if (raw.all_non_stock !== undefined) order.allNonStock = raw.all_non_stock
      return { ok: true, data: order }
    }

    const fallbackRes = await frappeFetch<any>(`/api/resource/Sales%20Order/${encodeURIComponent(id)}`)
    if (!fallbackRes.ok || !fallbackRes.data) return { ok: false, error: fallbackRes.error }
    return { ok: true, data: mapSalesOrder(fallbackRes.data) }
  }

  async approveSalesOrder(id: string): Promise<ApiResult<SalesOrder>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.approve_sales_order', {
      method: 'POST',
      body: JSON.stringify({ order_id: id }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return this.getSalesOrder(id)
  }

  async rejectSalesOrder(id: string, reason = 'Rejected by manager'): Promise<ApiResult<void>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.reject_sales_order', {
      method: 'POST',
      body: JSON.stringify({ order_id: id, reason }),
    })
    if (!res.ok) return { ok: false, error: res.error }
    return { ok: true }
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
        quotation_id: payload.quotationId,
      }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: mapSalesOrder(res.data.message || res.data) }
  }

  async createDelivery(salesOrderId: string): Promise<ApiResult<DeliveryNote>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.create_delivery_from_order', {
      method: 'POST',
      body: JSON.stringify({ sales_order_id: salesOrderId }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: mapDeliveryNote(res.data.message || res.data) }
  }

  async createInvoiceFromOrder(salesOrderId: string, updateStock = false): Promise<ApiResult<SalesInvoice>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.create_invoice_from_order', {
      method: 'POST',
      body: JSON.stringify({ sales_order_id: salesOrderId, update_stock: updateStock ? 1 : 0 }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    return { ok: true, data: mapSalesInvoice(res.data.message || res.data) }
  }

  async recordAdvancePayment(orderId: string, amount: number, mode = 'Bank Transfer', referenceNo?: string): Promise<ApiResult<Payment>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.record_advance_payment_for_order', {
      method: 'POST',
      body: JSON.stringify({
        sales_order_id: orderId,
        amount,
        mode,
        reference_no: referenceNo,
      }),
    })
    if (!res.ok || !res.data) return { ok: false, error: res.error }
    const pe = res.data.message || res.data
    return {
      ok: true,
      data: {
        id: pe.name,
        salesOrderId: orderId,
        customerName: pe.party_name || pe.party || 'Customer',
        amount: Number(pe.paid_amount || amount),
        date: pe.posting_date || new Date().toISOString().split('T')[0],
        postingDate: pe.posting_date || new Date().toISOString().split('T')[0],
        modeOfPayment: (pe.mode_of_payment || mode) as any,
        mode: (pe.mode_of_payment || mode) as any,
        referenceNo: pe.reference_no || '',
        reconciled: true,
        receivedBy: pe.owner || 'Accountant',
      },
    }
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

  async listPayments(): Promise<ApiResult<Payment[]>> {
    const fields = encodeURIComponent(
      JSON.stringify([
        'name',
        'posting_date',
        'party_name',
        'party',
        'paid_amount',
        'mode_of_payment',
        'reference_no',
        'owner',
      ])
    )
    const res = await frappeFetch<any[]>(
      `/api/resource/Payment%20Entry?fields=${fields}&order_by=creation%20desc&limit_page_length=100`
    )
    if (!res.ok || !res.data) return { ok: true, data: [] }
    const payments: Payment[] = res.data.map((p) => ({
      id: p.name,
      invoiceId: '',
      customerName: p.party_name || p.party || 'Customer',
      amount: Number(p.paid_amount || 0),
      date: p.posting_date || '',
      modeOfPayment: (p.mode_of_payment as any) || 'Bank Transfer',
      referenceNo: p.reference_no || p.name,
      receivedBy: p.owner || 'Finance Desk',
    }))
    return { ok: true, data: payments }
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
      openLeadsCount: Number(res.data.open_leads_count ?? 0),
      openOpportunitiesCount: Number(res.data.open_opportunities_count ?? 0),
      quotationsWaitingCount: Number(res.data.quotations_waiting_count ?? 0),
      pipelineCounts: {
        leads: Number(res.data.pipeline_counts?.leads ?? 0),
        opportunities: Number(res.data.pipeline_counts?.opportunities ?? 0),
        quotations: Number(res.data.pipeline_counts?.quotations ?? 0),
        quotationsWaiting: Number(res.data.pipeline_counts?.quotations_waiting ?? 0),
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

