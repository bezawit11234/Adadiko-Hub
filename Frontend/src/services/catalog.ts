/**
 * Catalog service contract and implementation
 */
import type { ApiResult, ModuleProduct, ModuleKey } from '@/types'
import { MODULE_CATALOG, PRICING_TIERS, type PricingTier } from '@/data/catalog'

export interface CatalogApi {
  listModules(): Promise<ApiResult<ModuleProduct[]>>
  getModule(id: ModuleKey): Promise<ApiResult<ModuleProduct>>
  listTiers(): Promise<ApiResult<PricingTier[]>>
}

class CatalogService implements CatalogApi {
  async listModules(): Promise<ApiResult<ModuleProduct[]>> {
    return { ok: true, data: [...MODULE_CATALOG] }
  }

  async getModule(id: ModuleKey): Promise<ApiResult<ModuleProduct>> {
    const found = MODULE_CATALOG.find((m) => m.id === id)
    if (!found) return { ok: false, error: `Module ${id} not found.` }
    return { ok: true, data: found }
  }

  async listTiers(): Promise<ApiResult<PricingTier[]>> {
    return { ok: true, data: [...PRICING_TIERS] }
  }
}

const catalogInstance = new CatalogService()

export function getCatalogApi(): CatalogApi {
  return catalogInstance
}
