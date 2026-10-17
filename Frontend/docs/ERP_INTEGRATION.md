# Adadiko Hub — Frappe & ERPNext v16 Integration Specification

This document maps all user interface screens in Adadiko Hub to their corresponding Frappe / ERPNext v16 DocTypes, whitelisted API endpoints, server-side authorization enforcement rules, and current mock adapter status.

---

## 1. Screen-to-API Integration Matrix

| Screen / Route | UI Service Method | ERPNext DocType | Frappe / ERPNext API Endpoint | Server Role & Plan Rules | Mock Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sales Rep Home**<br>`/app/sales` | `salesApi.listSalesOrders()`<br>`salesApi.listQuotations()`<br>`salesApi.listCustomers()` | `Sales Order`<br>`Quotation`<br>`Customer` | `GET /api/resource/Sales Order?filters=[["assigned_to","=",user]]`<br>`GET /api/resource/Quotation?filters=[["owner","=",user]]` | **Role**: `Sales User`<br>**Plan**: Must have `sales` in `company.subscribed_modules`<br>**Rule**: User Permission restricts records to current rep. | Mocked in memory with reactive mutations. |
| **Manager Dashboard**<br>`/app/sales/dashboard` | `salesApi.getSalesSummary()`<br>`salesApi.listApprovals()`<br>`salesApi.decideApproval(id, decision)` | `Sales Order`<br>`Workflow Action` | `GET /api/method/erpnext.selling.doctype.sales_order.sales_order.get_sales_analytics`<br>`GET /api/resource/Workflow Action`<br>`POST /api/method/frappe.model.workflow.apply_workflow` | **Role**: `Sales Manager`, `System Manager`<br>**Plan**: `sales` module active<br>**Rule**: Can view team aggregates and approve discount waivers. | Mocked with weekly SVG points and approval toggles. |
| **Customers Directory**<br>`/app/sales/customers` | `salesApi.listCustomers(query)`<br>`salesApi.createCustomer(data)` | `Customer` | `GET /api/resource/Customer?fields=["name","customer_name","email_id","mobile_no","territory","outstanding_amount"]`<br>`POST /api/resource/Customer` | **Role**: `Sales User`, `Sales Manager`, `Accounts User`<br>**Plan**: `sales`<br>**Rule**: Write permission requires active sales profile. | Mocked with balance calculation and customer creation. |
| **Customer Detail**<br>`/app/sales/customers/:id` | `salesApi.getCustomer(id)`<br>`salesApi.listSalesOrders()`<br>`salesApi.listSalesInvoices()` | `Customer`<br>`Sales Order`<br>`Sales Invoice` | `GET /api/resource/Customer/:id`<br>`GET /api/resource/Sales Order?filters=[["customer","=",id]]`<br>`GET /api/resource/Sales Invoice?filters=[["customer","=",id]]` | **Role**: `Sales User`, `Sales Manager`, `Accounts User`<br>**Plan**: `sales`<br>**Rule**: Read permission based on company. | Mocked with outstanding balance and history timeline. |
| **Quotations**<br>`/app/sales/quotations` | `salesApi.listQuotations()`<br>`salesApi.createSalesOrder(fromQuote)` | `Quotation`<br>`Sales Order` | `GET /api/resource/Quotation`<br>`POST /api/method/erpnext.selling.doctype.quotation.quotation.make_sales_order` | **Role**: `Sales User`, `Sales Manager`<br>**Plan**: `sales`<br>**Rule**: 1-click conversion validates pricing rules. | Mocked with instant order generation. |
| **Sales Orders List**<br>`/app/sales/orders` | `salesApi.listSalesOrders()` | `Sales Order` | `GET /api/resource/Sales Order?fields=["name","customer","transaction_date","delivery_date","status","delivery_status","billing_status","grand_total"]` | **Role**: `Sales User`, `Sales Manager`, `System Manager`<br>**Plan**: `sales`<br>**Rule**: Reps view own orders; managers view all. | Mocked with stage badges. |
| **Order Detail**<br>`/app/sales/orders/:id` | `salesApi.getSalesOrder(id)`<br>`salesApi.createDelivery(orderId)`<br>`salesApi.createInvoiceFromOrder(orderId)`<br>`salesApi.recordPayment(invId, ...)` | `Sales Order`<br>`Delivery Note`<br>`Sales Invoice`<br>`Payment Entry` | `GET /api/resource/Sales Order/:id`<br>`POST /api/method/erpnext.selling.doctype.sales_order.sales_order.make_delivery_note`<br>`POST /api/method/erpnext.selling.doctype.sales_order.sales_order.make_sales_invoice` | **Role**: All authenticated workspace roles (with step-specific enforcement)<br>**Plan**: `sales`<br>**Rule**: Storekeeper creates delivery; Accounts creates invoice. | Mocked with StepTracker & Next Step action. |
| **New Sales Order Form**<br>`/app/sales/orders/new` | `salesApi.createSalesOrder(payload)` | `Sales Order`<br>`Sales Order Item` | `POST /api/resource/Sales Order`<br>Payload includes child table `items` with item_code, qty, rate. | **Role**: `Sales User`, `Sales Manager`<br>**Plan**: `sales`<br>**Rule**: Server validates available stock in `warehouse="Main Store"`. | Mocked with stock warnings & live VAT totals. |
| **Deliveries (Storekeeper)**<br>`/app/sales/deliveries` | `salesApi.listDeliveries()`<br>`salesApi.createDelivery(orderId)` | `Delivery Note` | `GET /api/resource/Delivery Note`<br>`POST /api/method/erpnext.selling.doctype.sales_order.sales_order.make_delivery_note` | **Role**: `Stock User` (Storekeeper), `Sales Manager`<br>**Plan**: `sales` (or `inventory`)<br>**Rule**: Submits stock ledger entry reducing bin balance. | Mocked with storekeeper dispatch queue. |
| **Invoices & Receivables**<br>`/app/sales/invoices` | `salesApi.listSalesInvoices()`<br>`salesApi.recordPayment(...)` | `Sales Invoice`<br>`Payment Entry` | `GET /api/resource/Sales Invoice`<br>`POST /api/resource/Payment Entry` (payment_type="Receive") | **Role**: `Accounts User`, `Sales Manager`<br>**Plan**: `sales` (or `finance`)<br>**Rule**: Posts debit to Debtors and credit to Sales. | Mocked with Paid/Unpaid/Overdue badges & payment dialog. |
| **Invoice Detail**<br>`/app/sales/invoices/:id` | `salesApi.getSalesInvoice(id)`<br>`salesApi.recordPayment(...)` | `Sales Invoice` | `GET /api/resource/Sales Invoice/:id` | **Role**: `Accounts User`, `Sales Manager`<br>**Plan**: `sales`<br>**Rule**: Validates payment allocation against invoice. | Mocked with items breakdown and payment receipt. |
| **Team & Permissions**<br>`/app/users` | `authApi.register(...)` | `User`<br>`Has Role` | `GET /api/resource/User`<br>`POST /api/method/frappe.core.doctype.user.user.sign_up` | **Role**: `System Manager` (Company Admin)<br>**Plan**: Base workspace seat allowance<br>**Rule**: Restricts seat additions beyond plan allowance. | Mocked in memory with role matrix view. |
| **Workspace Plan**<br>`/app/plan` | `useSession().toggleSubscribedModule()` | `Company`<br>`Subscription` | `POST /api/method/adadiko.billing.update_subscribed_modules` | **Role**: `System Manager` (Company Admin)<br>**Plan**: Company subscription plan<br>**Rule**: Updates multi-tenant license flag on server. | Mocked with real reactivity & sidebar sync. |
| **Platform Back Office**<br>`/admin/*` | Multi-tenant audit logs & client registry | `Tenant`<br>`Installed App` | Custom Frappe Bench / SaaS management app methods | **Role**: `Adadiko Platform Operator`<br>**Rule**: Master platform operator authorization. | Mocked with telemetry and client registry. |

