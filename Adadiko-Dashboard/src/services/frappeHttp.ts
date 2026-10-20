/**
 * Adadiko Dashboard — Frappe HTTP Client
 *
 * Handles authenticated API calls to Frappe ERPNext control site.
 * Reads CSRF token from cookies, proxies through Vite to port 8000.
 */

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()!.split(';').shift() || '')
  }
  return null
}

export interface FrappeResponse<T = any> {
  message?: T
  exc?: string
  _server_messages?: string
}

export class FrappeHttpError extends Error {
  status: number
  serverMessages?: string[]

  constructor(message: string, status: number, serverMessages?: string[]) {
    super(message)
    this.name = 'FrappeHttpError'
    this.status = status
    this.serverMessages = serverMessages
  }
}

export async function frappeRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {})
  
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  // Set CSRF token for mutating requests if available
  const method = (options.method || 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') {
    const csrfToken = getCookie('csrf_token')
    if (csrfToken && !headers.has('X-Frappe-CSRF-Token')) {
      headers.set('X-Frappe-CSRF-Token', csrfToken)
    }
    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json')
    }
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include', // sends cookies
  })

  let body: any
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`
    let serverMessages: string[] | undefined

    if (body?._server_messages) {
      try {
        const parsed = JSON.parse(body._server_messages)
        if (Array.isArray(parsed)) {
          serverMessages = parsed.map((m: any) => {
            try {
              const msgObj = JSON.parse(m)
              return msgObj.message || m
            } catch {
              return m
            }
          })
          errorMsg = serverMessages.join('; ')
        }
      } catch {
        // fallback
      }
    } else if (body?.exc) {
      errorMsg = body.exc.split('\n').pop() || errorMsg
    } else if (body?.message) {
      errorMsg = typeof body.message === 'string' ? body.message : JSON.stringify(body.message)
    }

    throw new FrappeHttpError(errorMsg, response.status, serverMessages)
  }

  return (body?.message !== undefined ? body.message : body) as T
}
