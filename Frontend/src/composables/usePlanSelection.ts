import { ref, computed } from 'vue'
import type { ModuleKey } from '@/types'
import { MODULE_CATALOG, PRICING_TIERS, type PricingTier } from '@/data/catalog'

const selectedPlanId = ref<'starter' | 'growth' | 'enterprise'>('growth')
const billingCycle = ref<'monthly' | 'yearly'>('monthly')
const selectedModules = ref<ModuleKey[]>(['sales'])
const extraSeats = ref<number>(2)

export function usePlanSelection() {
  const currentTier = computed<PricingTier>(() => {
    return PRICING_TIERS.find((p) => p.id === selectedPlanId.value) || PRICING_TIERS[1]
  })

  const basePrice = computed(() => {
    return billingCycle.value === 'monthly'
      ? currentTier.value.monthlyBasePrice
      : currentTier.value.yearlyBasePrice
  })

  // Additional modules beyond the tier allowance
  const addonModulesPrice = computed(() => {
    // If starter (1 module included), any extra module is +$25/mo
    // If growth (3 modules included), any extra is +$20/mo
    // If enterprise (all included), $0 extra
    if (selectedPlanId.value === 'enterprise') return 0
    const allowed = selectedPlanId.value === 'growth' ? 3 : 1
    const extraCount = Math.max(0, selectedModules.value.length - allowed)
    const rate = selectedPlanId.value === 'growth' ? 20 : 25
    return extraCount * rate
  })

  const extraSeatsPrice = computed(() => {
    return extraSeats.value * currentTier.value.extraUserPrice
  })

  const monthlyTotal = computed(() => {
    return basePrice.value + addonModulesPrice.value + extraSeatsPrice.value
  })

  const yearlyBilledTotal = computed(() => {
    return monthlyTotal.value * 12
  })

  function toggleModule(id: ModuleKey) {
    const idx = selectedModules.value.indexOf(id)
    if (idx >= 0) {
      if (selectedModules.value.length > 1) {
        selectedModules.value.splice(idx, 1)
      }
    } else {
      selectedModules.value.push(id)
    }
  }

  function isModuleSelected(id: ModuleKey): boolean {
    return selectedModules.value.includes(id)
  }

  function selectTier(tierId: 'starter' | 'growth' | 'enterprise') {
    selectedPlanId.value = tierId
  }

  return {
    selectedPlanId,
    billingCycle,
    selectedModules,
    extraSeats,
    currentTier,
    basePrice,
    addonModulesPrice,
    extraSeatsPrice,
    monthlyTotal,
    yearlyBilledTotal,
    toggleModule,
    isModuleSelected,
    selectTier,
    allModules: MODULE_CATALOG,
    allTiers: PRICING_TIERS,
  }
}
