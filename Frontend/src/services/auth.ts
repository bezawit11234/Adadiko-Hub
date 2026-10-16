/**
 * Authentication service contract and mock implementation
 */
import type { ApiResult, User, Role } from '@/types'
import { DEMO_USERS } from '@/data/roles'

export interface AuthApi {
  signIn(email: string, password?: string): Promise<ApiResult<User>>
  register(name: string, email: string, companyName: string): Promise<ApiResult<User>>
  forgotPassword(email: string): Promise<ApiResult<{ sent: boolean }>>
}

class MockAuthApi implements AuthApi {
  async signIn(email: string): Promise<ApiResult<User>> {
    // Check if it's one of the demo emails
    const demo = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (demo) {
      return { ok: true, data: demo }
    }
    // Default fallback
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
}

const authInstance = new MockAuthApi()

export function getAuthApi(): AuthApi {
  return authInstance
}
