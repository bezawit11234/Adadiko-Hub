import { ref, computed } from 'vue'
import type { User, Organization, Role, ModuleKey } from '@/types'
import { DEMO_USERS, ROLE_DEFINITIONS } from '@/data/roles'

const STORAGE_KEY_USER = 'adadiko_current_user'
const STORAGE_KEY_ORG = 'adadiko_current_org'

const defaultOrg: Organization = {
  id: 'org_acme',
  name: 'Apex Wholesale Ltd',
  plan: 'growth',
  billingCycle: 'monthly',
  subscribedModules: ['sales'], // Core Sales purchased by default
  createdDate: '2026-01-15',
  status: 'active',
}

// Load initial user or default to Sales Manager demo user
function loadStoredUser(): User {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return DEMO_USERS.sales_manager
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
const isDemoModeVisible = ref<boolean>(true) // visible in dev / evaluation mode

export function useSession() {
  const isAuthenticated = computed(() => !!currentUser.value)
  const currentRole = computed<Role>(() => currentUser.value?.role || 'sales_rep')
  const currentRoleMeta = computed(() => ROLE_DEFINITIONS[currentRole.value])

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
      // Don't remove if it's the only one or keep minimum 1
      modules.splice(idx, 1)
    } else {
      modules.push(moduleKey)
    }
    setOrganization({
      ...currentOrg.value,
      subscribedModules: modules,
    })
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

  function signOut() {
    setUser(null)
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
    setUser,
    setOrganization,
    switchRole,
    toggleSubscribedModule,
    signIn,
    signOut,
    resetToDemoDefaults,
  }
}
