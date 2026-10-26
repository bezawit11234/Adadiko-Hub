# Adadiko Hub Frontend

Vue 3 + Vite frontend application connecting to isolated multi-tenant ERPNext v16 sites orchestrated by `control.localhost`.

## Multi-Tenant Session Note (Important)

> [!NOTE]
> **Browser Cookie Isolation on Localhost**:
> In standard web browsers (Chrome, Edge, Firefox, Brave), cookies for `*.localhost` domains share a single cookie jar under `localhost`. Therefore, signing in to two separate company workspaces simultaneously requires **two separate browser profiles** (or one normal profile and one Incognito/Private window).
>
> In production environments with distinct domains (e.g., `clienta.adadikohub.com` and `clientb.adadikohub.com`), browsers maintain completely separate cookie jars natively.

## Multi-Tenant Architecture Overview

1. **Control Site Routing**:
   - `control.localhost` stores platform business metadata (`Client Company`, `Plan`).
   - Guest methods `request_workspace`, `get_workspace_status`, and `retry_workspace` are sent with `X-Frappe-Site-Name: control.localhost`.

2. **Tenant Site Routing**:
   - Each company operates on its own dedicated ERPNext site (`<slug>.localhost`).
   - Requests are tagged with `X-Frappe-Site-Name: <slug>.localhost` retrieved from local storage (`adadiko_current_site`).
   - CSRF protection is active (`ignore_csrf = 0`); CSRF tokens are stored per session and attached to all state-changing requests (`X-Frappe-CSRF-Token`).
