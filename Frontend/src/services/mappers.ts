/**
 * Adadiko Hub ERPNext DocType to Frontend Entity Mappers
 * Centralizes all field transformations between ERPNext v16 schema and Adadiko Hub types.
 */

import type {
  Customer,
  OrderItem,
  Quotation,
  SalesOrder,
  DeliveryNote,
  SalesInvoice,
  ApprovalRequest,
  OrderStage,
} from '@/types'

export function mapCustomer(doc: any): Customer {
  return {
    id: doc.name,
    name: doc.customer_name || doc.name,
    email: doc.email_id || '',
    phone: doc.mobile_no || '',
    territory: doc.territory || 'All Territories',
    group: doc.customer_group || 'Commercial',
    status: doc.disabled ? 'Inactive' : 'Active',
    amountOwed: Number(doc.outstanding_amount || 0),
    assignedTo: doc.owner || '',
    createdDate: (doc.creation || '').split(' ')[0] || new Date().toISOString().split('T')[0],
  }
}

export function mapOrderItem(row: any): OrderItem {
  const qty = Number(row.qty || 1)
  const rate = Number(row.rate || 0)
  const amount = Number(row.amount ?? (qty * rate))
  return {
    id: row.name || row.item_code,
    itemCode: row.item_code,
    itemName: row.item_name || row.item_code,
    qty,
    rate,
    amount,
    stockAvailable: Number(row.actual_qty ?? row.stock_qty ?? 100),
    warehouse: row.warehouse || 'Stores - AHD',
  }
}

export function mapQuotation(doc: any): Quotation {
  let status: Quotation['status'] = 'Submitted'
  if (doc.docstatus === 0) status = 'Draft'
  else if (doc.status === 'Ordered') status = 'Ordered'
  else if (doc.status === 'Lost' || doc.status === 'Cancelled') status = 'Rejected'
  else if (doc.status === 'Expired') status = 'Expired'

  return {
    id: doc.name,
    customerName: doc.customer_name || doc.party_name || 'Customer',
    customerId: doc.party_name || '',
    date: doc.transaction_date || (doc.creation || '').split(' ')[0],
    validTill: doc.valid_till || '',
    items: Array.isArray(doc.items) ? doc.items.map(mapOrderItem) : [],
    subtotal: Number(doc.net_total ?? doc.total ?? 0),
    taxAmount: Number(doc.total_taxes_and_charges ?? 0),
    grandTotal: Number(doc.grand_total ?? 0),
    status,
    createdBy: doc.owner || 'System',
  }
}

export function mapSalesOrder(doc: any): SalesOrder {
  let stage: OrderStage = 'Sales Order'
  let deliveryStatus: SalesOrder['deliveryStatus'] = 'Not Delivered'
  let billingStatus: SalesOrder['billingStatus'] = 'Not Billed'

  if (doc.delivery_status === 'Fully Delivered') {
    deliveryStatus = 'Fully Delivered'
  } else if (doc.delivery_status === 'Partially Delivered') {
    deliveryStatus = 'Partially Delivered'
  }

  if (doc.billing_status === 'Fully Billed' || doc.status === 'Completed') {
    billingStatus = 'Fully Billed'
  } else if (doc.billing_status === 'Partially Billed') {
    billingStatus = 'Partially Billed'
  } else if (doc.billing_status === 'Paid') {
    billingStatus = 'Paid'
  }

  if (doc.docstatus === 0) {
    stage = 'Sales Order'
  } else if (doc.status === 'Completed' || billingStatus === 'Paid') {
    stage = 'Payment'
  } else if (billingStatus === 'Fully Billed' || billingStatus === 'Partially Billed') {
    stage = 'Payment'
  } else if (deliveryStatus === 'Fully Delivered') {
    stage = 'Invoice'
  } else {
    stage = 'Delivery'
  }

  let status: SalesOrder['status'] = doc.status || 'To Deliver and Bill'
  if (doc.docstatus === 0) {
    status = 'Draft'
  } else if (doc.docstatus === 2) {
    status = 'Cancelled'
  }

  return {
    id: doc.name,
    customerName: doc.customer_name || doc.customer || 'Customer',
    customerId: doc.customer || '',
    orderDate: doc.transaction_date || (doc.creation || '').split(' ')[0],
    deliveryDate: doc.delivery_date || '',
    items: Array.isArray(doc.items) ? doc.items.map(mapOrderItem) : [],
    subtotal: Number(doc.net_total ?? doc.total ?? 0),
    taxAmount: Number(doc.total_taxes_and_charges ?? 0),
    grandTotal: Number(doc.grand_total ?? 0),
    status,
    stage,
    deliveryStatus,
    billingStatus,
    assignedTo: doc.owner || '',
  }
}

export function mapDeliveryNote(doc: any): DeliveryNote {
  return {
    id: doc.name,
    salesOrderId: doc.against_sales_order || '',
    customerName: doc.customer_name || doc.customer || 'Customer',
    postingDate: doc.posting_date || (doc.creation || '').split(' ')[0],
    items: Array.isArray(doc.items) ? doc.items.map(mapOrderItem) : [],
    status: doc.docstatus === 1 ? 'Delivered' : 'Draft',
    preparedBy: doc.owner || 'Storekeeper',
  }
}

export function mapSalesInvoice(doc: any): SalesInvoice {
  const grandTotal = Number(doc.grand_total ?? 0)
  const outstandingAmount = Number(doc.outstanding_amount ?? grandTotal)
  const amountPaid = Math.max(0, grandTotal - outstandingAmount)

  let status: SalesInvoice['status'] = 'Unpaid'
  if (doc.docstatus === 1) {
    if (outstandingAmount <= 0) {
      status = 'Paid'
    } else if (doc.status === 'Overdue') {
      status = 'Overdue'
    } else if (amountPaid > 0) {
      status = 'Partially Paid'
    }
  }

  return {
    id: doc.name,
    salesOrderId: doc.against_sales_order || '',
    customerName: doc.customer_name || doc.customer || 'Customer',
    customerId: doc.customer || '',
    postingDate: doc.posting_date || (doc.creation || '').split(' ')[0],
    dueDate: doc.due_date || doc.posting_date || '',
    items: Array.isArray(doc.items) ? doc.items.map(mapOrderItem) : [],
    grandTotal,
    amountPaid,
    outstandingAmount,
    status,
  }
}

export function mapApprovalRequest(doc: any): ApprovalRequest {
  return {
    id: doc.name || doc.id,
    documentType: 'Sales Order',
    documentId: doc.name || doc.documentId,
    customerName: doc.customer_name || doc.customerName || 'Customer',
    amount: Number(doc.grand_total || doc.amount || 0),
    requestedBy: doc.owner || doc.requestedBy || 'Sales Rep',
    requestDate: doc.requestDate || (doc.creation || '').split(' ')[0] || new Date().toISOString().split('T')[0],
    reason: doc.reason || 'New Order Pending Approval',
    status: 'Pending',
  }
}
