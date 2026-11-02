# Adadiko Dashboard — Control Site Integration Specification

## 1. Architectural Overview

**Adadiko Dashboard** is the standalone internal back-office administration suite for Adadiko's own staff. It operates separately from tenant client workspaces (`Adadiko Hub` / `Frontend`).

```
+-------------------------------------------------------------------------+
|                           Adadiko Dashboard                             |
|              (Internal Back Office for Adadiko Staff)                   |
|                              Port: 5174                                 |
+------------------------------------+------------------------------------+
                                     |
                                     | Authenticated RPC / REST Proxy
                                     v
+-------------------------------------------------------------------------+
|                 Adadiko Hub Control Site (control.localhost)            |
|                                                                         |
|  DocTypes:                                                              |
|   - Client Company (Tenants & Site URLs)                                |
|   - Hub Order (Invoices & Settlements)                                  |
|   - Hub Subscription (Contracts & Expiry Dates)                         |
|   - Hub Activity (Staff Audit Trail)                                    |
+-------------------+---------------------------------+-------------------+
                    |                                 |
                    | Provisions                      | Provisions
                    v                                 v
+----------------------------------+ +----------------------------------+
|  Tenant Workspace A              | |  Tenant Workspace B              |
|  (abri.localhost)                | |  (fantech.localhost)             |
|  Modules: Sales, Stock, Accounts | |  Modules: Sales, Stock, Mfg, CRM |
+----------------------------------+ +----------------------------------+
```

---

## 2. Service Layer & Live Data Access

The application adheres to strict architectural isolation:
- All screens query data **exclusively** through `getAdminApi()` (`src/services/admin.ts`).
- Authentication runs through `getAuthApi()` (`src/services/auth.ts`).
- All requests proxy to `control.localhost:8000` via Vite `/api` proxy with automatic CSRF token management.
- Live data only: zero mock fallbacks or demo profiles.

---

## 3. Control Site DocTypes Specification

### 3.1 `Client Company`
* **Naming**: Based on client slug
* **Fields**:
  | Fieldname | Type | Description |
  |---|---|---|
  | `company_name` | Data | Organization legal name |
  | `slug` | Data | Unique subdomain prefix |
  | `site_name` | Data | Dedicated tenant domain (`<slug>.localhost`) |
  | `status` | Select | `Ready`, `Suspended`, `Trial`, `Pending` |
  | `plan` | Link -> `Plan` | Contracted tier |
  | `contact_name` | Data | Primary administrator |
  | `contact_email` | Data | Primary email |

### 3.2 `Hub Order`
* **Naming**: `ORD-.#####`
* **Fields**:
  | Fieldname | Type | Description |
  |---|---|---|
  | `client_company` | Link -> `Client Company` | Tenant organization |
  | `plan` | Data | Plan tier |
  | `modules` | Small Text | Active modules |
  | `amount` | Currency | Billed amount |
  | `payment_status` | Select | `Paid`, `Pending`, `Failed` |
  | `reference` | Data | Invoice or settlement reference |
  | `created_on` | Datetime | Transaction timestamp |

### 3.3 `Hub Subscription`
* **Naming**: `SUB-.#####`
* **Fields**:
  | Fieldname | Type | Description |
  |---|---|---|
  | `client_company` | Link -> `Client Company` | Tenant organization |
  | `plan` | Data | Plan tier |
  | `status` | Select | `Active`, `Trial`, `Overdue`, `Suspended`, `Cancelled` |
  | `start_date` | Date | Effective inception date |
  | `renewal_date` | Date | Contract renewal milestone |
  | `amount` | Currency | Recurring run rate |

### 3.4 `Hub Activity`
* **Naming**: Auto UUID or Hash
* **Fields**:
  | Fieldname | Type | Description |
  |---|---|---|
  | `created_on` | Datetime | Exact UTC timestamp |
  | `action` | Select | `sign_in`, `plan_change`, `suspension`, `error`, `staff_action` |
  | `client_company` | Link -> `Client Company` | Target organization (optional) |
  | `staff_user` | Data | Name and email of operating staff member |
  | `details` | Text | Human-readable explanation of action |

---

## 4. Control Site Whitelisted API Methods

Located in custom app (`adadiko_hub/admin_api.py`):

| Method Name | HTTP Method | Arguments | Returns |
|---|---|---|---|
| `adadiko_hub.admin_api.staff_session` | `GET` | — | Current authenticated staff user and permissions |
| `adadiko_hub.admin_api.get_overview` | `GET` | — | Telemetry summary: active clients, MRR, signups |
| `adadiko_hub.admin_api.list_clients` | `GET` | `status`, `search` | Array of `Client Company` dicts |
| `adadiko_hub.admin_api.get_client` | `GET` | `slug` | Single `Client Company` record with logs |
| `adadiko_hub.admin_api.change_plan` | `POST` | `slug`, `plan` | Updated `Client Company` record |
| `adadiko_hub.admin_api.suspend_client` | `POST` | `slug`, `reason` | Suspended client record |
| `adadiko_hub.admin_api.reactivate_client` | `POST` | `slug` | Reactivated client record |
| `adadiko_hub.admin_api.add_client_note` | `POST` | `slug`, `note` | Updated `Client Company` record |
| `adadiko_hub.admin_api.list_orders` | `GET` | `status`, `client_company`, `search` | Array of `Hub Order` dicts |
| `adadiko_hub.admin_api.list_subscriptions` | `GET` | `status`, `search` | Array of `Hub Subscription` dicts |
| `adadiko_hub.admin_api.renew_subscription` | `POST` | `slug`, `months` | Extended `Hub Subscription` |
| `adadiko_hub.admin_api.list_catalog` | `GET` | — | Array of plans & modules |
| `adadiko_hub.admin_api.update_plan_price` | `POST` | `plan`, `price` | Updated plan price |
| `adadiko_hub.admin_api.list_logs` | `GET` | `action`, `client`, `staff` | Array of `Hub Activity` entries |
| `adadiko_hub.admin_api.list_staff` | `GET` | — | Array of `StaffUser` records |
| `adadiko_hub.admin_api.invite_staff` | `POST` | `full_name`, `email`, `role` | Created staff record + temp password |

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

## 6. Build & Verification

```bash
cd c:\Users\HP\Desktop\erp\Adadiko-Dashboard
npm run build
```
Ensures 0 TypeScript compilation errors and clean Vite chunk generation.
