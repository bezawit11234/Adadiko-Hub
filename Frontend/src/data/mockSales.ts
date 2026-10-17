/**
 * Mock Data for Adadiko Hub Sales Service
 * Kept strictly inside the data/ layer. Never imported directly by UI screens.
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

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Blue Nile Trading PLC',
    email: 'procurement@bluenile.example',
    phone: '+251 91 123 4567',
    territory: 'East Africa / Addis Ababa',
    group: 'Commercial Distributor',
    status: 'Active',
    amountOwed: 14200.0,
    assignedTo: 'usr_rep_1', // Tariq Mensah
    address: 'Bole Subcity, House 412, Addis Ababa',
    notes: 'Key distributor for regional supermarket chain. Preferred net-30 terms.',
    createdDate: '2026-01-10',
  },
  {
    id: 'CUST-002',
    name: 'Kibo Logistics & Supplies',
    email: 'dispatch@kibo-logistics.example',
    phone: '+254 70 891 2345',
    territory: 'Kenya / Nairobi Industrial Area',
    group: 'Logistics Partner',
    status: 'Active',
    amountOwed: 0.0,
    assignedTo: 'usr_rep_1', // Tariq Mensah
    address: 'Enterprise Road, Plot 18, Nairobi',
    notes: 'Always pays immediately via bank wire transfer upon invoice receipt.',
    createdDate: '2026-01-22',
  },
  {
    id: 'CUST-003',
    name: 'Sahara Grocers Cooperative',
    email: 'orders@saharagrocers.example',
    phone: '+234 80 555 1212',
    territory: 'West Africa / Lagos',
    group: 'Retail Cooperative',
    status: 'Active',
    amountOwed: 8450.5,
    assignedTo: 'usr_rep_1', // Tariq Mensah
    address: 'Victoria Island, Block 4, Lagos',
    notes: 'Follow up requested for upcoming festive quarter procurement.',
    createdDate: '2026-02-05',
  },
  {
    id: 'CUST-004',
    name: 'Horizon Smart Solar Ltd',
    email: 'engineering@horizon-solar.example',
    phone: '+250 78 834 9911',
    territory: 'Rwanda / Kigali Innovation Hub',
    group: 'Renewable Energy',
    status: 'Active',
    amountOwed: 21500.0,
    assignedTo: 'usr_mgr_1', // Managed by Sarah Chen
    address: 'Kacyiru KG 7 Ave, Kigali',
    notes: 'High-volume buyer of solar battery units. Requires delivery note signatures.',
    createdDate: '2026-02-18',
  },
  {
    id: 'CUST-005',
    name: 'Atlas Industrial Workshop',
    email: 'info@atlas-workshop.example',
    phone: '+212 52 233 4455',
    territory: 'North Africa / Casablanca',
    group: 'Manufacturing',
    status: 'Prospect',
    amountOwed: 0.0,
    assignedTo: 'usr_rep_1',
    address: 'Ain Sebaa Industrial Park, Casablanca',
    notes: 'Sent initial quotation for electric motor assemblies.',
    createdDate: '2026-03-01',
  },
]

export const MOCK_CATALOG_ITEMS = [
  { itemCode: 'ITEM-SOLAR-5KWH', itemName: '5kWh Lithium Solar Storage Unit', rate: 1850.0, stockAvailable: 14, warehouse: 'Main Store' },
  { itemCode: 'ITEM-INV-3KW', itemName: 'Hybrid Solar Inverter 3.5kVA', rate: 620.0, stockAvailable: 3, warehouse: 'Main Store' }, // Stock warning test! Only 3 left
  { itemCode: 'ITEM-CABLE-4MM', itemName: 'Solar DC Double-Sheath Cable (100m Roll)', rate: 125.0, stockAvailable: 85, warehouse: 'Main Store' },
  { itemCode: 'ITEM-RACK-6U', itemName: 'Reinforced Battery Cabinet 6U Enclosure', rate: 290.0, stockAvailable: 2, warehouse: 'Main Store' }, // Only 2 left
  { itemCode: 'ITEM-MONITOR-HUB', itemName: 'IoT Telemetry Gateway with 4G SIM', rate: 180.0, stockAvailable: 42, warehouse: 'Electronics Bay' },
]

export const MOCK_QUOTATIONS: Quotation[] = [
  {
    id: 'QTN-2026-0081',
    customerName: 'Atlas Industrial Workshop',
    customerId: 'CUST-005',
    date: '2026-03-12',
    validTill: '2026-04-12',
    items: [
      { id: 'qi-1', itemCode: 'ITEM-SOLAR-5KWH', itemName: '5kWh Lithium Solar Storage Unit', qty: 2, rate: 1850.0, amount: 3700.0, stockAvailable: 14 },
      { id: 'qi-2', itemCode: 'ITEM-INV-3KW', itemName: 'Hybrid Solar Inverter 3.5kVA', qty: 1, rate: 620.0, amount: 620.0, stockAvailable: 3 },
    ],
    subtotal: 4320.0,
    taxAmount: 648.0,
    grandTotal: 4968.0,
    status: 'Submitted',
    createdBy: 'usr_rep_1',
  },
  {
    id: 'QTN-2026-0078',
    customerName: 'Blue Nile Trading PLC',
    customerId: 'CUST-001',
    date: '2026-03-08',
    validTill: '2026-03-28',
    items: [
      { id: 'qi-3', itemCode: 'ITEM-CABLE-4MM', itemName: 'Solar DC Double-Sheath Cable (100m Roll)', qty: 10, rate: 125.0, amount: 1250.0, stockAvailable: 85 },
      { id: 'qi-4', itemCode: 'ITEM-MONITOR-HUB', itemName: 'IoT Telemetry Gateway with 4G SIM', qty: 5, rate: 180.0, amount: 900.0, stockAvailable: 42 },
    ],
    subtotal: 2150.0,
    taxAmount: 322.5,
    grandTotal: 2472.5,
    status: 'Ordered',
    createdBy: 'usr_rep_1',
  },
]

export const MOCK_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'SO-2026-0104',
    customerName: 'Blue Nile Trading PLC',
    customerId: 'CUST-001',
    orderDate: '2026-03-10',
    deliveryDate: '2026-03-18',
    items: [
      { id: 'soi-1', itemCode: 'ITEM-SOLAR-5KWH', itemName: '5kWh Lithium Solar Storage Unit', qty: 4, rate: 1850.0, amount: 7400.0, stockAvailable: 14 },
      { id: 'soi-2', itemCode: 'ITEM-INV-3KW', itemName: 'Hybrid Solar Inverter 3.5kVA', qty: 2, rate: 620.0, amount: 1240.0, stockAvailable: 3 },
    ],
    subtotal: 8640.0,
    taxAmount: 1296.0,
    grandTotal: 9936.0,
    status: 'To Deliver',
    stage: 'Delivery', // Next step: Create delivery
    deliveryStatus: 'Not Delivered',
    billingStatus: 'Not Billed',
    assignedTo: 'usr_rep_1',
    quotationId: 'QTN-2026-0078',
    notes: 'Delivery requested at Central Rail Freight Terminal gate 4.',
  },
  {
    id: 'SO-2026-0102',
    customerName: 'Horizon Smart Solar Ltd',
    customerId: 'CUST-004',
    orderDate: '2026-03-02',
    deliveryDate: '2026-03-06',
    items: [
      { id: 'soi-3', itemCode: 'ITEM-SOLAR-5KWH', itemName: '5kWh Lithium Solar Storage Unit', qty: 10, rate: 1800.0, amount: 18000.0, stockAvailable: 14 },
    ],
    subtotal: 18000.0,
    taxAmount: 2700.0,
    grandTotal: 20700.0,
    status: 'To Bill',
    stage: 'Invoice', // Next step: Create invoice
    deliveryStatus: 'Fully Delivered',
    billingStatus: 'Not Billed',
    deliveryNoteId: 'DN-2026-0052',
    assignedTo: 'usr_mgr_1',
    notes: 'Shipped via TransEast Express. Customer signed receipt.',
  },
  {
    id: 'SO-2026-0098',
    customerName: 'Sahara Grocers Cooperative',
    customerId: 'CUST-003',
    orderDate: '2026-02-24',
    deliveryDate: '2026-03-01',
    items: [
      { id: 'soi-4', itemCode: 'ITEM-MONITOR-HUB', itemName: 'IoT Telemetry Gateway with 4G SIM', qty: 12, rate: 180.0, amount: 2160.0, stockAvailable: 42 },
      { id: 'soi-5', itemCode: 'ITEM-CABLE-4MM', itemName: 'Solar DC Double-Sheath Cable (100m Roll)', qty: 8, rate: 125.0, amount: 1000.0, stockAvailable: 85 },
    ],
    subtotal: 3160.0,
    taxAmount: 474.0,
    grandTotal: 3634.0,
    status: 'Completed',
    stage: 'Payment', // Payment received
    deliveryStatus: 'Fully Delivered',
    billingStatus: 'Paid',
    deliveryNoteId: 'DN-2026-0049',
    invoiceId: 'SINV-2026-0041',
    assignedTo: 'usr_rep_1',
    notes: 'Completed transaction.',
  },
]

export const MOCK_DELIVERIES: DeliveryNote[] = [
  {
    id: 'DN-2026-0052',
    salesOrderId: 'SO-2026-0102',
    customerName: 'Horizon Smart Solar Ltd',
    postingDate: '2026-03-05',
    items: [
      { id: 'dni-1', itemCode: 'ITEM-SOLAR-5KWH', itemName: '5kWh Lithium Solar Storage Unit', qty: 10, rate: 1800.0, amount: 18000.0, stockAvailable: 14 },
    ],
    status: 'Delivered',
    carrier: 'TransEast Express Freight',
    trackingNo: 'TR-881920-RW',
    preparedBy: 'usr_stk_1',
  },
  {
    id: 'DN-2026-0049',
    salesOrderId: 'SO-2026-0098',
    customerName: 'Sahara Grocers Cooperative',
    postingDate: '2026-02-28',
    items: [
      { id: 'dni-2', itemCode: 'ITEM-MONITOR-HUB', itemName: 'IoT Telemetry Gateway with 4G SIM', qty: 12, rate: 180.0, amount: 2160.0, stockAvailable: 42 },
      { id: 'dni-3', itemCode: 'ITEM-CABLE-4MM', itemName: 'Solar DC Double-Sheath Cable (100m Roll)', qty: 8, rate: 125.0, amount: 1000.0, stockAvailable: 85 },
    ],
    status: 'Delivered',
    carrier: 'DHL Logistics West',
    trackingNo: 'DHL-992140',
    preparedBy: 'usr_stk_1',
  },
]

export const MOCK_INVOICES: SalesInvoice[] = [
  {
    id: 'SINV-2026-0044',
    salesOrderId: 'SO-2026-0104',
    customerName: 'Blue Nile Trading PLC',
    customerId: 'CUST-001',
    postingDate: '2026-03-11',
    dueDate: '2026-04-10',
    items: [
      { id: 'sii-1', itemCode: 'ITEM-SOLAR-5KWH', itemName: '5kWh Lithium Solar Storage Unit', qty: 4, rate: 1850.0, amount: 7400.0, stockAvailable: 14 },
      { id: 'sii-2', itemCode: 'ITEM-INV-3KW', itemName: 'Hybrid Solar Inverter 3.5kVA', qty: 2, rate: 620.0, amount: 1240.0, stockAvailable: 3 },
    ],
    grandTotal: 9936.0,
    amountPaid: 0.0,
    outstandingAmount: 9936.0, // "Customer owes"
    status: 'Unpaid',
  },
  {
    id: 'SINV-2026-0038',
    salesOrderId: 'SO-2026-0089',
    customerName: 'Sahara Grocers Cooperative',
    customerId: 'CUST-003',
    postingDate: '2026-02-14',
    dueDate: '2026-03-01',
    items: [
      { id: 'sii-3', itemCode: 'ITEM-RACK-6U', itemName: 'Reinforced Battery Cabinet 6U Enclosure', qty: 2, rate: 290.0, amount: 580.0, stockAvailable: 2 },
    ],
    grandTotal: 667.0,
    amountPaid: 0.0,
    outstandingAmount: 667.0,
    status: 'Overdue',
  },
  {
    id: 'SINV-2026-0041',
    salesOrderId: 'SO-2026-0098',
    customerName: 'Sahara Grocers Cooperative',
    customerId: 'CUST-003',
    postingDate: '2026-03-01',
    dueDate: '2026-03-31',
    items: [
      { id: 'sii-4', itemCode: 'ITEM-MONITOR-HUB', itemName: 'IoT Telemetry Gateway with 4G SIM', qty: 12, rate: 180.0, amount: 2160.0, stockAvailable: 42 },
    ],
    grandTotal: 3634.0,
    amountPaid: 3634.0,
    outstandingAmount: 0.0,
    status: 'Paid',
  },
]

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'PAY-2026-0021',
    invoiceId: 'SINV-2026-0041',
    customerName: 'Sahara Grocers Cooperative',
    amount: 3634.0,
    date: '2026-03-04',
    modeOfPayment: 'Bank Transfer',
    referenceNo: 'GTB-FT-991204',
    receivedBy: 'usr_acc_1',
    notes: 'Direct electronic wire receipt confirmed on Stanbic bank feed.',
  },
]

export const MOCK_APPROVALS: ApprovalRequest[] = [
  {
    id: 'APP-012',
    documentType: 'Sales Order',
    documentId: 'SO-2026-0104',
    customerName: 'Blue Nile Trading PLC',
    amount: 9936.0,
    requestedBy: 'Tariq Mensah (Sales Rep)',
    requestDate: '2026-03-10',
    reason: 'Customer requested 5% special volume allowance and Net-30 payment term extension.',
    status: 'Pending',
  },
  {
    id: 'APP-011',
    documentType: 'Discount',
    documentId: 'QTN-2026-0081',
    customerName: 'Atlas Industrial Workshop',
    amount: 4968.0,
    requestedBy: 'Tariq Mensah (Sales Rep)',
    requestDate: '2026-03-12',
    reason: 'New territory customer intro rebate waiver.',
    status: 'Pending',
  },
]

export const MOCK_SALES_SUMMARY: SalesSummary = {
  salesToday: 4968.0,
  salesThisMonth: 58450.0,
  salesMonthTarget: 75000.0,
  openOrdersCount: 4,
  openOrdersValue: 34270.0,
  unpaidInvoicesCount: 6,
  unpaidInvoicesTotal: 24787.5,
  pipelineCounts: {
    quotations: 8,
    orders: 4,
    delivered: 7,
    invoiced: 6,
    paid: 19,
  },
  recentOrdersOverTime: [
    { date: 'Mon', amount: 3200, count: 2 },
    { date: 'Tue', amount: 8400, count: 3 },
    { date: 'Wed', amount: 5600, count: 2 },
    { date: 'Thu', amount: 14200, count: 5 },
    { date: 'Fri', amount: 9800, count: 4 },
    { date: 'Sat', amount: 4100, count: 1 },
    { date: 'Sun', amount: 6200, count: 2 },
  ],
  teamPerformance: [
    { repId: 'usr_rep_1', repName: 'Tariq Mensah', ordersClosed: 14, revenue: 32400.0, targetRevenue: 35000.0, targetPct: 92.5 },
    { repId: 'usr_mgr_1', repName: 'Sarah Chen', ordersClosed: 9, revenue: 26050.0, targetRevenue: 25000.0, targetPct: 104.2 },
    { repId: 'usr_rep_2', repName: 'Zainab Touré', ordersClosed: 8, revenue: 19800.0, targetRevenue: 22000.0, targetPct: 90.0 },
  ],
}
