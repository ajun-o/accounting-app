import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import CoupleSetupPage from '@/pages/CoupleSetupPage.vue'

// 定义路由配置
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: { requiresAuth: true, requiresCouple: true },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { guest: true },
  },
  {
    path: '/couple-setup',
    name: 'couple-setup',
    component: CoupleSetupPage,
    meta: { requiresAuth: true },
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 简化的路由守卫
router.beforeEach(async (to, from, next) => {
  // 延迟加载 useUserStore
  const { useUserStore } = await import('@/stores/user')
  const userStore = useUserStore()
  
  // 等待初始化完成
  if (!userStore.isLoggedIn) {
    await userStore.init()
  }
  
  const isLoggedIn = userStore.isLoggedIn
  const hasCouple = userStore.hasCouple
  
  // 需要登录的页面
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
    return
  }
  
  // 需要情侣空间的页面
  if (to.meta.requiresCouple && !hasCouple) {
    next('/couple-setup')
    return
  }
  
  // 游客页面（登录页）
  if (to.meta.guest && isLoggedIn) {
    if (hasCouple) {
      next('/')
    } else {
      next('/couple-setup')
    }
    return
  }
  
  next()
})

export default router
