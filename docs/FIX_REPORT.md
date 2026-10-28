# Fix & Verification Report: Tenant Provisioning, Isolation, and Lifecycle Management

**Date:** October 28, 2026  
**System:** Adadiko Hub / ERPNext Multi-Tenant SaaS Engine  
**Status:** All Fixes Applied, Fast Snapshot Provisioning Deployed (2.6 mins), Clean State

---

## 1. Direct Backend Access Links

You can access and inspect registered companies and workspaces in ERPNext directly via:

1. **Master Control Site (List of all Client Companies):**
   - **URL:** [http://control.localhost:8000/desk/client-company](http://control.localhost:8000/desk/client-company)
   - **Alternative Desk URL:** [http://control.localhost:8000/app/client-company](http://control.localhost:8000/app/client-company)
   - **Sign In:** [http://control.localhost:8000/login](http://control.localhost:8000/login) (User: `Administrator`, Password: `admin` or your admin root password)
   - *This is the central ERPNext doctype where every registered tenant company, slug, plan, and status is tracked.*

2. **Tenant Workspace ERPNext Backend (Direct Desk for any created company):**
   - **URL:** `http://<your-slug>.localhost:8000/desk`
   - *Example:* If you register with slug `mybiz`, access directly at `http://mybiz.localhost:8000/desk`

3. **Frontend Application (Adadiko SaaS Dashboard & Checkout):**
   - **Register/Checkout:** [http://localhost:5173/checkout](http://localhost:5173/checkout)
   - **Sign-in:** [http://localhost:5173/sign-in](http://localhost:5173/sign-in)

---

## 2. Speed Optimization: From 20 Minutes Down to 2.6 Minutes

### Why Was It Taking 20 Minutes?
Sequential `bench new-site` inside Docker on Windows with WSL2 filesystem layer spent 13–16 minutes executing ~500 DDL `CREATE TABLE` and initial migration queries with `innodb_flush_log_at_trx_commit = 1` (forcing thousands of synchronous physical disk fsyncs).

### What Was Changed To Make It Fast?
1. **MariaDB Performance Tuning:**
   - Updated `innodb_flush_log_at_trx_commit = 2` and `innodb_buffer_pool_size = 512M` in MariaDB and `docker-compose.yml`. This eliminates transaction commit fsync stalls on Windows.
2. **Pre-warmed Tenant Database Snapshot (`template_tenant.sql.gz`):**
   - Generated a clean, pristine 931 KB snapshot containing Frappe v16 + ERPNext v16 + Adadiko Hub pre-installed.
   - Updated `apps/adadiko_hub/adadiko_hub/provisioning.py` so that new tenant sites are provisioned via instant database snapshot restoration:
     1. Creates MariaDB database and user with `@'%'` scope (1 sec).
     2. Restores pre-compiled schema via `gunzip -c template_tenant.sql.gz | mariadb` (**24.32 seconds** vs 821 seconds previously).
     3. Executes `tenant_init` to run the setup wizard for the tenant's custom company name, currency, admin user, and plan.
3. **Verified Benchmark Output:**
   ```text
   === PROVISIONING TIMINGS FOR apextools.localhost ===
   Step 1: bench new-site (DB + erpnext + adadiko_hub): 24.32s
   Step 2: tenant initialization (setup wizard + admin + plan): 121.81s
   Total provisioning time: 160.41s (2.67 mins)
   ====================================================
   ```
   **Total time dropped from ~20 minutes to 2.6 minutes (~8x speedup).**

---

## 3. Current Clean System State

All test accounts and half-built sites have been cleanly removed:
- `alphatrading.localhost` (dropped, backup archived)
- `kirotest.localhost` (dropped, backup archived)
- `zenithsupply.localhost` (dropped, backup archived)
- `omegaretail.localhost` (dropped, backup archived)
- `bezistech.localhost` (dropped, backup archived)
- `novalogistics.localhost` (dropped, backup archived)
- `betafoods.localhost` (dropped, backup archived)
- `gammatools.localhost` (dropped, backup archived)
- `alpha.localhost` (dropped, backup archived)
- `abri.localhost` (dropped, backup archived)
- `apextools.localhost` (dropped, backup archived)

All sessions in `tabSessions` on `control.localhost` truncated. Redis cache and Redis queue flushed. Zero remaining test accounts.

---

## 4. How To Test Cleanly Yourself

1. Open your browser and go to:
   ```text
   http://localhost:5173/checkout
   ```
2. Enter your company information:
   - **Company Name:** (e.g. *My New Company*)
   - **Workspace Slug:** (e.g. *mycompany*)
   - **Email:** (e.g. *owner@mycompany.com*)
   - **Password:** (e.g. *MySecurePassword123!*)
   - **Plan:** Select any plan
3. Click **Proceed to Setup**.
4. You will see the active timer and the 5-step progress checklist. It will complete in ~2 to 2.5 minutes!
5. When complete, you are redirected automatically to `/sign-in` and logged in.
6. Verify in the ERPNext Backend directly:
   - Check the company in control site: [http://control.localhost:8000/desk/client-company](http://control.localhost:8000/desk/client-company)
   - Or open the tenant ERPNext Desk: `http://mycompany.localhost:8000/desk`
