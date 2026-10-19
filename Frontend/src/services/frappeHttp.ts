/**
 * Adadiko Hub Frappe HTTP Helper
 * Handles REST/RPC calls to ERPNext / Frappe v16 backend.
 * Provides credentials handling, CSRF token attachment, {message}/{data} unwrapping,
 * and comprehensive ERPNext error parsing from _server_messages.
 */

import type { ApiResult } from '@/types'

let cachedCsrfToken: string | null = null

export function setCsrfToken(token: string | null): void {
  cachedCsrfToken = token
}

export function getCsrfToken(): string | null {
  if (cachedCsrfToken) return cachedCsrfToken

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
          return stripHtml(parsedInner.message)
        }
      }
    } catch {
      // ignore parse error and proceed to fallbacks
    }
  }

  // 2. Check _error_message
  if (json._error_message) {
    return stripHtml(json._error_message)
  }

  // 3. Check message property if it's an error string
  if (typeof json.message === 'string' && json.exc_type) {
    return stripHtml(json.message)
  }

  // 4. Check exception string
  if (typeof json.exception === 'string') {
    const parts = json.exception.split(':')
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

    // Attach CSRF token on state-changing requests
    const csrf = getCsrfToken()
    if (csrf && method !== 'GET' && method !== 'HEAD') {
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
