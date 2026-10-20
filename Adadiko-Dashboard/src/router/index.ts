/**
 * Adadiko Dashboard — Vue Router Configuration
 *
 * Implements authentication guards and role-based access control.
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useSession } from '@/composables/useSession'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/overview',
  },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: '/sign-in',
        name: 'SignIn',
        component: () => import('@/pages/auth/SignInPage.vue'),
        meta: { public: true, title: 'Staff Sign In' },
      },
    ],
  },
  {
    path: '/app',
    component: DashboardLayout,
    children: [
      {
        path: '/overview',
        name: 'Overview',
        component: () => import('@/pages/OverviewPage.vue'),
        meta: { roles: ['admin', 'support', 'billing'], title: 'Executive Overview' },
      },
      {
        path: '/clients',
        name: 'Clients',
        component: () => import('@/pages/ClientsPage.vue'),
        meta: { roles: ['admin', 'support'], title: 'Client Companies' },
      },
      {
        path: '/clients/:id',
        name: 'ClientDetail',
        component: () => import('@/pages/ClientDetailPage.vue'),
        meta: { roles: ['admin', 'support'], title: 'Client Details' },
      },
      {
        path: '/orders',
        name: 'Orders',
        component: () => import('@/pages/OrdersPage.vue'),
        meta: { roles: ['admin', 'billing'], title: 'Orders & Payments' },
      },
      {
        path: '/subscriptions',
        name: 'Subscriptions',
        component: () => import('@/pages/SubscriptionsPage.vue'),
        meta: { roles: ['admin', 'billing'], title: 'Subscriptions' },
      },
      {
        path: '/catalog',
        name: 'Catalog',
        component: () => import('@/pages/CatalogPage.vue'),
        meta: { roles: ['admin'], title: 'Module Catalog' },
      },
      {
        path: '/logs',
        name: 'Logs',
        component: () => import('@/pages/LogsPage.vue'),
        meta: { roles: ['admin', 'support'], title: 'Activity Logs' },
      },
      {
        path: '/staff',
        name: 'Staff',
        component: () => import('@/pages/StaffPage.vue'),
        meta: { roles: ['admin'], title: 'Staff Management' },
      },
      {
        path: '/no-access',
        name: 'NoAccess',
        component: () => import('@/pages/NoAccessPage.vue'),
        meta: { title: 'Access Restricted' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { public: true, title: 'Page Not Found' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, _from, next) => {
  const { isAuthenticated, currentRole } = useSession()

  // Update page title
  const pageTitle = to.meta.title as string | undefined
  document.title = pageTitle ? `${pageTitle} — Adadiko Dashboard` : 'Adadiko Dashboard — Staff Back Office'

  // Public route check
  if (to.meta.public) {
    if (to.path === '/sign-in' && isAuthenticated.value) {
      return next('/overview')
    }
    return next()
  }

  // Auth requirement
  if (!isAuthenticated.value) {
    return next({ path: '/sign-in', query: { next: to.fullPath } })
  }

  // Role authorization check
  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && !requiredRoles.includes(currentRole.value)) {
    return next('/no-access')
  }

  next()
})

export default router
