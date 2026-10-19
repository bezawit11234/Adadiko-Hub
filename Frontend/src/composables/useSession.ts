import { ref, computed } from 'vue'
import type { User, Organization, Role, ModuleKey } from '@/types'
import { DEMO_USERS, ROLE_DEFINITIONS } from '@/data/roles'
import { getAuthApi } from '@/services/auth'

const STORAGE_KEY_USER = 'adadiko_current_user'
const STORAGE_KEY_ORG = 'adadiko_current_org'
const STORAGE_KEY_MODE = 'adadiko_api_mode'

const defaultOrg: Organization = {
  id: 'org_acme',
  name: 'Adadiko Hub Corp',
  plan: 'growth',
  billingCycle: 'monthly',
  subscribedModules: ['sales'], // Core Sales purchased by default
  createdDate: '2026-01-15',
  status: 'active',
}

function loadStoredMode(): 'mock' | 'frappe' {
  const stored = localStorage.getItem(STORAGE_KEY_MODE)
  if (stored === 'mock' || stored === 'frappe') return stored
  return (import.meta.env.VITE_API_MODE as 'mock' | 'frappe') || 'mock'
}

const apiMode = ref<'mock' | 'frappe'>(loadStoredMode())

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  // In mock mode, default to Sarah Chen demo user for convenience
  if (apiMode.value === 'mock') {
    return DEMO_USERS.sales_manager
  }
  return null
}

function loadStoredOrg(): Organization {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORG)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return defaultOrg
}

const currentUser = ref<User | null>(loadStoredUser())
const currentOrg = ref<Organization>(loadStoredOrg())
const isDemoModeVisible = ref<boolean>(true)
const isSessionChecked = ref<boolean>(false)

export function useSession() {
  const isAuthenticated = computed(() => !!currentUser.value)
  const currentRole = computed<Role>(() => currentUser.value?.role || 'sales_rep')
  const currentRoleMeta = computed(() => ROLE_DEFINITIONS[currentRole.value])

  function setApiMode(mode: 'mock' | 'frappe') {
    apiMode.value = mode
    localStorage.setItem(STORAGE_KEY_MODE, mode)
    // Reload to ensure services and adapters switch cleanly
    window.location.reload()
  }

  function setUser(user: User | null) {
    currentUser.value = user
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY_USER)
    }
  }

  function setOrganization(org: Organization) {
    currentOrg.value = org
    localStorage.setItem(STORAGE_KEY_ORG, JSON.stringify(org))
  }

  function switchRole(role: Role) {
    const demoUser = DEMO_USERS[role]
    if (demoUser) {
      setUser(demoUser)
    }
  }

  function toggleSubscribedModule(moduleKey: ModuleKey) {
    const modules = [...currentOrg.value.subscribedModules]
    const idx = modules.indexOf(moduleKey)
    if (idx >= 0) {
      modules.splice(idx, 1)
    } else {
      modules.push(moduleKey)
    }
    setOrganization({
      ...currentOrg.value,
      subscribedModules: modules,
    })
  }

  async function restoreSession(): Promise<User | null> {
    if (apiMode.value === 'frappe') {
      const authApi = getAuthApi()
      const res = await authApi.getSession()
      if (res.ok && res.data) {
        setUser(res.data)
        isSessionChecked.value = true
        return res.data
      } else {
        setUser(null)
        isSessionChecked.value = true
        return null
      }
    }
    isSessionChecked.value = true
    return currentUser.value
  }

  async function signOut(): Promise<void> {
    const authApi = getAuthApi()
    await authApi.signOut()
    setUser(null)
  }

  function signIn(email: string, role: Role = 'sales_rep') {
    const foundDemo = Object.values(DEMO_USERS).find((u) => u.email === email)
    if (foundDemo) {
      setUser(foundDemo)
      return foundDemo
    }
    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      name: email.split('@')[0].replace('.', ' '),
      role,
      organizationId: currentOrg.value.id,
      isDemo: false,
    }
    setUser(newUser)
    return newUser
  }

  function resetToDemoDefaults() {
    setUser(DEMO_USERS.sales_manager)
    setOrganization(defaultOrg)
  }

  return {
    currentUser,
    currentOrg,
    isAuthenticated,
    currentRole,
    currentRoleMeta,
    isDemoModeVisible,
    apiMode,
    isSessionChecked,
    setApiMode,
    setUser,
    setOrganization,
    switchRole,
    toggleSubscribedModule,
    restoreSession,
    signIn,
    signOut,
    resetToDemoDefaults,
  }

}
