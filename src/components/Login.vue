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

        <el-form-item label="身份">
          <el-radio-group v-model="form.role">
            <el-radio label="student">学生</el-radio>
            <el-radio label="teacher">教师</el-radio>
            <el-radio label="admin">管理员</el-radio>
          </el-radio-group>
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
const form = reactive({ username: '', password: '', role: 'student' })
const loginForm = ref(null)

const validatePassword = (rule, value, callback) => {
  if (!value) return callback(new Error('请输入密码'))
  // 密码至少8位，且包含字母和数字
  const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
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

async function onLogin() {
  if (!loginForm.value) return
  loginForm.value.validate(async (valid) => {
    if (!valid) return
    try {
      const res = await request.post('/auth/login', {
        username: form.username,
        password: form.password,
        role: form.role
      })
      const token = res.data?.token || res.token
      if (token) localStorage.setItem('token', token)
      ElMessage.success(res.msg || '登录成功')
      router.push('/')
    } catch (err) {
      console.error('登录失败', err)
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
