import { createRouter, createWebHashHistory } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { getAllUsers } from '@/services/storage/users'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginScreen.vue'),
    meta: { public: true },
  },
  {
    path: '/registro',
    name: 'Registro',
    component: () => import('@/views/auth/RegisterScreen.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/Layout.vue'),
    children: [
      {
        path: '',
        redirect: '/medicamentos',
      },
      {
        name: 'MisMedicamentos',
        path: 'medicamentos',
        component: () => import('@/views/inicio/medicamentos.vue'),
      },
      {
        name: 'Nuevo',
        path: 'nuevo',
        component: () => import('@/views/pages/nuevo.vue'),
      },
      {
        name: 'Detalles',
        path: 'detalles/:id',
        component: () => import('@/views/farmacos/detalles.vue'),
        meta: { breadCrumb: 'Detalles' },
      },
      {
        name: 'Perfil',
        path: 'perfil',
        component: () => import('@/views/dashboard/BasicDashboard.vue'),
      },
      {
        name: 'Settings',
        path: 'settings',
        component: () => import('@/views/pages/Settings.vue'),
        meta: { breadCrumb: 'Ajustes' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (to.meta.public) return true

  const uiStore = useUiStore()
  if (uiStore.sessionReady) return true

  const users = await getAllUsers()
  if (users.length === 0) return { name: 'Registro' }
  return { name: 'Login' }
})

export default router
