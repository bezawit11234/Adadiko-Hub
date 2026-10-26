/**
 * Adadiko Hub Frappe HTTP Helper
 * Handles REST/RPC calls to ERPNext / Frappe v16 backend.
 * Provides credentials handling, CSRF token attachment, {message}/{data} unwrapping,
 * multi-tenant X-Frappe-Site-Name header dispatching, and comprehensive error parsing.
 */

import type { ApiResult } from '@/types'

const STORAGE_KEY_SITE = 'adadiko_current_site'
const STORAGE_KEY_SLUG = 'adadiko_current_slug'
const STORAGE_KEY_CSRF = 'adadiko_csrf_token'

let cachedCsrfToken: string | null = null

export function getStoredSiteName(): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY_SITE)
  }
  return null
}

export function setStoredSiteName(site: string | null): void {
  if (typeof localStorage !== 'undefined') {
    if (site) {
      localStorage.setItem(STORAGE_KEY_SITE, site.trim().toLowerCase())
    } else {
      localStorage.removeItem(STORAGE_KEY_SITE)
    }
  }
}

export function getStoredSlug(): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY_SLUG)
  }
  return null
}

export function setStoredSlug(slug: string | null): void {
  if (typeof localStorage !== 'undefined') {
    if (slug) {
      localStorage.setItem(STORAGE_KEY_SLUG, slug.trim().toLowerCase())
    } else {
      localStorage.removeItem(STORAGE_KEY_SLUG)
    }
  }
}

export function clearStoredSite(): void {
  setStoredSiteName(null)
  setStoredSlug(null)
  setCsrfToken(null)
}

export function setCsrfToken(token: string | null): void {
  cachedCsrfToken = token
  if (typeof sessionStorage !== 'undefined') {
    if (token) {
      sessionStorage.setItem(STORAGE_KEY_CSRF, token)
    } else {
      sessionStorage.removeItem(STORAGE_KEY_CSRF)
    }
  }
}

export function getCsrfToken(): string | null {
  if (cachedCsrfToken) return cachedCsrfToken

  if (typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem(STORAGE_KEY_CSRF)
    if (stored) {
      cachedCsrfToken = stored
      return cachedCsrfToken
    }
  }

  // Try extracting from document cookies if running in browser
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)(?:frappe\.csrf_token|csrf_token)=([^;]+)/)
    if (match && match[1]) {
      cachedCsrfToken = decodeURIComponent(match[1])
      return cachedCsrfToken
    }
  }

  return null
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export function extractFrappeErrorMessage(json: any, fallbackStatus = 'Request failed'): string {
  if (!json) return fallbackStatus

  // 1. Check _server_messages
  if (json._server_messages) {
    try {
      const parsedOuter = typeof json._server_messages === 'string'
        ? JSON.parse(json._server_messages)
        : json._server_messages

      if (Array.isArray(parsedOuter) && parsedOuter.length > 0) {
        const first = parsedOuter[0]
        const parsedInner = typeof first === 'string' ? JSON.parse(first) : first
        if (parsedInner?.message) {
          const msg = stripHtml(parsedInner.message)
          if (msg.includes('Site') && msg.includes('does not exist')) {
            return 'Workspace not found. Please verify your workspace address.'
          }
          return msg
        }
      }
    } catch {
      // ignore parse error and proceed to fallbacks
    }
  }

  // 2. Check _error_message
  if (json._error_message) {
    const msg = stripHtml(json._error_message)
    if (msg.includes('Site') && msg.includes('does not exist')) {
      return 'Workspace not found. Please verify your workspace address.'
    }
    return msg
  }

  // 3. Check message property if it's an error string
  if (typeof json.message === 'string') {
    const msg = stripHtml(json.message)
    if (msg.toLowerCase().includes('invalid login credentials')) {
      return 'Incorrect email or password. Please verify your credentials.'
    }
    if (msg.includes('Site') && msg.includes('does not exist')) {
      return 'Workspace not found. Please verify your workspace address.'
    }
    if (json.exc_type) return msg
  }

  // 4. Check exception string
  if (typeof json.exception === 'string') {
    const exc = json.exception
    if (exc.includes('DoesNotExistError') && exc.includes('Site')) {
      return 'Workspace not found. Please verify your workspace address.'
    }
    if (exc.includes('AuthenticationError')) {
      return 'Incorrect email or password. Please verify your credentials.'
    }
    const parts = exc.split(':')
    return parts.length > 1 ? parts.slice(1).join(':').trim() : parts[0]
  }

  return fallbackStatus
}

export async function frappeFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  try {
    const method = (options.method || 'GET').toUpperCase()
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    }

    if (method !== 'GET' && method !== 'HEAD' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    // Dynamic Multi-Tenant Site Routing:
    // request_workspace, get_workspace_status, and retry_workspace target control.localhost.
    // All other tenant operations target the company's dedicated site stored in local storage.
    const isControlEndpoint =
      path.includes('request_workspace') ||
      path.includes('get_workspace_status') ||
      path.includes('retry_workspace')

    if (!headers['X-Frappe-Site-Name']) {
      if (isControlEndpoint) {
        headers['X-Frappe-Site-Name'] = 'control.localhost'
      } else {
        const storedSite = getStoredSiteName()
        headers['X-Frappe-Site-Name'] = storedSite || 'control.localhost'
      }
    }

    // Attach CSRF token on state-changing requests
    const csrf = getCsrfToken()
    if (csrf && method !== 'GET' && method !== 'HEAD' && !headers['X-Frappe-CSRF-Token']) {
      headers['X-Frappe-CSRF-Token'] = csrf
    }

    const res = await fetch(path, {
      ...options,
      method,
      headers,
      credentials: 'include',
    })

    const text = await res.text()
    let json: any = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      // not JSON
    }

    if (!res.ok) {
      const errorMsg = json
        ? extractFrappeErrorMessage(json, `HTTP ${res.status}: ${res.statusText}`)
        : `HTTP ${res.status}: ${res.statusText}`
      return { ok: false, error: errorMsg }
    }

    if (!json) {
      return { ok: true, data: undefined as unknown as T }
    }

    // Update CSRF token if returned in message or session payload
    if (json.message?.csrf_token) {
      setCsrfToken(json.message.csrf_token)
    }

    // Unpack Frappe message or resource data
    if ('message' in json) {
      return { ok: true, data: json.message as T }
    }
    if ('data' in json) {
      return { ok: true, data: json.data as T }
    }

    return { ok: true, data: json as T }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Network connection failed. Please ensure the server is running.',
    }
  }
}
