/**
 * Adadiko Dashboard — Staff Authentication Service
 *
 * Dedicated back-office staff authentication. Clients cannot log in here.
 */

import type { StaffUser, StaffRole, ApiResult } from '@/types'
import { DEMO_STAFF } from '@/data/roles'
import { frappeRequest, setCsrfToken } from './frappeHttp'

const SESSION_STORAGE_KEY = 'adadiko_staff_session'

export interface AuthApi {
  getCurrentUser(): StaffUser | null
  login(email: string, password?: string): Promise<ApiResult<StaffUser>>
  switchRole(role: StaffRole): StaffUser
  logout(): Promise<void>
}

export class MockAuthApi implements AuthApi {
  private currentUser: StaffUser | null = null

  constructor() {
    this.restoreSession()
  }

  private restoreSession(): void {
    if (typeof window === 'undefined') return
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (stored) {
        this.currentUser = JSON.parse(stored)
      } else {
        // Default to Elena Rostova (Admin) for instant preview
        this.currentUser = { ...DEMO_STAFF.admin }
      }
    } catch {
      this.currentUser = { ...DEMO_STAFF.admin }
    }
  }

  getCurrentUser(): StaffUser | null {
    if (!this.currentUser) {
      this.restoreSession()
    }
    return this.currentUser
  }

  async login(email: string, _password?: string): Promise<ApiResult<StaffUser>> {
    // Quick demo matching
    const matched = Object.values(DEMO_STAFF).find(
      (u) => u.email.toLowerCase() === email.toLowerCase() || u.role === email.toLowerCase()
    )

    if (matched) {
      this.currentUser = { ...matched, lastActive: 'Just now' }
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.currentUser))
      return { ok: true, data: this.currentUser }
    }

    // Generic staff user
    const customUser: StaffUser = {
      id: `staff_${Date.now()}`,
      name: email.split('@')[0].replace('.', ' '),
      email,
      role: 'support', // default to safe role
      isDemo: true,
      lastActive: 'Just now',
    }
    this.currentUser = customUser
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.currentUser))
    return { ok: true, data: this.currentUser }
  }

  switchRole(role: StaffRole): StaffUser {
    const demo = DEMO_STAFF[role] || DEMO_STAFF.admin
    this.currentUser = { ...demo, lastActive: 'Just now' }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.currentUser))
    }
    return this.currentUser
  }

  async logout(): Promise<void> {
    this.currentUser = null
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }
}

export class FrappeAuthApi implements AuthApi {
  getCurrentUser(): StaffUser | null {
    // In Frappe mode, session is stored in sessionStorage and validated via staff_session
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  async restoreSession(): Promise<StaffUser | null> {
    try {
      const session = await frappeRequest<any>('/api/method/adadiko_hub.admin_api.staff_session')
      if (session && session.user) {
        if (session.csrf_token) {
          setCsrfToken(session.csrf_token)
        }
        const staffUser: StaffUser = {
          id: session.user,
          email: session.email || session.user,
          name: session.name || session.user,
          role: session.role || 'support',
          isDemo: false,
          lastActive: 'Just now',
        }
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(staffUser))
        return staffUser
      }
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
      setCsrfToken(null)
    }
    return null
  }

  async login(usr: string, pwd?: string): Promise<ApiResult<StaffUser>> {
    try {
      await frappeRequest('/api/method/login', {
        method: 'POST',
        body: JSON.stringify({ usr, pwd }),
      })

      // Fetch user profile and control site roles
      const session = await frappeRequest<any>('/api/method/adadiko_hub.admin_api.staff_session')
      if (session.csrf_token) {
        setCsrfToken(session.csrf_token)
      }

      const staffUser: StaffUser = {
        id: session.user,
        email: session.email || session.user,
        name: session.name || session.user,
        role: session.role || 'support',
        isDemo: false,
        lastActive: 'Just now',
      }
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(staffUser))
      return { ok: true, data: staffUser }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Staff authentication failed.' }
    }
  }

  switchRole(role: StaffRole): StaffUser {
    // In frappe mode, switching is allowed for demo / preview
    const demo = DEMO_STAFF[role] || DEMO_STAFF.admin
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(demo))
    return demo
  }

  async logout(): Promise<void> {
    try {
      await frappeRequest('/api/method/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    setCsrfToken(null)
  }
}

const mockAuthInstance = new MockAuthApi()
const frappeAuthInstance = new FrappeAuthApi()

export function getAuthApi(overrideMode?: 'mock' | 'frappe'): AuthApi {
  const envMode = (import.meta.env.VITE_API_MODE as string) || 'mock'
  const mode = overrideMode || (typeof window !== 'undefined' && (window as any).__ADADIKO_API_MODE) || envMode
  return mode === 'frappe' ? frappeAuthInstance : mockAuthInstance
}
