/**
 * Authentication service contract and implementations
 * Supports both Mock mode (for offline evaluation) and Frappe mode (production ERPNext v16 session).
 * Starts completely clean with NO mock users. In mock mode, accounts registered in this browser are stored in localStorage.
 */
import type { ApiResult, User, Role, Organization, ModuleKey } from '@/types'
import { ROLE_DEFINITIONS } from '@/data/roles'
import { setAppCurrency } from '@/utils/format'
import {
  frappeFetch,
  setCsrfToken,
  getStoredSiteName,
  setStoredSiteName,
  getStoredSlug,
  setStoredSlug,
  clearStoredSite,
} from './frappeHttp'

let _inMemoryCheckoutPassword: string | null = null

export function setCheckoutSessionPassword(pwd: string | null): void {
  _inMemoryCheckoutPassword = pwd
}

export function consumeCheckoutSessionPassword(): string | null {
  const pwd = _inMemoryCheckoutPassword
  _inMemoryCheckoutPassword = null
  return pwd
}

function erpnextRoleFor(role: Role): string {
  return ROLE_DEFINITIONS[role]?.erpnextRole || 'Sales User'
}

function mapFrappeUserRecord(raw: {
  name?: string
  email?: string
  full_name?: string
  first_name?: string
  roles?: { role?: string }[] | string[]
}): User {
  const roleList = (raw.roles || []).map((row) => (typeof row === 'string' ? row : row.role || ''))
  return {
    id: raw.name || raw.email || '',
    email: raw.email || raw.name || '',
    name: raw.full_name || raw.first_name || raw.email || '',
    role: mapFrappeRolesToRole(roleList),
    organizationId: 'org_workspace',
    isDemo: false,
  }
}

export interface RegisterOptions {
  plan?: Organization['plan']
  billingCycle?: Organization['billingCycle']
  subscribedModules?: ModuleKey[]
}

export interface AuthApi {
  signIn(email: string, password?: string, workspaceSlug?: string): Promise<ApiResult<User>>
  register(
    name: string,
    email: string,
    companyName?: string,
    password?: string,
    options?: RegisterOptions,
  ): Promise<ApiResult<User>>
  forgotPassword(email: string): Promise<ApiResult<{ sent: boolean }>>
  getSession(): Promise<ApiResult<User>>
  signOut(): Promise<ApiResult<void>>
  inviteUser(name: string, email: string, role: Role, password?: string): Promise<ApiResult<User>>
  listUsers(): Promise<ApiResult<User[]>>
  updateUser(
    id: string,
    input: { name?: string; role?: Role; password?: string },
  ): Promise<ApiResult<User>>
  deleteUser(id: string): Promise<ApiResult<void>>
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

interface MockAccount {
  user: User
  organization: Organization
  password?: string
}

const STORAGE_KEY_ACCOUNTS = 'adadiko_mock_accounts'
const STORAGE_KEY_CURRENT_USER = 'adadiko_current_user'
const STORAGE_KEY_CURRENT_ORG = 'adadiko_current_org'

function writeSession(user: User, organization: Organization): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user))
  sessionStorage.setItem(STORAGE_KEY_CURRENT_ORG, JSON.stringify(organization))
}

function clearSessionStorage(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER)
  sessionStorage.removeItem(STORAGE_KEY_CURRENT_ORG)
}

function readSessionUser(): User | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_CURRENT_USER)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function readSessionOrg(): Organization | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_CURRENT_ORG)
    return raw ? (JSON.parse(raw) as Organization) : null
  } catch {
    return null
  }
}

function getStoredAccounts(): MockAccount[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveStoredAccounts(accounts: MockAccount[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts))
}

