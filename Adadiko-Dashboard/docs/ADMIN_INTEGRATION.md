# Adadiko Dashboard — Control Site Integration Specification

## 1. Architectural Overview

**Adadiko Dashboard** is the standalone internal back-office administration suite for Adadiko's own staff. It operates separately from tenant client workspaces (`Adadiko Hub` / `Frontend`).

```
+-------------------------------------------------------------------------+
|                           Adadiko Dashboard                             |
|              (Internal Back Office for Adadiko Staff)                   |
|                   Port: 5174 | VITE_API_MODE=mock|frappe               |
+------------------------------------+------------------------------------+
                                     |
                                     | HTTP REST / Whitelist RPC
                                     v
+-------------------------------------------------------------------------+
|                 Frappe Control Site (development.localhost)             |
|                                                                         |
|  DocTypes:                                                              |
|   - Client Company (Tenants & Site URLs)                                |
|   - Module Item (Catalog & List Pricing)                                |
|   - Client Order (Invoices & Settlements)                               |
|   - Client Subscription (Contracts & Expiry Dates)                      |
|   - Activity Log (Audit Trail)                                          |
+-------------------+---------------------------------+-------------------+
                    |                                 |
                    | Provisions                      | Provisions
                    v                                 v
+----------------------------------+ +----------------------------------+
|  Tenant Workspace A              | |  Tenant Workspace B              |
|  (apex.adadiko.cloud)            | |  (horizon.adadiko.cloud)         |
|  Modules: Sales, Stock, Accounts | |  Modules: Sales, Stock, Mfg, CRM |
+----------------------------------+ +----------------------------------+
```

---

## 2. Service Layer & Mode Switching

The application adheres to strict architectural isolation:
- All screens query data **exclusively** through `getAdminApi()` (`src/services/admin.ts`).
- Screens **never** directly import mock files or hardcode API endpoints.
- **Switching Modes**:
  - Controlled via `VITE_API_MODE=mock` or `VITE_API_MODE=frappe` in `.env`.
  - Can also be dynamically toggled in runtime via the **API Mode Pill** in the top navigation header.

---

## 3. Control Site DocTypes Specification

### 3.1 `Client Company`
Represents an individual tenant business organization subscribing to Adadiko Hub.
* **DocType**: `Client Company`
* **Naming**: `cli_{slug}` or series `CC-.#####`
* **Fields**:
  | Fieldname | Type | Description |
  |---|---|---|
  | `company_name` | Data | Full legal company name (e.g., *Apex Wholesale Ltd*) |
  | `contact_name` | Data | Primary administrative contact person |
  | `contact_email` | Data | Primary billing / admin email |
  | `plan` | Select | `starter`, `growth`, `enterprise` |
  | `modules` | JSON / Table | Array of entitled module keys (`['sales', 'inventory']`) |
  | `status` | Select | `active`, `trial`, `suspended` |
  | `users_count` | Int | Current active user seats provisioned on bench |
  | `start_date` | Date | Account creation date |
  | `renewal_date` | Date | Next contract renewal or trial expiration |
  | `site_name` | Data | Tenant subdomain (e.g., `apex.adadiko.cloud`) |
  | `monthly_spend` | Currency | Calculated monthly recurring billing commitment |

### 3.2 `Module Item`
Defines available business modules in the marketplace catalog.
* **DocType**: `Module Item`
* **Naming**: `mod_{key}` (e.g., `mod_sales`, `mod_inventory`)
* **Fields**:
  | Fieldname | Type | Description |
  |---|---|---|
  | `module_key` | Data | Unique identifier (`sales`, `inventory`, `purchasing`, `finance`, `manufacturing`, `crm`, `hr`) |
  | `module_name` | Data | Public display name |
  | `description` | Small Text | Detailed capability description |
  | `monthly_price` | Currency | List price per tenant per month |
  | `yearly_price` | Currency | Discounted annual commitment price |
  | `category` | Select | `core`, `operations`, `finance`, `package` |
  | `is_core` | Check | If enabled, included by default in base plans |
  | `is_active` | Check | Availability toggle in client checkout |

### 3.3 `Client Order`
Financial billing history records for client invoice payments.
* **DocType**: `Client Order`
* **Naming**: `ORD-.YYYY.-.####`
* **Fields**:
  | Fieldname | Type | Description |
  |---|---|---|
  | `order_number` | Data | Reference code |
  | `client_company` | Link -> `Client Company` | Associated tenant |
  | `amount` | Currency | Total transaction amount |
  | `transaction_date`| Date | Settlement timestamp |
  | `status` | Select | `paid`, `pending`, `failed` |
  | `plan` | Select | `starter`, `growth`, `enterprise` |
  | `invoice_ref` | Data | External ERPNext Sales Invoice or Stripe Ref |

