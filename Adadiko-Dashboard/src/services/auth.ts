/**
 * Adadiko Dashboard — Staff Authentication Service
 *
 * Dedicated back-office staff authentication against the platform backend.
 */

import type { StaffUser, ApiResult } from '@/types'
import { platformRequest, setCsrfToken } from './platformHttp'

const SESSION_STORAGE_KEY = 'adadiko_staff_session'

export interface AuthApi {
  getCurrentUser(): StaffUser | null
  restoreSession(): Promise<StaffUser | null>
  login(email: string, password?: string): Promise<ApiResult<StaffUser>>
  logout(): Promise<void>
}

export class PlatformAuthApi implements AuthApi {
  getCurrentUser(): StaffUser | null {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  async restoreSession(): Promise<StaffUser | null> {
    try {
      const session = await platformRequest<any>('/api/method/adadiko_hub.admin_api.staff_session')
      if (session && session.user) {
        if (session.csrf_token) {
          setCsrfToken(session.csrf_token)
        }
        const staffUser: StaffUser = {
          id: session.user,
          email: session.email || session.user,
          name: session.name || session.user,
          role: session.role || 'support',
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
      await platformRequest('/api/method/login', {
        method: 'POST',
        body: JSON.stringify({ usr, pwd }),
      })

      // Fetch user profile and roles
      const session = await platformRequest<any>('/api/method/adadiko_hub.admin_api.staff_session')
      if (session.csrf_token) {
        setCsrfToken(session.csrf_token)
      }

      const staffUser: StaffUser = {
        id: session.user,
        email: session.email || session.user,
        name: session.name || session.user,
        role: session.role || 'support',
        lastActive: 'Just now',
      }
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(staffUser))
      return { ok: true, data: staffUser }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Staff authentication failed.' }
    }
  }

  async logout(): Promise<void> {
    try {
      await platformRequest('/api/method/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    setCsrfToken(null)
  }
}

const authInstance = new PlatformAuthApi()

export function getAuthApi(): AuthApi {
  return authInstance
}