class MockAuthApi implements AuthApi {
  async signIn(email: string, password = '', workspaceSlug = ''): Promise<ApiResult<User>> {
    const accounts = getStoredAccounts()
    const normalizedEmail = email.trim().toLowerCase()
    const account = accounts.find((a) => a.user.email.toLowerCase() === normalizedEmail)

    if (!account) {
      return {
        ok: false,
        error: 'No account found with this email. Please sign up to create your workspace.',
      }
    }

    if (!password) {
      return { ok: false, error: 'Enter the password you created when you set up this workspace.' }
    }
    if (!account.password || account.password !== password) {
      return { ok: false, error: 'Incorrect password. Please verify your credentials.' }
    }

    if (workspaceSlug) {
      const cleanSlug = workspaceSlug.replace(/\.localhost$/, '').trim().toLowerCase()
      setStoredSlug(cleanSlug)
      setStoredSiteName(`${cleanSlug}.localhost`)
      account.organization.slug = cleanSlug
      account.organization.siteName = `${cleanSlug}.localhost`
    }

    writeSession(account.user, account.organization)
    return { ok: true, data: account.user }
  }

  async register(
    name: string,
    email: string,
    companyName = '',
    password = '',
    options?: RegisterOptions,
  ): Promise<ApiResult<User>> {
    const accounts = getStoredAccounts()
    const normalizedEmail = email.trim().toLowerCase()

    if (password.trim().length < 8) {
      return { ok: false, error: 'Choose a password with at least 8 characters so you can sign in later.' }
    }

    if (accounts.some((a) => a.user.email.toLowerCase() === normalizedEmail)) {
      return { ok: false, error: 'An account with this email address already exists. Please sign in.' }
    }

    const orgId = 'org_' + Math.random().toString(36).substring(2, 9)
    const org: Organization = {
      id: orgId,
      name: companyName.trim() || `${name.trim()}'s Company`,
      plan: options?.plan ?? 'starter',
      billingCycle: options?.billingCycle ?? 'monthly',
      subscribedModules: options?.subscribedModules?.length ? [...options.subscribedModules] : ['sales'],
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active',
    }

    const userId = 'usr_' + Math.random().toString(36).substring(2, 9)
    const user: User = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      role: 'admin',
      organizationId: orgId,
      isDemo: false,
    }

    accounts.push({ user, organization: org, password })
    saveStoredAccounts(accounts)
    writeSession(user, org)
    return { ok: true, data: user }
  }

  async forgotPassword(_email: string): Promise<ApiResult<{ sent: boolean }>> {
    return { ok: true, data: { sent: true } }
  }

  async getSession(): Promise<ApiResult<User>> {
    const user = readSessionUser()
    if (user) return { ok: true, data: user }
    return { ok: false, error: 'No active session found.' }
  }

  async signOut(): Promise<ApiResult<void>> {
    clearSessionStorage()
    clearStoredSite()
    return { ok: true, data: undefined }
  }

  async inviteUser(name: string, email: string, role: Role, password = 'password123'): Promise<ApiResult<User>> {
    const accounts = getStoredAccounts()
    const normalizedEmail = email.trim().toLowerCase()

    if (accounts.some((a) => a.user.email.toLowerCase() === normalizedEmail)) {
      return { ok: false, error: `User with email ${email} already exists.` }
    }

    let org: Organization = {
      id: 'org_workspace',
      name: 'Company Workspace',
      plan: 'starter',
      billingCycle: 'monthly',
      subscribedModules: ['sales'],
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active',
    }

    const storedOrg = readSessionOrg()
    if (storedOrg) org = storedOrg

    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      email: normalizedEmail,
      role,
      organizationId: org.id,
      isDemo: false,
    }

    accounts.push({ user: newUser, organization: org, password })
    saveStoredAccounts(accounts)

    return { ok: true, data: newUser }
  }

  async listUsers(): Promise<ApiResult<User[]>> {
    const accounts = getStoredAccounts()
    const sessionUser = readSessionUser()
    const orgId = sessionUser?.organizationId
    const rows = orgId
      ? accounts.filter((account) => account.user.organizationId === orgId)
      : accounts
    return { ok: true, data: rows.map((account) => account.user) }
  }

  async updateUser(
    id: string,
    input: { name?: string; role?: Role; password?: string },
  ): Promise<ApiResult<User>> {
    const actor = readSessionUser()
    if (actor?.role !== 'admin') {
      return { ok: false, error: 'Only the workspace admin can edit teammates.' }
    }
    const accounts = getStoredAccounts()
    const index = accounts.findIndex(
      (account) => account.user.id === id && account.user.organizationId === actor.organizationId,
    )
    if (index < 0) {
      return { ok: false, error: 'That teammate was not found.' }
    }
    if (accounts[index].user.id === actor.id && input.role && input.role !== 'admin') {
      return { ok: false, error: 'You cannot change your own admin role.' }
    }
    const current = accounts[index]
    const updatedUser: User = {
      ...current.user,
      name: input.name?.trim() || current.user.name,
      role: input.role ?? current.user.role,
    }
    accounts[index] = {
      ...current,
      user: updatedUser,
      password: input.password?.trim() ? input.password : current.password,
    }
    saveStoredAccounts(accounts)
    if (updatedUser.id === actor.id) {
      const org = readSessionOrg()
      if (org) writeSession(updatedUser, org)
    }
    return { ok: true, data: updatedUser }
  }

  async deleteUser(id: string): Promise<ApiResult<void>> {
    const actor = readSessionUser()
    if (actor?.role !== 'admin') {
      return { ok: false, error: 'Only the workspace admin can remove teammates.' }
    }
    if (actor.id === id) {
      return { ok: false, error: 'You cannot remove your own admin account.' }
    }
    const accounts = getStoredAccounts()
    const target = accounts.find((account) => account.user.id === id)
    if (!target || target.user.organizationId !== actor.organizationId) {
      return { ok: false, error: 'That teammate was not found.' }
    }
    saveStoredAccounts(accounts.filter((account) => account.user.id !== id))
    return { ok: true, data: undefined }
  }
}