### 3.4 `Client Subscription`
Tracks recurring contract renewal milestones and automated extensions.
* **DocType**: `Client Subscription`
* **Naming**: `SUB-.#####`
* **Fields**:
  | Fieldname | Type | Description |
  |---|---|---|
  | `client_company` | Link -> `Client Company` | Tenant company |
  | `plan` | Select | `starter`, `growth`, `enterprise` |
  | `billing_cycle` | Select | `monthly`, `yearly` |
  | `amount` | Currency | Billed rate per cycle |
  | `start_date` | Date | Subscription commencement |
  | `renewal_date` | Date | Contract expiration date |
  | `status` | Select | `active`, `past_due`, `expiring`, `canceled` |
  | `auto_renew` | Check | Automatic payment processing flag |

### 3.5 `Activity Log`
Immutable administrative audit log of all decisions made by Adadiko staff.
* **DocType**: `Activity Log`
* **Naming**: Auto UUID or Hash
* **Fields**:
  | Fieldname | Type | Description |
  |---|---|---|
  | `timestamp` | Datetime | Exact UTC timestamp |
  | `log_type` | Select | `sign_in`, `plan_change`, `suspension`, `error`, `staff_action` |
  | `client_company` | Link -> `Client Company` | Target organization (optional) |
  | `staff_user` | Data | Name and email of operating staff member |
  | `details` | Text | Human-readable explanation of action |
  | `ip_address` | Data | Request origin IP address |

---

## 4. Frappe Control Site Whitelisted API Methods

Located in Frappe custom app (`adadiko_hub/admin.py`):

| Method Name | HTTP Method | Arguments | Returns |
|---|---|---|---|
| `adadiko_hub.admin.get_overview` | `GET` | — | Telemetry summary: active clients, MRR, signups |
| `adadiko_hub.admin.list_clients` | `GET` | `status`, `search` | Array of `Client Company` dicts |
| `adadiko_hub.admin.get_client` | `GET` | `id` | Single `Client Company` record with logs |
| `adadiko_hub.admin.update_client_plan`| `POST` | `client_id`, `plan`, `modules` | Updated `Client Company` record |
| `adadiko_hub.admin.set_client_status` | `POST` | `client_id`, `status` | Updated `Client Company` record |
| `adadiko_hub.admin.add_client_note` | `POST` | `client_id`, `note` | Updated `Client Company` record |
| `adadiko_hub.admin.list_orders` | `GET` | `status`, `search` | Array of `Client Order` dicts |
| `adadiko_hub.admin.list_subscriptions`| `GET` | `status`, `search` | Array of `Client Subscription` dicts |
| `adadiko_hub.admin.renew_subscription`| `POST` | `subscription_id`, `extension_months`| Extended `Client Subscription` |
| `adadiko_hub.admin.list_catalog` | `GET` | — | Array of `Module Item` records |
| `adadiko_hub.admin.update_module_price`| `POST`| `module_key`, `monthly_price`, `yearly_price` | Updated `Module Item` |
| `adadiko_hub.admin.list_logs` | `GET` | `type`, `search` | Array of `Activity Log` entries |
| `adadiko_hub.admin.list_staff` | `GET` | — | Array of `StaffUser` records |
| `adadiko_hub.admin.invite_staff` | `POST` | `name`, `email`, `role` | Created `StaffUser` record |

---

## 5. Staff Role & Permission Matrix

Adadiko Dashboard strictly implements role gating:

| Feature / Screen | Adadiko Admin (`admin`) | Adadiko Support (`support`) | Adadiko Billing (`billing`) |
|---|:---:|:---:|:---:|
| **Executive Overview** (`/overview`) | Full Access | Full Access | Full Access |
| **Clients List & Details** (`/clients`) | Full Access | Read-Only & Notes | Restricted (`/no-access`) |
| **Change Plan & Modules** | Yes | No (Hidden) | No (Restricted) |
| **Suspend / Reactivate Tenant** | Yes | No (Hidden) | No (Restricted) |
| **Add Diagnostic Support Notes**| Yes | Yes | No |
| **Orders & Invoices** (`/orders`) | Full Access | Restricted (`/no-access`) | Full Access |
| **Subscriptions & Renewals** (`/subscriptions`) | Full Access | Restricted (`/no-access`) | Full Access |
| **Renew Subscription Contract**| Yes | No | Yes |
| **Module Catalog & Pricing** (`/catalog`) | Full Access | Restricted (`/no-access`) | Restricted (`/no-access`) |
| **Audit Logs** (`/logs`) | Full Access | Full Access | Restricted (`/no-access`) |
| **Staff Administration** (`/staff`) | Full Access | Restricted (`/no-access`) | Restricted (`/no-access`) |

---

## 6. Verification & Demo Procedures

1. **Start Dev Server**:
   ```bash
   cd c:\Users\HP\Desktop\erp\Adadiko-Dashboard
   npm run dev
   ```
   Access at `http://localhost:5174`.

2. **Role Verification**:
   - Click the top navigation role switcher buttons: **Admin**, **Support**, **Billing**.
   - Notice the immediate dynamic recalculation of allowed tabs and capability buttons.
   - For example, switching to **Support** hides Billing tabs and restricts plan changing/suspension while preserving diagnostic note adding.
   - Switching to **Billing** reveals financial orders, subscriptions, and contract renewal tools.

3. **Production Build Check**:
   ```bash
   npm run build
   ```
   Ensures 0 TypeScript compilation errors and clean Vite chunk generation.
