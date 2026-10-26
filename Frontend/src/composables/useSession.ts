import { ref, computed } from 'vue'
import type { User, Organization, Role, ModuleKey } from '@/types'
import { ROLE_DEFINITIONS } from '@/data/roles'
import { getAuthApi } from '@/services/auth'

const STORAGE_KEY_USER = 'adadiko_current_user'
const STORAGE_KEY_ORG = 'adadiko_current_org'
const STORAGE_KEY_MODE = 'adadiko_api_mode'

const emptyOrg: Organization = {
  id: '',
  name: 'My Workspace',
  plan: 'starter',
  billingCycle: 'monthly',
  subscribedModules: ['sales'],
  createdDate: new Date().toISOString().split('T')[0],
  status: 'active',
}

function loadStoredMode(): 'mock' | 'frappe' {
  const stored = localStorage.getItem(STORAGE_KEY_MODE)
  if (stored === 'mock' || stored === 'frappe') return stored
  return (import.meta.env.VITE_API_MODE as 'mock' | 'frappe') || 'mock'
}

const apiMode = ref<'mock' | 'frappe'>(loadStoredMode())

function sessionStore(): Storage | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage
}

function loadStoredUser(): User | null {
  try {
    const raw = sessionStore()?.getItem(STORAGE_KEY_USER)
    if (raw) return JSON.parse(raw) as User
  } catch {
    // fallback
  }
  return null
}

function loadStoredOrg(): Organization {
  try {
    const raw = sessionStore()?.getItem(STORAGE_KEY_ORG)
    if (raw) return JSON.parse(raw) as Organization
  } catch {
    // fallback
  }
  return emptyOrg
}

const currentUser = ref<User | null>(loadStoredUser())
const currentOrg = ref<Organization>(loadStoredOrg())
const isDemoModeVisible = ref<boolean>(false)
const isSessionChecked = ref<boolean>(false)

export function useSession() {
  const isAuthenticated = computed(() => !!currentUser.value)
  const currentRole = computed<Role>(() => currentUser.value?.role || 'sales_rep')
  const currentRoleMeta = computed(() => ROLE_DEFINITIONS[currentRole.value] || ROLE_DEFINITIONS.sales_rep)

  function setApiMode(mode: 'mock' | 'frappe') {
    apiMode.value = mode
    localStorage.setItem(STORAGE_KEY_MODE, mode)
    window.location.reload()
  }

  function setUser(user: User | null) {
    currentUser.value = user
    const store = sessionStore()
    if (!store) return
    if (user) {
      store.setItem(STORAGE_KEY_USER, JSON.stringify(user))
    } else {
      store.removeItem(STORAGE_KEY_USER)
    }
  }

  function setOrganization(org: Organization) {
    currentOrg.value = org
    sessionStore()?.setItem(STORAGE_KEY_ORG, JSON.stringify(org))
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
    const authApi = getAuthApi()
    if (apiMode.value === 'frappe') {
      const res = await authApi.getSession()
      if (res.ok && res.data) {
        setUser(res.data)
        currentOrg.value = loadStoredOrg()
        isSessionChecked.value = true
        return res.data
      } else {
        setUser(null)
        isSessionChecked.value = true
        return null
      }
    } else {
      const res = await authApi.getSession()
      if (res.ok && res.data) {
        setUser(res.data)
        currentOrg.value = loadStoredOrg()
        isSessionChecked.value = true
        return res.data
      } else {
        setUser(null)
        isSessionChecked.value = true
        return null
      }
    }
  }

  async function signOut(): Promise<void> {
    const authApi = getAuthApi()
    await authApi.signOut()
    setUser(null)
    setOrganization(emptyOrg)
  }

  async function signIn(
    email: string,
    password = '',
    workspaceSlug?: string,
  ): Promise<{ ok: boolean; error?: string; data?: User }> {
    const authApi = getAuthApi()
    const res = await authApi.signIn(email, password, workspaceSlug)
    if (res.ok && res.data) {
      setUser(res.data)
      currentOrg.value = loadStoredOrg()
    }
    return res
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
    toggleSubscribedModule,
    restoreSession,
    signOut,
    signIn,
  }
}