class FrappeAuthApi implements AuthApi {
  async signIn(email: string, password = '', workspaceSlug?: string): Promise<ApiResult<User>> {
    let slug = (workspaceSlug || '').trim().toLowerCase()
    if (!slug) {
      slug = getStoredSlug() || ''
    }
    slug = slug.replace(/\.localhost$/, '').trim().toLowerCase()

    if (!slug) {
      return { ok: false, error: 'Please enter your workspace address (e.g. alphatrading).' }
    }

    const targetSite = `${slug}.localhost`
    setStoredSiteName(targetSite)
    setStoredSlug(slug)

    const loginRes = await frappeFetch<any>('/api/method/login', {
      method: 'POST',
      headers: {
        'X-Frappe-Site-Name': targetSite,
      },
      body: JSON.stringify({ usr: email.trim(), pwd: password }),
    })

    if (!loginRes.ok) {
      return {
        ok: false,
        error: loginRes.error || 'Incorrect email or password. Please verify your credentials.',
      }
    }

    return this.getSession()
  }

  async getSession(): Promise<ApiResult<User>> {
    const currentSite = getStoredSiteName()
    if (!currentSite) {
      return { ok: false, error: 'No workspace configured.' }
    }

    const res = await frappeFetch<{
      user: string
      full_name: string
      roles: string[]
      modules: any
      csrf_token?: string
      company_name?: string
      site_name?: string
      plan_name?: string
      currency?: string
    }>('/api/method/adadiko_hub.api.get_session', {
      headers: {
        'X-Frappe-Site-Name': currentSite,
      },
    })

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
    const slug = getStoredSlug() || currentSite.replace(/\.localhost$/, '')
    const user: User = {
      id: res.data.user,
      email: res.data.user,
      name: res.data.full_name || res.data.user.split('@')[0],
      role,
      organizationId: `org_${slug}`,
      isDemo: false,
    }

    // Determine subscribed modules and plan tier from backend Hub Plan
    const rawModules = Array.isArray(res.data.modules) ? res.data.modules : []
    const modules: ModuleKey[] = rawModules.length > 0 ? (rawModules as ModuleKey[]) : ['sales']

    let planTier: Organization['plan'] = 'starter'
    const planName = (res.data.plan_name || '').toLowerCase()
    if (planName.includes('full') || modules.length >= 4) {
      planTier = 'enterprise'
    } else if (planName.includes('inventory') || modules.length > 1) {
      planTier = 'growth'
    }

    const org: Organization = {
      id: `org_${slug}`,
      name: res.data.company_name || slug.toUpperCase(),
      slug,
      siteName: res.data.site_name || currentSite,
      plan: planTier,
      billingCycle: 'monthly',
      subscribedModules: modules,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active',
      currency: res.data.currency || 'USD',
    }

    setAppCurrency(org.currency || 'USD')
    writeSession(user, org)

    return { ok: true, data: user }
  }

