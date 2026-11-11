import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** 로그인해야 들어갈 수 있는 화면 */
    requiresAuth?: boolean
    /** 로그인하지 않은 사용자만 보는 화면 (로그인·회원가입) */
    guestOnly?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignupView.vue'),
      meta: { guestOnly: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

/** 라우터 가드: 로그인 상태에 따라 화면 접근을 구분한다 */
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init() // 새로고침 직후 저장된 로그인 상태 복원을 기다림

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return { name: 'home' }
  }
  return true
})

export default router
