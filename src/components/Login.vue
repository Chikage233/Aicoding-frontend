<template>
  <div class="auth-page">
    <el-card class="card">
      <h2>登录</h2>

      <el-form ref="loginForm" :model="form" :rules="rules" label-position="top" class="form" @submit.prevent="onLogin">
        <el-form-item prop="username" label="账号（邮箱/用户名）">
          <el-input v-model="form.username" placeholder="请输入邮箱或用户名" clearable />
        </el-form-item>

        <el-form-item prop="password" label="密码">
          <el-input v-model="form.password" placeholder="请输入密码" show-password type="password" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="onLogin" style="width:100%">登录</el-button>
        </el-form-item>
      </el-form>

      <div class="foot">
        <span>还没有账号？</span>
        <router-link to="/register" class="link">注册账户</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()
const form = reactive({ username: '', password: '' })
const loginForm = ref(null)

const validatePassword = (rule, value, callback) => {
  if (!value) return callback(new Error('请输入密码'))
  // 密码至少8位，且包含字母和数字，可含符号
  const re = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
  if (!re.test(value)) return callback(new Error('密码至少8位，需包含字母和数字'))
  callback()
}

const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, message: '账号至少3位', trigger: 'blur' }
  ],
  password: [{ validator: validatePassword, trigger: 'blur' }]
}

// 获取当前用户信息
async function fetchUserInfo(token) {
  try {
    const response = await request.get('/auth/jwt/me/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const userData = response.data?.data?.user || response.data?.user || response.data;
    if (userData) {
      // 根据后端返回的字段判断管理员权限
      const isAdmin = userData.is_staff || userData.is_admin || userData.role === 'admin';
      localStorage.setItem('is_admin', isAdmin ? 'true' : 'false');
      localStorage.setItem('user_info', JSON.stringify(userData));
      return isAdmin;
    }
    return false;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    localStorage.setItem('is_admin', 'false');
    return false;
  }
}

async function onLogin() {
  if (!loginForm.value) return
  loginForm.value.validate(async (valid) => {
    if (!valid) return
    try {
      // 修复：使用正确的字段名 username 而不是 email
      const res = await request.post('/auth/jwt/login/', {
        username: form.username,  // ✅ 修正：使用 username 字段
        password: form.password,
      })
      
      // 处理响应数据 - 根据后端实际返回格式
      const responseData = res.data?.data || res.data || res;
      const access = responseData.access;
      const refresh = responseData.refresh;
      
      if (access) localStorage.setItem('token', access)
      if (refresh) localStorage.setItem('refresh_token', refresh)
      
      // 获取用户信息并确定角色
      const isAdmin = await fetchUserInfo(access);
      
      ElMessage.success('登录成功')
      
      // 根据实际角色重定向
      if (isAdmin) {
        router.push('/admin')
      } else {
        router.push('/main')
      }
    } catch (err) {
      console.error('登录失败', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          '登录失败，请检查账号密码';
      ElMessage.error(errorMessage)
    }
  })
}
</script>

<style scoped>
.auth-page { width:100%; display:flex; align-items:center; justify-content:center; padding:24px }
.card { width:100%; max-width:420px; padding:20px }
h2 { margin:0 0 12px 0; font-size:20px }
.form { margin-top:6px }
.foot { margin-top:12px; display:flex; gap:8px; align-items:center; color:#445 }
.link { color:#409EFF; text-decoration:underline }

@media (max-width:480px){ .card{ padding:14px } }
</style>