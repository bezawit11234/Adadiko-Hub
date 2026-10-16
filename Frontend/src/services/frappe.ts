/**
 * Base Frappe / ERPNext v16 API Client Foundation
 * Handles headers, session cookies, and standard Frappe REST call patterns.
 */

export interface FrappeConfig {
  baseUrl: string
  apiKey?: string
  apiSecret?: string
}

export class FrappeClient {
  private config: FrappeConfig

  constructor(config?: Partial<FrappeConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || import.meta.env.VITE_FRAPPE_URL || '',
      apiKey: config?.apiKey || import.meta.env.VITE_FRAPPE_API_KEY,
      apiSecret: config?.apiSecret || import.meta.env.VITE_FRAPPE_API_SECRET,
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
    if (this.config.apiKey && this.config.apiSecret) {
      headers['Authorization'] = `token ${this.config.apiKey}:${this.config.apiSecret}`
    }
    return headers
  }

  /**
   * Calls a whitelisted python method on Frappe server
   * e.g. frappe.client.get_list or erpnext.selling.doctype.sales_order.sales_order.make_delivery_note
   */
  async callMethod<T = any>(methodName: string, args: Record<string, any> = {}): Promise<T> {
    const url = `${this.config.baseUrl}/api/method/${methodName}`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(args),
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}))
      throw new Error(errBody._server_messages || errBody.message || `Frappe error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.message
  }

  /**
   * Fetches a list of documents from a DocType
   */
  async getList<T = any>(doctype: string, filters: any = [], fields: string[] = ['*']): Promise<T[]> {
    const params = new URLSearchParams({
      doctype,
      filters: JSON.stringify(filters),
      fields: JSON.stringify(fields),
    })
    const url = `${this.config.baseUrl}/api/resource/${doctype}?${params.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    const data = await response.json()
    return data.data
  }
}

export const defaultFrappeClient = new FrappeClient()
