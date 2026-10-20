/**
 * Adadiko Dashboard — Admin Service Interface and Implementations
 *
 * All screens interact with client organization and platform data exclusively through AdminApi.
 */

import type {
  ClientCompany,
  ModuleItem,
  Order,
  Subscription,
  LogEntry,
  StaffUser,
  AdminOverview,
  Plan,
  ApiResult,
} from '@/types'
import {
  INITIAL_CLIENTS,
  INITIAL_MODULES,
  INITIAL_ORDERS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_LOGS,
  INITIAL_STAFF,
  INITIAL_OVERVIEW,
  PLAN_DEFINITIONS,
} from '@/data/mockAdmin'
import { frappeRequest } from './frappeHttp'

export interface AdminApi {
  listClients(filter?: { status?: string; search?: string }): Promise<ApiResult<ClientCompany[]>>
  getClient(id: string): Promise<ApiResult<ClientCompany>>
  updateClientPlan(id: string, plan: Plan, modules: string[]): Promise<ApiResult<ClientCompany>>
  setClientStatus(id: string, status: 'active' | 'suspended'): Promise<ApiResult<ClientCompany>>
  addClientNote(id: string, note: string): Promise<ApiResult<ClientCompany>>
  listOrders(filter?: { status?: string; clientCompanyId?: string; search?: string }): Promise<ApiResult<Order[]>>
  listSubscriptions(filter?: { status?: string; search?: string }): Promise<ApiResult<Subscription[]>>
  renewSubscription(id: string, extensionMonths: number): Promise<ApiResult<Subscription>>
  listCatalog(): Promise<ApiResult<ModuleItem[]>>
  updateModulePrice(key: string, monthlyPrice: number, yearlyPrice: number): Promise<ApiResult<ModuleItem>>
  listLogs(filter?: { type?: string; staffUserId?: string; search?: string }): Promise<ApiResult<LogEntry[]>>
  getOverview(): Promise<ApiResult<AdminOverview>>
  listStaff(): Promise<ApiResult<StaffUser[]>>
  inviteStaff(staff: Omit<StaffUser, 'id' | 'isDemo'>): Promise<ApiResult<StaffUser>>
}

// Simulated network delay helper
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * MockAdminApi — In-memory reactive state for development and manager demos
 */
export class MockAdminApi implements AdminApi {
  private clients: ClientCompany[] = JSON.parse(JSON.stringify(INITIAL_CLIENTS))
  private modules: ModuleItem[] = JSON.parse(JSON.stringify(INITIAL_MODULES))
  private orders: Order[] = JSON.parse(JSON.stringify(INITIAL_ORDERS))
  private subscriptions: Subscription[] = JSON.parse(JSON.stringify(INITIAL_SUBSCRIPTIONS))
  private logs: LogEntry[] = JSON.parse(JSON.stringify(INITIAL_LOGS))
  private staff: StaffUser[] = JSON.parse(JSON.stringify(INITIAL_STAFF))
  private overview: AdminOverview = JSON.parse(JSON.stringify(INITIAL_OVERVIEW))