---

## 2. Server-Side Security & Access Enforcement Rules

1. **Frontend vs. Backend Roles:**
   - In the frontend UI, role checks and permission matrices govern visual visibility (hiding buttons, redirecting unauthorized routes to `/app/no-access`).
   - In production, **real enforcement MUST be performed on the Frappe server** using Frappe User Permissions and standard DocPerm rows on DocTypes (`Customer`, `Sales Order`, `Delivery Note`, `Sales Invoice`, `Payment Entry`).
2. **Multi-Tenant Data Isolation:**
   - Every Frappe database query must automatically scope by `Company` (e.g. `filters=[["company", "=", user_defaults.company]]`).
   - Cross-tenant data leakage is prevented at the database session level.
3. **Module Licensing Server Guard:**
   - Any API call attempting to read or write DocTypes associated with unbought modules (e.g., trying to POST to `Stock Entry` if `inventory` is not in `company.subscribed_modules`) will be rejected by a Frappe `before_insert` hook with an HTTP 403 `ModuleNotSubscribedError`.

---

## 3. What is Mocked vs. Production-Ready

- **Architecture:** The `SalesApi` interface and result envelope `{ ok, data?, error? }` are 100% production-ready.
- **Switching Mechanism:** Switching from `MockSalesApi` to `FrappeSalesApi` is governed by a single environment variable:
  ```env
  VITE_API_MODE=mock # or "frappe"
  VITE_FRAPPE_URL=https://your-tenant.frappe.cloud
  VITE_FRAPPE_API_KEY=your_key
  VITE_FRAPPE_API_SECRET=your_secret
  ```
- **Service Stubs:** `src/services/sales.ts` already contains `FrappeSalesApi` with explicit TODO comments citing the exact ERPNext python methods to link during backend onboarding.