  async signOut(): Promise<ApiResult<void>> {
    try {
      await frappeFetch('/api/method/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    clearSessionStorage()
    clearStoredSite()
    return { ok: true, data: undefined }
  }

  async register(
    name: string,
    email: string,
    companyName = '',
    password = '',
    _options?: RegisterOptions,
  ): Promise<ApiResult<User>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.register_user', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email: email.trim(),
        password,
        company_name: companyName,
      }),
    })

    if (!res.ok) {
      return { ok: false, error: res.error || 'Failed to register account on ERPNext.' }
    }

    // Immediately authenticate with ERPNext
    return this.signIn(email, password)
  }

  async inviteUser(name: string, email: string, role: Role, password = 'password123'): Promise<ApiResult<User>> {
    const res = await frappeFetch<any>('/api/method/adadiko_hub.api.invite_teammate', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email: email.trim(),
        role,
        password,
      }),
    })

    if (!res.ok || !res.data) {
      return { ok: false, error: res.error || 'Failed to create teammate account in ERPNext.' }
    }

    const newUser: User = {
      id: res.data.id || email,
      email: res.data.email || email,
      name: res.data.name || name,
      role: res.data.role || role,
      organizationId: 'org_workspace',
      isDemo: false,
    }

    return { ok: true, data: newUser }
  }

  async listUsers(): Promise<ApiResult<User[]>> {
    const res = await frappeFetch<any[]>('/api/method/adadiko_hub.api.list_team_members')
    if (!res.ok || !res.data) {
      return { ok: false, error: res.error || 'Failed to load team members from ERPNext.' }
    }

    const users: User[] = res.data.map((u) => ({
      id: u.id || u.email,
      email: u.email,
      name: u.name || u.email,
      role: u.role || 'sales_rep',
      organizationId: 'org_workspace',
      isDemo: false,
    }))

    return { ok: true, data: users }
  }

  async updateUser(
    id: string,
    input: { name?: string; role?: Role; password?: string },
  ): Promise<ApiResult<User>> {
    const userName = encodeURIComponent(id)
    const payload: Record<string, unknown> = {}
    if (input.name?.trim()) {
      payload.first_name = input.name.trim()
      payload.full_name = input.name.trim()
    }
    if (input.role) {
      payload.roles = [{ role: erpnextRoleFor(input.role) }]
    }
    if (input.password?.trim()) {
      payload.new_password = input.password.trim()
    }

    const custom = await frappeFetch<User>('/api/method/adadiko_hub.api.update_teammate', {
      method: 'POST',
      body: JSON.stringify({
        user: id,
        name: input.name,
        role: input.role,
        password: input.password,
        erpnext_role: input.role ? erpnextRoleFor(input.role) : undefined,
      }),
    })
    if (custom.ok && custom.data) {
      return { ok: true, data: custom.data }
    }

    const res = await frappeFetch<Record<string, unknown>>(`/api/resource/User/${userName}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      return { ok: false, error: res.error || custom.error || 'ERPNext could not update this user.' }
    }

    const fresh = await frappeFetch<{
      name?: string
      email?: string
      full_name?: string
      first_name?: string
      roles?: { role?: string }[]
    }>(`/api/resource/User/${userName}`)
    if (fresh.ok && fresh.data) {
      return { ok: true, data: mapFrappeUserRecord(fresh.data) }
    }
    return {
      ok: true,
      data: {
        id,
        email: id,
        name: input.name || id,
        role: input.role || 'sales_rep',
        organizationId: 'org_workspace',
        isDemo: false,
      },
    }
  }

  async deleteUser(id: string): Promise<ApiResult<void>> {
    const custom = await frappeFetch<void>('/api/method/adadiko_hub.api.delete_teammate', {
      method: 'POST',
      body: JSON.stringify({ user: id }),
    })
    if (custom.ok) {
      return { ok: true, data: undefined }
    }

    const res = await frappeFetch<void>(`/api/resource/User/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (res.ok) return { ok: true, data: undefined }

    const disable = await frappeFetch(`/api/resource/User/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled: 0 }),
    })
    if (disable.ok) return { ok: true, data: undefined }
    return { ok: false, error: res.error || custom.error || 'ERPNext could not remove this user.' }
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