  async listClients(filter?: { status?: string; search?: string }): Promise<ApiResult<ClientCompany[]>> {
    await delay()
    let result = [...this.clients]
    if (filter?.status && filter.status !== 'all') {
      result = result.filter((c) => c.status === filter.status)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.contactName.toLowerCase().includes(q) ||
          c.contactEmail.toLowerCase().includes(q) ||
          c.siteName.toLowerCase().includes(q)
      )
    }
    return { ok: true, data: result }
  }

  async getClient(id: string): Promise<ApiResult<ClientCompany>> {
    await delay()
    const client = this.clients.find((c) => c.id === id)
    if (!client) {
      return { ok: false, error: `Client company with ID '${id}' not found.` }
    }
    return { ok: true, data: JSON.parse(JSON.stringify(client)) }
  }

  async updateClientPlan(id: string, plan: Plan, modules: string[]): Promise<ApiResult<ClientCompany>> {
    await delay()
    const client = this.clients.find((c) => c.id === id)
    if (!client) {
      return { ok: false, error: 'Client not found.' }
    }

    const planDef = PLAN_DEFINITIONS[plan]
    // Calculate new monthly spend
    let spend = planDef ? planDef.baseMonthlyPrice : 49
    modules.forEach((modKey) => {
      const mod = this.modules.find((m) => m.key === modKey)
      if (mod && !mod.isCore) {
        spend += mod.monthlyPrice
      }
    })

    client.plan = plan
    client.modules = [...modules]
    client.monthlySpend = spend

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16)
    const logItem = {
      id: `act_${Date.now()}`,
      timestamp,
      text: `Plan updated to ${plan.toUpperCase()} with ${modules.length} active modules.`,
      staffName: 'Elena Rostova (Admin)',
    }
    if (!client.activityLog) client.activityLog = []
    client.activityLog.unshift(logItem)

    // Also push to platform logs
    this.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'plan_change',
      clientCompanyId: client.id,
      clientCompanyName: client.name,
      staffUserId: 'staff_adm_1',
      staffUserName: 'Elena Rostova',
      details: `Plan upgraded/modified to ${plan.toUpperCase()} ($${spend}/mo).`,
    })

    this.recalculateOverview()
    return { ok: true, data: JSON.parse(JSON.stringify(client)) }
  }

  async setClientStatus(id: string, status: 'active' | 'suspended'): Promise<ApiResult<ClientCompany>> {
    await delay()
    const client = this.clients.find((c) => c.id === id)
    if (!client) {
      return { ok: false, error: 'Client not found.' }
    }
    client.status = status

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16)
    const logItem = {
      id: `act_${Date.now()}`,
      timestamp,
      text: `Tenant workspace status changed to ${status.toUpperCase()}.`,
      staffName: 'Elena Rostova (Admin)',
    }
    if (!client.activityLog) client.activityLog = []
    client.activityLog.unshift(logItem)

    this.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'suspension',
      clientCompanyId: client.id,
      clientCompanyName: client.name,
      staffUserId: 'staff_adm_1',
      staffUserName: 'Elena Rostova',
      details: `Tenant workspace ${client.siteName} changed to status: ${status}.`,
    })

    this.recalculateOverview()
    return { ok: true, data: JSON.parse(JSON.stringify(client)) }
  }

  async addClientNote(id: string, note: string): Promise<ApiResult<ClientCompany>> {
    await delay()
    const client = this.clients.find((c) => c.id === id)
    if (!client) {
      return { ok: false, error: 'Client not found.' }
    }
    if (!client.notes) client.notes = []
    client.notes.unshift(note)

    this.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'staff_action',
      clientCompanyId: client.id,
      clientCompanyName: client.name,
      staffUserId: 'staff_sup_1',
      staffUserName: 'Staff Member',
      details: `Appended internal note to ${client.name}.`,
    })

    return { ok: true, data: JSON.parse(JSON.stringify(client)) }
  }

  async listOrders(filter?: { status?: string; clientCompanyId?: string; search?: string }): Promise<ApiResult<Order[]>> {
    await delay()
    let result = [...this.orders]
    if (filter?.status && filter.status !== 'all') {
      result = result.filter((o) => o.status === filter.status)
    }
    if (filter?.clientCompanyId) {
      result = result.filter((o) => o.clientCompanyId === filter.clientCompanyId)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.clientCompanyName.toLowerCase().includes(q) ||
          o.invoiceRef.toLowerCase().includes(q)
      )
    }
    return { ok: true, data: result }
  }

  async listSubscriptions(filter?: { status?: string; search?: string }): Promise<ApiResult<Subscription[]>> {
    await delay()
    let result = [...this.subscriptions]
    if (filter?.status && filter.status !== 'all') {
      result = result.filter((s) => s.status === filter.status)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      result = result.filter((s) => s.clientCompanyName.toLowerCase().includes(q))
    }
    return { ok: true, data: result }
  }

  async renewSubscription(id: string, extensionMonths: number): Promise<ApiResult<Subscription>> {
    await delay()
    const sub = this.subscriptions.find((s) => s.id === id)
    if (!sub) {
      return { ok: false, error: 'Subscription record not found.' }
    }

    const currentExpiry = new Date(sub.renewalDate)
    const newExpiry = new Date(currentExpiry.setMonth(currentExpiry.getMonth() + extensionMonths))
    sub.renewalDate = newExpiry.toISOString().substring(0, 10)
    sub.status = 'active'

    // Also update client company renewalDate
    const client = this.clients.find((c) => c.id === sub.clientCompanyId)
    if (client) {
      client.renewalDate = sub.renewalDate
      if (client.status === 'suspended') {
        client.status = 'active'
      }
    }

    this.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'staff_action',
      clientCompanyId: sub.clientCompanyId,
      clientCompanyName: sub.clientCompanyName,
      staffUserId: 'staff_bil_1',
      staffUserName: 'Fiona Gallagher',
      details: `Renewed subscription for ${extensionMonths} months. New expiration: ${sub.renewalDate}.`,
    })

    this.recalculateOverview()
    return { ok: true, data: JSON.parse(JSON.stringify(sub)) }
  }

  async listCatalog(): Promise<ApiResult<ModuleItem[]>> {
    await delay()
    return { ok: true, data: JSON.parse(JSON.stringify(this.modules)) }
  }

  async updateModulePrice(key: string, monthlyPrice: number, yearlyPrice: number): Promise<ApiResult<ModuleItem>> {
    await delay()
    const mod = this.modules.find((m) => m.key === key)
    if (!mod) {
      return { ok: false, error: `Module '${key}' not found in catalog.` }
    }
    mod.monthlyPrice = monthlyPrice
    mod.yearlyPrice = yearlyPrice

    this.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'staff_action',
      staffUserId: 'staff_adm_1',
      staffUserName: 'Elena Rostova',
      details: `Updated catalog price for '${mod.name}': $${monthlyPrice}/mo, $${yearlyPrice}/yr.`,
    })

    return { ok: true, data: JSON.parse(JSON.stringify(mod)) }
  }

  async listLogs(filter?: { type?: string; staffUserId?: string; search?: string }): Promise<ApiResult<LogEntry[]>> {
    await delay()
    let result = [...this.logs]
    if (filter?.type && filter.type !== 'all') {
      result = result.filter((l) => l.type === filter.type)
    }
    if (filter?.staffUserId) {
      result = result.filter((l) => l.staffUserId === filter.staffUserId)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      result = result.filter(
        (l) =>
          l.details.toLowerCase().includes(q) ||
          l.staffUserName.toLowerCase().includes(q) ||
          (l.clientCompanyName && l.clientCompanyName.toLowerCase().includes(q))
      )
    }
    return { ok: true, data: result }
  }

  async getOverview(): Promise<ApiResult<AdminOverview>> {
    await delay()
    this.recalculateOverview()
    return { ok: true, data: JSON.parse(JSON.stringify(this.overview)) }
  }

  async listStaff(): Promise<ApiResult<StaffUser[]>> {
    await delay()
    return { ok: true, data: JSON.parse(JSON.stringify(this.staff)) }
  }

  async inviteStaff(staffData: Omit<StaffUser, 'id' | 'isDemo'>): Promise<ApiResult<StaffUser>> {
    await delay()
    const newStaff: StaffUser = {
      ...staffData,
      id: `staff_${Date.now()}`,
      isDemo: false,
      lastActive: 'Invited',
      createdDate: new Date().toISOString().substring(0, 10),
    }
    this.staff.push(newStaff)

    this.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'staff_action',
      staffUserId: 'staff_adm_1',
      staffUserName: 'Elena Rostova',
      details: `Invited new staff member: ${newStaff.name} (${newStaff.email}) with role: ${newStaff.role}.`,
    })

    return { ok: true, data: newStaff }
  }

  private recalculateOverview(): void {
    const active = this.clients.filter((c) => c.status === 'active').length
    const trial = this.clients.filter((c) => c.status === 'trial').length
    const mrr = this.clients
      .filter((c) => c.status === 'active')
      .reduce((acc, c) => acc + (c.monthlySpend || 0), 0)

    const totalClients = this.clients.length || 1
    const plans: Plan[] = ['starter', 'growth', 'enterprise']
    const clientsByPlan = plans.map((p) => {
      const count = this.clients.filter((c) => c.plan === p).length
      return {
        plan: p,
        count,
        percentage: Math.round((count / totalClients) * 100),
      }
    })

    this.overview.activeClients = active
    this.overview.trialClients = trial
    this.overview.mrr = mrr
    this.overview.clientsByPlan = clientsByPlan
  }
}

