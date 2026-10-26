# Adadiko Hub Project Progress

## Status: COMPLETE

### Backend Multi-Tenant Architecture (`apps/adadiko_hub`)
- [x] Control site `control.localhost` configured with `Client Company` and `Plan` DocTypes.
- [x] Role `Adadiko Staff` restricts access to business registration and subscription records.
- [x] Guest-callable endpoints `request_workspace(company_name, slug, contact_name, email, password, modules)` and `get_workspace_status(slug)` implemented with input validation, slug pattern enforcement, and IP rate limiting.
- [x] Endpoint `retry_workspace(slug)` implemented for automated re-queueing of failed setups.
- [x] Provisioning engine `provision_client(client_name)` automated via `bench new-site`, `install-app erpnext`, `install-app adadiko_hub`, setup wizard execution, `System Manager` user creation, and `Hub Plan` single DocType synchronization.
- [x] Removed silent fallback in `create_sales_order` to let ERPNext's real validation and error text bubble up.
- [x] Verified isolation and administrative boundaries between `alphatrading.localhost`, `betafoods.localhost`, and `gammatools.localhost`.

### Frontend Multi-Tenant Wiring (`Frontend/`)
- [x] Fixed `X-Frappe-Site-Name` header removed from `Frontend/vite.config.ts`; proxy forwards dynamic headers cleanly.
- [x] `src/services/frappeHttp.ts`: Dynamically attaches `X-Frappe-Site-Name` on every request (`control.localhost` for workspace lifecycle, stored `<slug>.localhost` for tenant operations).
- [x] Persistent session storage: Site and slug saved upon sign-up or sign-in; completely purged on sign-out (`clearStoredSite()`).
- [x] CSRF Token flow: Tokens stored in `sessionStorage` and attached via `X-Frappe-CSRF-Token` on all mutations, running smoothly under `ignore_csrf = 0`.
- [x] `CheckoutPage.vue`: 5-step wizard calling `request_workspace` on control site, polling `get_workspace_status` every 3s, displaying plain-words statuses (`Pending`, `Provisioning`, `Ready`, `Failed`), surviving page refresh via `adadiko_pending_slug`.
- [x] `SignInPage.vue`: Requires Workspace Subdomain in addition to Email and Password, targeting only the specified tenant site.
- [x] `AppShell.vue`: Displays Company Name and Workspace Address (`<slug>.localhost`) in top navigation and sidebar.
- [x] Module keys: Standardized canonical lowercase keys (`sales`, `inventory`, etc.) across session and `useAccess`.
- [x] Cleanliness: Zero calls to `Accounts Settings` in frontend; test-account shortcuts hidden.
- [x] Documented browser localhost cookie jar constraint in `Frontend/README.md`.
- [x] Built and verified via `npm run build` (0 errors).
- [x] End-to-end verified via `curl.exe` through `http://localhost:5173` with cookie jars on `gammatools`. Report published in `Frontend/docs/WIRING_REPORT.md`.
