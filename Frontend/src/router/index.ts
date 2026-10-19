import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import PublicLayout from '@/layouts/PublicLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppShell from '@/layouts/AppShell.vue'
import { useSession } from '@/composables/useSession'
import { useAccess } from '@/composables/useAccess'
import type { ModuleKey, Role } from '@/types'

const routes: RouteRecordRaw[] = [
  // --- PUBLIC ROUTES ---
  {
    path: '/',
    component: PublicLayout,
    children: [
      {
        path: '',
        name: 'landing',
        component: () => import('@/pages/public/LandingPage.vue'),
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('@/pages/public/ProductsPage.vue'),
      },
      {
        path: 'products/:id',
        name: 'product-detail',
        component: () => import('@/pages/public/ProductDetailPage.vue'),
      },
      {
        path: 'pricing',
        name: 'pricing',
        component: () => import('@/pages/public/PricingPage.vue'),
      },
      {
        path: 'solutions',
        name: 'solutions',
        component: () => import('@/pages/public/SolutionsPage.vue'),
      },
      {
        path: 'checkout',
        name: 'checkout',
        component: () => import('@/pages/public/CheckoutPage.vue'),
      },
      {
        path: 'demo',
        name: 'demo',
        component: () => import('@/pages/public/DemoPage.vue'),
      },
      {
        path: 'help',
        name: 'public-help',
        component: () => import('@/pages/public/HelpPage.vue'),
      },
    ],
  },

  // --- AUTH ROUTES ---
  {
    path: '/',
    component: AuthLayout,
    children: [
      {
        path: 'sign-in',
        name: 'sign-in',
        component: () => import('@/pages/auth/SignInPage.vue'),
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/pages/auth/RegisterPage.vue'),
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
      },
    ],
  },

  // Auth Redirects
  { path: '/login', redirect: '/sign-in' },
  { path: '/auth/:pathMatch(.*)*', redirect: '/sign-in' },

  // --- CLIENT WORKSPACE ROUTES (/app) ---
  {
    path: '/app',
    component: AppShell,
    meta: { requiresAuth: true },
    children: [
      // Role-based home redirect
      {
        path: '',
        name: 'app-home',
        redirect: () => {
          const { currentRole } = useSession()
          if (currentRole.value === 'sales_rep') return '/app/sales'
          if (currentRole.value === 'accountant') return '/app/sales/invoices'
          if (currentRole.value === 'storekeeper') return '/app/sales/deliveries'
          if (currentRole.value === 'adadiko_staff') return '/admin'
          return '/app/sales/dashboard'
        },
      },
      // Sales screens
      {
        path: 'sales',
        name: 'sales-rep-home',
        component: () => import('@/pages/sales/SalesRepHome.vue'),
        meta: { module: 'sales', allowedRoles: ['sales_rep', 'sales_manager', 'admin'] },
      },
      {
        path: 'sales/dashboard',
        name: 'sales-dashboard',
        component: () => import('@/pages/sales/ManagerDashboard.vue'),
        meta: { module: 'sales', allowedRoles: ['sales_manager', 'admin'] },
      },
      {
        path: 'sales/customers',
        name: 'sales-customers',
        component: () => import('@/pages/sales/CustomersPage.vue'),
        meta: { module: 'sales', allowedRoles: ['sales_rep', 'sales_manager', 'admin', 'accountant'] },
      },
      {
        path: 'sales/customers/:id',
        name: 'sales-customer-detail',
        component: () => import('@/pages/sales/CustomerDetailPage.vue'),
        meta: { module: 'sales', allowedRoles: ['sales_rep', 'sales_manager', 'admin', 'accountant'] },
      },
      {
        path: 'sales/quotations',
        name: 'sales-quotations',
        component: () => import('@/pages/sales/QuotationsPage.vue'),
        meta: { module: 'sales', allowedRoles: ['sales_rep', 'sales_manager', 'admin'] },
      },
      {
        path: 'sales/orders',
        name: 'sales-orders',
        component: () => import('@/pages/sales/OrdersPage.vue'),
        meta: { module: 'sales', allowedRoles: ['sales_rep', 'sales_manager', 'admin'] },
      },
      {
        path: 'sales/orders/new',
        name: 'sales-order-new',
        component: () => import('@/pages/sales/NewOrderPage.vue'),
        meta: { module: 'sales', allowedRoles: ['sales_rep', 'sales_manager', 'admin'] },
      },
      {
        path: 'sales/orders/:id',
        name: 'sales-order-detail',
        component: () => import('@/pages/sales/OrderDetailPage.vue'),
        meta: { module: 'sales', allowedRoles: ['sales_rep', 'sales_manager', 'admin', 'storekeeper'] },
      },
      {
        path: 'sales/deliveries',
        name: 'sales-deliveries',
        component: () => import('@/pages/sales/DeliveriesPage.vue'),
        meta: { module: 'sales', allowedRoles: ['storekeeper', 'sales_manager', 'admin', 'sales_rep'] },
      },
      {
        path: 'sales/invoices',
        name: 'sales-invoices',
        component: () => import('@/pages/sales/InvoicesPage.vue'),
        meta: { module: 'sales', allowedRoles: ['accountant', 'sales_manager', 'admin'] },
      },
      {
        path: 'sales/invoices/:id',
        name: 'sales-invoice-detail',
        component: () => import('@/pages/sales/InvoiceDetailPage.vue'),
        meta: { module: 'sales', allowedRoles: ['accountant', 'sales_manager', 'admin'] },
      },
      // Admin screens
      {
        path: 'users',
        name: 'app-users',
        component: () => import('@/pages/app/UsersPage.vue'),
        meta: { allowedRoles: ['admin'] },
      },
      {
        path: 'plan',
        name: 'app-plan',
        component: () => import('@/pages/app/PlanPage.vue'),
        meta: { allowedRoles: ['admin'] },
      },
      {
        path: 'billing',
        redirect: '/app/plan',
      },
      {
        path: 'settings',
        name: 'app-settings',
        component: () => import('@/pages/app/SettingsPage.vue'),
      },
      {
        path: 'help',
        name: 'app-help',
        component: () => import('@/pages/app/WorkspaceHelpPage.vue'),
      },
      // Coming soon screens for unbuilt modules
      {
        path: 'inventory',
        name: 'module-inventory',
        component: () => import('@/pages/shared/ComingSoonPage.vue'),
        props: { moduleKey: 'inventory', title: 'Inventory & Warehousing' },
      },
      {
        path: 'purchasing',
        name: 'module-purchasing',
        component: () => import('@/pages/shared/ComingSoonPage.vue'),
        props: { moduleKey: 'purchasing', title: 'Procurement & Purchasing' },
      },
      {
        path: 'finance',
        name: 'module-finance',
        component: () => import('@/pages/shared/ComingSoonPage.vue'),
        props: { moduleKey: 'finance', title: 'Financial Accounting' },
      },
      {
        path: 'manufacturing',
        name: 'module-manufacturing',
        component: () => import('@/pages/shared/ComingSoonPage.vue'),
        props: { moduleKey: 'manufacturing', title: 'Manufacturing & Assembly' },
      },
      // Access Guard landing states
      {
        path: 'no-access',
        name: 'app-no-access',
        component: () => import('@/pages/shared/NoAccessPage.vue'),
      },
      {
        path: 'locked/:module',
        name: 'app-locked',
        component: () => import('@/pages/shared/LockedModulePage.vue'),
      },
    ],
  },

  // --- ADADIKO BACK OFFICE (/admin) ---
  {
    path: '/admin',
    component: AppShell,
    meta: { requiresAuth: true, allowedRoles: ['adadiko_staff', 'admin'] },
    children: [
      {
        path: '',
        name: 'admin-overview',
        component: () => import('@/pages/admin/AdminOverviewPage.vue'),
      },
      {
        path: 'clients',
        name: 'admin-clients',
        component: () => import('@/pages/admin/AdminClientsPage.vue'),
      },
      {
        path: 'orders',
        name: 'admin-orders',
        component: () => import('@/pages/admin/AdminOrdersPage.vue'),
      },
      {
        path: 'subscriptions',
        name: 'admin-subscriptions',
        component: () => import('@/pages/admin/AdminSubscriptionsPage.vue'),
      },
      {
        path: 'catalog',
        name: 'admin-catalog',
        component: () => import('@/pages/admin/AdminCatalogPage.vue'),
      },
      {
        path: 'logs',
        name: 'admin-logs',
        component: () => import('@/pages/admin/AdminLogsPage.vue'),
      },
    ],
  },

  // Fallback 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// ROUTER GUARDS
// 1. Not signed in goes to /sign-in?next=...
// 2. A role without access goes to /app/no-access
// 3. A module the organization did not buy goes to /app/locked/:module
router.beforeEach(async (to, _from, next) => {
  const { isAuthenticated, currentRole, isSessionChecked, restoreSession } = useSession()
  const { canUseModule } = useAccess()

  // On initial load or refresh, restore server session if in Frappe mode
  if (!isSessionChecked.value) {
    await restoreSession()
  }

  // If already logged in and navigating to sign-in, redirect to app workspace
  if (to.path === '/sign-in' && isAuthenticated.value) {
    return next({ path: '/app' })
  }

  // Check auth requirement
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return next({ path: '/sign-in', query: { next: to.fullPath } })
  }

  // Check subscribed module requirement
  if (to.meta.module) {
    const requiredModule = to.meta.module as ModuleKey
    if (!canUseModule(requiredModule)) {
      return next({ path: `/app/locked/${requiredModule}` })
    }
  }

  // Check role access
  if (to.meta.allowedRoles) {
    const allowed = to.meta.allowedRoles as Role[]
    if (!allowed.includes(currentRole.value)) {
      return next({ path: '/app/no-access' })
    }
  }

  next()
})


export default router