/**
 * FrappeAdminApi — Real ERPNext Control Site integration stub
 *
 * Implements the same AdminApi interface against Frappe REST and whitelisted methods.
 * Note: Control site DocTypes are managed on the central Frappe instance.
 */
export class FrappeAdminApi implements AdminApi {
  async listClients(_filter?: { status?: string; search?: string }): Promise<ApiResult<ClientCompany[]>> {
    // TODO: Call ERPNext Control Site DocType: "Client Company"
    // GET /api/resource/Client Company?fields=["name","company_name","contact_name","contact_email","plan","modules","status","user_count","start_date","renewal_date","site_name","monthly_spend"]
    try {
      const res = await frappeRequest<any[]>('/api/method/adadiko_hub.admin.list_clients')
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to fetch client companies from Frappe control site.' }
    }
  }

  async getClient(id: string): Promise<ApiResult<ClientCompany>> {
    // TODO: Call ERPNext Control Site GET /api/resource/Client Company/{id}
    try {
      const res = await frappeRequest<any>(`/api/method/adadiko_hub.admin.get_client?id=${encodeURIComponent(id)}`)
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || `Failed to fetch client '${id}' from Frappe.` }
    }
  }

  async updateClientPlan(id: string, plan: Plan, modules: string[]): Promise<ApiResult<ClientCompany>> {
    // TODO: Call ERPNext Control Site POST /api/method/adadiko_hub.admin.update_client_plan
    try {
      const res = await frappeRequest<any>('/api/method/adadiko_hub.admin.update_client_plan', {
        method: 'POST',
        body: JSON.stringify({ client_id: id, plan, modules }),
      })
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to update client plan on Frappe.' }
    }
  }

  async setClientStatus(id: string, status: 'active' | 'suspended'): Promise<ApiResult<ClientCompany>> {
    // TODO: Call ERPNext Control Site POST /api/method/adadiko_hub.admin.set_client_status
    try {
      const res = await frappeRequest<any>('/api/method/adadiko_hub.admin.set_client_status', {
        method: 'POST',
        body: JSON.stringify({ client_id: id, status }),
      })
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to update client status on Frappe.' }
    }
  }

  async addClientNote(id: string, note: string): Promise<ApiResult<ClientCompany>> {
    // TODO: Call ERPNext Control Site POST /api/method/adadiko_hub.admin.add_client_note
    try {
      const res = await frappeRequest<any>('/api/method/adadiko_hub.admin.add_client_note', {
        method: 'POST',
        body: JSON.stringify({ client_id: id, note }),
      })
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to add client note on Frappe.' }
    }
  }

  async listOrders(_filter?: { status?: string; clientCompanyId?: string; search?: string }): Promise<ApiResult<Order[]>> {
    // TODO: Call ERPNext Control Site DocType: "Client Order"
    try {
      const res = await frappeRequest<any[]>('/api/method/adadiko_hub.admin.list_orders')
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to list orders from Frappe.' }
    }
  }

  async listSubscriptions(_filter?: { status?: string; search?: string }): Promise<ApiResult<Subscription[]>> {
    // TODO: Call ERPNext Control Site DocType: "Client Subscription"
    try {
      const res = await frappeRequest<any[]>('/api/method/adadiko_hub.admin.list_subscriptions')
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to list subscriptions from Frappe.' }
    }
  }

  async renewSubscription(id: string, extensionMonths: number): Promise<ApiResult<Subscription>> {
    // TODO: Call ERPNext Control Site POST /api/method/adadiko_hub.admin.renew_subscription
    try {
      const res = await frappeRequest<any>('/api/method/adadiko_hub.admin.renew_subscription', {
        method: 'POST',
        body: JSON.stringify({ subscription_id: id, extension_months: extensionMonths }),
      })
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to renew subscription on Frappe.' }
    }
  }

  async listCatalog(): Promise<ApiResult<ModuleItem[]>> {
    // TODO: Call ERPNext Control Site DocType: "Module Item"
    try {
      const res = await frappeRequest<any[]>('/api/method/adadiko_hub.admin.list_catalog')
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to list catalog from Frappe.' }
    }
  }

  async updateModulePrice(key: string, monthlyPrice: number, yearlyPrice: number): Promise<ApiResult<ModuleItem>> {
    // TODO: Call ERPNext Control Site POST /api/method/adadiko_hub.admin.update_module_price
    try {
      const res = await frappeRequest<any>('/api/method/adadiko_hub.admin.update_module_price', {
        method: 'POST',
        body: JSON.stringify({ module_key: key, monthly_price: monthlyPrice, yearly_price: yearlyPrice }),
      })
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to update module price on Frappe.' }
    }
  }

  async listLogs(_filter?: { type?: string; staffUserId?: string; search?: string }): Promise<ApiResult<LogEntry[]>> {
    // TODO: Call ERPNext Control Site DocType: "Activity Log"
    try {
      const res = await frappeRequest<any[]>('/api/method/adadiko_hub.admin.list_logs')
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to list logs from Frappe.' }
    }
  }

  async getOverview(): Promise<ApiResult<AdminOverview>> {
    // TODO: Call ERPNext Control Site GET /api/method/adadiko_hub.admin.get_overview
    try {
      const res = await frappeRequest<any>('/api/method/adadiko_hub.admin.get_overview')
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to get overview from Frappe.' }
    }
  }

  async listStaff(): Promise<ApiResult<StaffUser[]>> {
    // TODO: Call ERPNext Control Site GET /api/method/adadiko_hub.admin.list_staff
    try {
      const res = await frappeRequest<any[]>('/api/method/adadiko_hub.admin.list_staff')
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to list staff from Frappe.' }
    }
  }

  async inviteStaff(staff: Omit<StaffUser, 'id' | 'isDemo'>): Promise<ApiResult<StaffUser>> {
    // TODO: Call ERPNext Control Site POST /api/method/adadiko_hub.admin.invite_staff
    try {
      const res = await frappeRequest<any>('/api/method/adadiko_hub.admin.invite_staff', {
        method: 'POST',
        body: JSON.stringify(staff),
      })
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to invite staff on Frappe.' }
    }
  }
}

// Global singletons
const mockInstance = new MockAdminApi()
const frappeInstance = new FrappeAdminApi()

export function getAdminApi(overrideMode?: 'mock' | 'frappe'): AdminApi {
  const envMode = (import.meta.env.VITE_API_MODE as string) || 'mock'
  const mode = overrideMode || (typeof window !== 'undefined' && (window as any).__ADADIKO_API_MODE) || envMode
  return mode === 'frappe' ? frappeInstance : mockInstance
}
