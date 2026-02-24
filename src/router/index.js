import { createRouter, createWebHashHistory } from 'vue-router'


import Login from '@/components/Login.vue'
import Register from '@/components/Register.vue'
import MainPage from '@/components/MainPage.vue'
import AdminPage from '@/components/AdminPage.vue'
import ProfilePage from '@/components/ProfilePage.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
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
    component: AdminPage
  },
  {
    path: '/profile',
    name: 'ProfilePage',
    component: ProfilePage
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
