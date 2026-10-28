/**
 * Workspace Provisioning & Multi-Tenant Management Service
 * Talks to control.localhost to register client companies and poll provisioning status.
 */

import { frappeFetch, setStoredSiteName, setStoredSlug } from './frappeHttp'
import type { ApiResult } from '@/types'

export interface WorkspaceStatus {
  status: 'Pending' | 'Provisioning' | 'Ready' | 'Failed' | 'Suspended'
  site_name: string
  message: string
}

export async function requestWorkspace(params: {
  company_name: string
  slug: string
  contact_name: string
  email: string
  password: string
  modules: string[]
}): Promise<ApiResult<{ id: string; slug: string; status: string }>> {
  const mode = localStorage.getItem('adadiko_api_mode') || import.meta.env.VITE_API_MODE
  if (mode === 'mock') {
    setStoredSlug(params.slug)
    setStoredSiteName(`${params.slug}.localhost`)
    return {
      ok: true,
      data: {
        id: params.slug,
        slug: params.slug,
        status: 'Ready',
      },
    }
  }

  const res = await frappeFetch<{ id: string; slug: string; status: string }>(
    '/api/method/adadiko_hub.api.request_workspace',
    {
      method: 'POST',
      headers: {
        'X-Frappe-Site-Name': 'control.localhost',
      },
      body: JSON.stringify(params),
    }
  )

  if (res.ok && res.data?.slug) {
    setStoredSlug(res.data.slug)
  }

  return res
}

export async function getWorkspaceStatus(slug: string): Promise<ApiResult<WorkspaceStatus>> {
  const mode = localStorage.getItem('adadiko_api_mode') || import.meta.env.VITE_API_MODE
  if (mode === 'mock') {
    return {
      ok: true,
      data: {
        status: 'Ready',
        site_name: `${slug}.localhost`,
        message: '',
      },
    }
  }

  return frappeFetch<WorkspaceStatus>(
    `/api/method/adadiko_hub.api.get_workspace_status?slug=${encodeURIComponent(slug)}`,
    {
      method: 'GET',
      headers: {
        'X-Frappe-Site-Name': 'control.localhost',
      },
    }
  )
}

export async function retryWorkspace(slug: string): Promise<ApiResult<{ status: string; slug: string }>> {
  const mode = localStorage.getItem('adadiko_api_mode') || import.meta.env.VITE_API_MODE
  if (mode === 'mock') {
    return {
      ok: true,
      data: {
        status: 'Provisioning',
        slug,
      },
    }
  }

  return frappeFetch<{ status: string; slug: string }>(
    '/api/method/adadiko_hub.api.retry_workspace',
    {
      method: 'POST',
      headers: {
        'X-Frappe-Site-Name': 'control.localhost',
      },
      body: JSON.stringify({ slug }),
    }
  )
}
