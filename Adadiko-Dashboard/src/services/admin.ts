/**
 * Adadiko Dashboard — Admin Service Interface and Implementation
 *
 * Interacts exclusively with the live Adadiko Hub control backend.
 */

import type {
  ClientCompany,
  ModuleItem,
  Order,
  Subscription,
  LogEntry,
  StaffUser,
  StaffRole,
  AdminOverview,
  Plan,
  ApiResult,
} from '@/types'
import { platformRequest } from './platformHttp'

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
  inviteStaff(staff: Omit<StaffUser, 'id'>): Promise<ApiResult<StaffUser>>
  updateStaff(email: string, full_name: string, role: StaffRole): Promise<ApiResult<StaffUser>>
  deleteStaff(email: string): Promise<ApiResult<{ success: boolean; email: string }>>
}

export class PlatformAdminApi implements AdminApi {
  async listClients(filter?: { status?: string; search?: string }): Promise<ApiResult<ClientCompany[]>> {
    try {
      const params = new URLSearchParams()
      if (filter?.status) params.set('status', filter.status)
      if (filter?.search) params.set('search', filter.search)
      const qs = params.toString() ? `?${params.toString()}` : ''
      const res = await platformRequest<ClientCompany[]>(`/api/method/adadiko_hub.admin_api.list_clients${qs}`)
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to fetch client companies.' }
    }
  }

  async getClient(id: string): Promise<ApiResult<ClientCompany>> {
    try {
      const res = await platformRequest<ClientCompany>(`/api/method/adadiko_hub.admin_api.get_client?slug=${encodeURIComponent(id)}`)
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || `Failed to fetch client '${id}'.` }
    }
  }

  async updateClientPlan(id: string, plan: Plan, _modules: string[]): Promise<ApiResult<ClientCompany>> {
    try {
      const res = await platformRequest<ClientCompany>('/api/method/adadiko_hub.admin_api.change_plan', {
        method: 'POST',
        body: JSON.stringify({ slug: id, plan }),
      })
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to update client plan.' }
    }
  }

  async setClientStatus(id: string, status: 'active' | 'suspended'): Promise<ApiResult<ClientCompany>> {
    try {
      const method = status === 'suspended' ? 'suspend_client' : 'reactivate_client'
      const body = status === 'suspended' ? { slug: id, reason: 'Administrative suspension' } : { slug: id }
      const res = await platformRequest<ClientCompany>(`/api/method/adadiko_hub.admin_api.${method}`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to update client status.' }
    }
  }

  async addClientNote(id: string, note: string): Promise<ApiResult<ClientCompany>> {
    try {
      const res = await platformRequest<ClientCompany>('/api/method/adadiko_hub.admin_api.add_client_note', {
        method: 'POST',
        body: JSON.stringify({ slug: id, note }),
      })
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to add client note.' }
    }
  }

  async listOrders(filter?: { status?: string; clientCompanyId?: string; search?: string }): Promise<ApiResult<Order[]>> {
    try {
      const params = new URLSearchParams()
      if (filter?.status) params.set('status', filter.status)
      if (filter?.clientCompanyId) params.set('client_company', filter.clientCompanyId)
      if (filter?.search) params.set('search', filter.search)
      const qs = params.toString() ? `?${params.toString()}` : ''
      const res = await platformRequest<Order[]>(`/api/method/adadiko_hub.admin_api.list_orders${qs}`)
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to list orders.' }
    }
  }

  async listSubscriptions(filter?: { status?: string; search?: string }): Promise<ApiResult<Subscription[]>> {
    try {
      const params = new URLSearchParams()
      if (filter?.status) params.set('status', filter.status)
      if (filter?.search) params.set('search', filter.search)
      const qs = params.toString() ? `?${params.toString()}` : ''
      const res = await platformRequest<Subscription[]>(`/api/method/adadiko_hub.admin_api.list_subscriptions${qs}`)
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to list subscriptions.' }
    }
  }

  async renewSubscription(id: string, extensionMonths: number): Promise<ApiResult<Subscription>> {
    try {
      const res = await platformRequest<Subscription>('/api/method/adadiko_hub.admin_api.renew_subscription', {
        method: 'POST',
        body: JSON.stringify({ slug: id, months: extensionMonths }),
      })
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to renew subscription.' }
    }
  }

  async listCatalog(): Promise<ApiResult<ModuleItem[]>> {
    try {
      const res = await platformRequest<ModuleItem[]>('/api/method/adadiko_hub.admin_api.list_catalog')
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to list catalog.' }
    }
  }

  async updateModulePrice(key: string, monthlyPrice: number, _yearlyPrice: number): Promise<ApiResult<ModuleItem>> {
    try {
      const res = await platformRequest<any>('/api/method/adadiko_hub.admin_api.update_plan_price', {
        method: 'POST',
        body: JSON.stringify({ plan: key, price: monthlyPrice }),
      })
      return {
        ok: true,
        data: {
          key,
          name: res.plan || key,
          description: '',
          monthlyPrice: res.price,
          yearlyPrice: res.price * 10,
          category: 'package',
          isActive: true,
        },
      }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to update module price.' }
    }
  }

  async listLogs(filter?: { type?: string; staffUserId?: string; search?: string }): Promise<ApiResult<LogEntry[]>> {
    try {
      const params = new URLSearchParams()
      if (filter?.type && filter.type !== 'all') params.set('action', filter.type)
      if (filter?.staffUserId) params.set('staff', filter.staffUserId)
      if (filter?.search) params.set('client', filter.search)
      const qs = params.toString() ? `?${params.toString()}` : ''
      const res = await platformRequest<LogEntry[]>(`/api/method/adadiko_hub.admin_api.list_logs${qs}`)
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to list logs.' }
    }
  }

  async getOverview(): Promise<ApiResult<AdminOverview>> {
    try {
      const res = await platformRequest<AdminOverview>('/api/method/adadiko_hub.admin_api.get_overview')
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to get overview.' }
    }
  }

  async listStaff(): Promise<ApiResult<StaffUser[]>> {
    try {
      const res = await platformRequest<StaffUser[]>('/api/method/adadiko_hub.admin_api.list_staff')
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to list staff.' }
    }
  }

  async inviteStaff(staff: Omit<StaffUser, 'id'>): Promise<ApiResult<StaffUser>> {
    try {
      const res = await platformRequest<any>('/api/method/adadiko_hub.admin_api.invite_staff', {
        method: 'POST',
        body: JSON.stringify({
          email: staff.email,
          full_name: staff.name,
          role: staff.role,
        }),
      })
      return {
        ok: true,
        data: {
          id: res.id,
          email: res.email,
          name: res.name,
          role: res.role,
          createdDate: new Date().toISOString().substring(0, 10),
          lastActive: 'Invited',
          temp_password: res.temp_password,
        },
      }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to invite staff.' }
    }
  }

  async updateStaff(email: string, full_name: string, role: StaffRole): Promise<ApiResult<StaffUser>> {
    try {
      const res = await platformRequest<any>('/api/method/adadiko_hub.admin_api.update_staff', {
        method: 'POST',
        body: JSON.stringify({
          email,
          full_name,
          role,
        }),
      })
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to update staff member.' }
    }
  }

  async deleteStaff(email: string): Promise<ApiResult<{ success: boolean; email: string }>> {
    try {
      const res = await platformRequest<any>('/api/method/adadiko_hub.admin_api.delete_staff', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      return { ok: true, data: res }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to delete staff member.' }
    }
  }
}

const adminInstance = new PlatformAdminApi()

export function getAdminApi(): AdminApi {
  return adminInstance
}
