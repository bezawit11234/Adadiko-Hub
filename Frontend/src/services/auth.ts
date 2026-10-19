/**
 * Authentication service contract and implementations
 * Supports both Mock mode (for offline evaluation) and Frappe mode (production ERPNext v16 session).
 */
import type { ApiResult, User, Role } from '@/types'
import { DEMO_USERS } from '@/data/roles'
import { frappeFetch, setCsrfToken } from './frappeHttp'

export interface AuthApi {
  signIn(email: string, password?: string): Promise<ApiResult<User>>
  register(name: string, email: string, companyName: string): Promise<ApiResult<User>>
  forgotPassword(email: string): Promise<ApiResult<{ sent: boolean }>>
  getSession(): Promise<ApiResult<User>>
  signOut(): Promise<ApiResult<void>>
}

/**
 * Maps ERPNext roles to Adadiko Hub roles based on priority:
 * System Manager -> admin
 * Sales Manager -> sales_manager
 * Sales User    -> sales_rep
 * Stock User    -> storekeeper
 * Accounts User -> accountant
 */
export function mapFrappeRolesToRole(roles: string[]): Role {
  if (roles.includes('System Manager') || roles.includes('Administrator')) return 'admin'
  if (roles.includes('Sales Manager')) return 'sales_manager'
  if (roles.includes('Sales User')) return 'sales_rep'
  if (roles.includes('Stock User') || roles.includes('Stock Manager')) return 'storekeeper'
  if (roles.includes('Accounts User') || roles.includes('Accounts Manager')) return 'accountant'
  return 'sales_rep'
}

class MockAuthApi implements AuthApi {
  async signIn(email: string): Promise<ApiResult<User>> {
    const demo = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (demo) {
      return { ok: true, data: demo }
    }
    const user: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      name: email.split('@')[0],
      role: 'sales_rep',
      organizationId: 'org_acme',
      isDemo: false,
    }
    return { ok: true, data: user }
  }

  async register(name: string, email: string): Promise<ApiResult<User>> {
    const user: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name,
      email,
      role: 'admin',
      organizationId: 'org_' + Math.random().toString(36).substring(2, 9),
      isDemo: false,
    }
    return { ok: true, data: user }
  }

  async forgotPassword(email: string): Promise<ApiResult<{ sent: boolean }>> {
    return { ok: true, data: { sent: true } }
  }

  async getSession(): Promise<ApiResult<User>> {
    return { ok: true, data: DEMO_USERS.sales_manager }
  }

  async signOut(): Promise<ApiResult<void>> {
    return { ok: true, data: undefined }
  }
}

class FrappeAuthApi implements AuthApi {
  async signIn(email: string, password = ''): Promise<ApiResult<User>> {
    const loginRes = await frappeFetch<any>('/api/method/login', {
      method: 'POST',
      body: JSON.stringify({ usr: email, pwd: password }),
    })

    if (!loginRes.ok) {
      return { ok: false, error: loginRes.error || 'Invalid credentials or user disabled.' }
    }

    return this.getSession()
  }

  async getSession(): Promise<ApiResult<User>> {
    const res = await frappeFetch<{
      user: string
      full_name: string
      roles: string[]
      modules: any
      csrf_token?: string
    }>('/api/method/adadiko_hub.api.get_session')

    if (!res.ok || !res.data) {
      return { ok: false, error: res.error || 'Failed to fetch session.' }
    }

    if (res.data.user === 'Guest' || !res.data.user) {
      setCsrfToken(null)
      return { ok: false, error: 'User is not logged in.' }
    }

    if (res.data.csrf_token) {
      setCsrfToken(res.data.csrf_token)
    }

    const role = mapFrappeRolesToRole(res.data.roles || [])
    const user: User = {
      id: res.data.user,
      email: res.data.user,
      name: res.data.full_name || res.data.user.split('@')[0],
      role,
      organizationId: 'org_acme',
      isDemo: false,
    }

    return { ok: true, data: user }
  }

  async signOut(): Promise<ApiResult<void>> {
    await frappeFetch('/api/method/logout', { method: 'POST' })
    setCsrfToken(null)
    return { ok: true, data: undefined }
  }

  async register(name: string, email: string): Promise<ApiResult<User>> {
    return { ok: false, error: 'Registration is managed by ERPNext administrator.' }
  }

  async forgotPassword(email: string): Promise<ApiResult<{ sent: boolean }>> {
    const res = await frappeFetch('/api/method/frappe.core.doctype.user.user.reset_password', {
      method: 'POST',
      body: JSON.stringify({ user: email }),
    })
    if (!res.ok) {
      return { ok: false, error: res.error || 'Failed to send password reset request.' }
    }
    return { ok: true, data: { sent: true } }
  }
}

const mockAuthInstance = new MockAuthApi()
const frappeAuthInstance = new FrappeAuthApi()

export function getAuthApi(): AuthApi {
  let mode = import.meta.env.VITE_API_MODE
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('adadiko_api_mode')
    if (stored === 'mock' || stored === 'frappe') mode = stored
  }
  return mode === 'frappe' ? frappeAuthInstance : mockAuthInstance
}

