import { createRouter, createWebHashHistory } from 'vue-router'


import Login from '@/components/Login.vue'
import Register from '@/components/Register.vue'
import MainPage from '@/components/MainPage.vue'
import ShowcasePage from '@/components/ShowcasePage.vue'
import AdminPage from '@/components/AdminPage.vue'
import ProfilePage from '@/components/ProfilePage.vue'
import ProblemDetail from '@/components/ProblemDetail.vue'
import UserManagement from '@/components/UserManagement.vue'
import ProblemManagement from '@/components/ProblemManagement.vue'
import NicknameReviewManagement from '@/components/NicknameReviewManagement.vue'
import AIChat from '@/components/AIChat.vue'
import AIJudge from '@/components/AIJudge.vue'

const routes = [
  {
    path: '/',
    redirect: '/showcase'
  },
  {
    path: '/showcase',
    name: 'ShowcasePage',
    component: ShowcasePage
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/main',
    name: 'MainPage',
    component: MainPage
  },
  {
    path: '/admin',
    name: 'AdminPage',
    component: AdminPage,
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'UserManagement',
    component: UserManagement,
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/problems',
    name: 'ProblemManagement',
    component: ProblemManagement,
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/nickname-reviews',
    name: 'NicknameReviewManagement',
    component: NicknameReviewManagement,
    meta: { requiresAdmin: true }
  },
  {
    path: '/profile',
    name: 'ProfilePage',
    component: ProfilePage
  },
  {
    path: '/leetcode/problems/:problemId/',
    name: 'ProblemDetail',
    component: ProblemDetail,
    props: true
  },
  {
    path: '/ai-chat',
    name: 'AIChat',
    component: AIChat
  },
  {
    path: '/ai-judge/:problemId?',
    name: 'AIJudge',
    component: AIJudge,
    props: true
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 添加全局前置守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  
  if (to.meta.requiresAdmin) {
    // 检查是否已登录
    if (!token) {
      next('/login');
      return;
    }
    
    // 检查是否为管理员（这里需要从后端获取用户信息来验证角色）
    // 临时方案：检查localStorage中是否有admin标记
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    if (!isAdmin) {
      // 如果不是管理员，重定向到主页面
      next('/main');
      return;
    }
  }
  
  next();
});

export default router
