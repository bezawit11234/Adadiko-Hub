# Adadiko Next — User Journeys by Role (App Flow)

This guide walks through the plain-language user experience for every persona in Adadiko Next, explaining what each user sees, how they do their daily work, and how the system supports them from start to finish.

---

## 1. New Company Founder / Buyer (Public Flow)

1. **Marketplace Discovery (`/` and `/products`)**:
   - The buyer visits Adadiko Next and explores the interactive Module Marketplace.
   - They click **Sales & Customer Pipeline** to see its features, pricing (\$39/mo), and how it handles quotations, orders, deliveries, and customer balances.
   - They review other modules (Inventory, Purchasing, Finance) that can be activated later.
2. **Pricing & Plan Customization (`/pricing` and `/checkout`)**:
   - The buyer selects the **Growth Suite** plan with annual billing (saving 20%).
   - At checkout, they specify their organization name (*"Apex Wholesale Ltd"*), country, and primary admin account.
   - When they click **Launch Workspace**, a smooth animated provisioning screen simulates setting up an isolated Frappe Cloud tenant database (schema setup, role permissions, sample catalog).
   - In seconds, they are redirected straight into their new, ready-to-use client dashboard.

---

## 2. Sales Representative (Daily Pipeline Flow)

**Default Landing:** `/app/sales` (Sales Rep Today Desk)

1. **Morning Routine:**
   - The Sales Rep (Tariq) signs in and arrives at his personal workspace.
   - At the top, he reviews his **Today's Action Checklist** (e.g. following up with Blue Nile Trading on battery quotes).
   - Below, he checks **My Open Orders in Progress** to see which client deliveries are scheduled for today.
2. **Checking Customer Balance:**
   - Under **Accounts to Follow Up**, Tariq notices that *Blue Nile Trading PLC* currently owes \$14,200.00.
   - He clicks into the customer profile to review past delivery notes and invoice dates before picking up the phone.
3. **Creating a New Sales Order (`/app/sales/orders/new`):**
   - Tariq clicks the prominent orange **"New Sales Order"** button.
   - He selects the customer and chooses a delivery date (7 days out).
   - He adds line items from the catalog. When he picks the *Hybrid Solar Inverter*, a friendly yellow badge alerts him: *"Only 3 left in Main Store"*.
   - Live totals automatically update line by line, calculating the 15% VAT and grand total.
   - He submits the order. A success toast confirms the order was created, and the order advances to the fulfillment stage.

---

## 3. Sales Manager (Revenue Oversight & Approvals)

**Default Landing:** `/app/sales/dashboard` (Manager Operations Dashboard)

1. **Executive Telemetry:**
   - The Sales Manager (Sarah) logs in and immediately sees the 4 core KPI cards: Sales closed today, Month-to-date revenue vs. target (\$75,000 quota), Open orders in queue, and total Customer debt (\$24,787.50).
   - She analyzes the **Inline SVG Revenue Trend Chart**, reviewing closed deal volume over the past 7 days.
2. **Pipeline Stage Visibility:**
   - Sarah checks the pipeline stage counters: 8 active quotations, 4 open sales orders, 7 delivered shipments, 6 invoiced bills, and 19 paid transactions.
3. **Handling Discount Approvals:**
   - Under **Approvals Waiting**, Sarah sees a pending 5% volume discount request from Tariq for *Blue Nile Trading PLC* (\$9,936.00).
   - She clicks **Approve**. The request status changes instantly, and the rep is authorized to proceed with delivery.
4. **Team Performance Quotas:**
   - Sarah inspects the team performance table with visual quota progress bars to ensure reps are on pace for monthly targets.

---

## 4. Storekeeper (Fulfillment & Dispatch)

**Default Landing:** `/app/sales/deliveries` (Deliveries & Dispatch)

1. **Packing Queue:**
   - The Storekeeper (Kwame) logs in to his dedicated fulfillment view. The sidebar only displays delivery-related tools—no confusing financial charts or pricing forms.
   - At the top, he sees **Orders Waiting for Delivery** showing confirmed sales orders ready for packing.
2. **One-Click Dispatch:**
   - Kwame inspects order `#SO-2026-0104`, packages the 4 solar storage units and 2 hybrid inverters from Main Store shelf 4B.
   - He clicks **"Create Delivery"**.
   - The system immediately produces a persistent Delivery Note (`#DN-2026-0053`), marks the order as *Fully Delivered*, and moves the order to the billing stage for accounting.

---

## 5. Accountant (Receivables & Payments)

**Default Landing:** `/app/sales/invoices` (Invoices & Receivables)

1. **Receivables Ledger:**
   - The Accountant (Fiona) signs in to monitor incoming cash flow.
   - She reviews the total customer debt banner (\$24,787.50) and filters by **Unpaid** and **Overdue** chips.
2. **Recording Incoming Customer Payment:**
   - When *Sahara Grocers Cooperative* wires funds, Fiona finds Invoice `#SINV-2026-0038` and clicks **"Record Payment"**.
   - A dialog opens pre-filled with the outstanding amount (\$667.00).
   - She selects *Bank Wire Transfer*, enters the Stanbic wire reference number, and clicks **Save Payment Entry**.
   - The invoice badge turns to green **Paid**, the customer's debt drops to zero, and the underlying sales order is marked as *Completed*.

---

## 6. Company Admin (Workspace Team & Plan)

**Default Landing:** `/app/sales/dashboard` (with full `/app/users` and `/app/plan` access)

1. **Managing Team Permissions (`/app/users`):**
   - The Admin (Marcus) invites new team members, assigning them specific roles (Sales Rep, Sales Manager, Accountant, Storekeeper).
   - He reviews the **Sales Role-Permission Matrix** to verify what each staff member can view and execute.
2. **Managing Modules (`/app/plan`):**
   - In the Plan dashboard, Marcus reviews active modules.
   - If the company wants to preview Inventory & Warehousing, he clicks **"Add to Workspace"**. The module is immediately unlocked in the sidebar and navigation guards.

---

## 7. Adadiko Platform HQ Staff (Back Office)

**Default Landing:** `/admin` (Platform Operator Command Center)

1. **Multi-Tenant Overview:**
   - Elena monitors 18 client tenant organizations across multi-tenant clusters.
   - She reviews recurring MRR (\$42,850/mo) and platform uptime (99.98%).
2. **Tenant Registry & Logs:**
   - In `/admin/clients`, she manages tenant accounts and administrators.
   - In `/admin/logs`, she audits Frappe REST sync requests, authentication logs, and automated cloud backup snapshots.
