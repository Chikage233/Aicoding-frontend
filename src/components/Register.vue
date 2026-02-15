<template>
  <div class="auth-page">
    <el-card class="card">
      <h2>注册</h2>

      <el-form ref="registerForm" :model="form" :rules="rules" label-position="top" class="form">
        <el-form-item prop="email" label="邮箱">
          <el-input v-model="form.email" placeholder="请输入邮箱" clearable />
        </el-form-item>

        <el-form-item label="身份">
          <el-radio-group v-model="form.role">
            <el-radio label="student">学生</el-radio>
            <el-radio label="teacher">教师</el-radio>
            <el-radio label="admin">管理员</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item prop="code" label="验证码">
          <div class="code-row">
            <el-input v-model="form.code" placeholder="请输入验证码" clearable />
            <el-button :disabled="sending" @click="sendCode">{{ sending ? count + 's' : '发送验证码' }}</el-button>
          </div>
        </el-form-item>

        <el-form-item prop="password" label="设置密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>

        <el-form-item prop="confirmPassword" label="确认密码">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" style="width:100%" @click="onRegister">注册</el-button>
        </el-form-item>
      </el-form>

      <div class="foot">
        <span>已有账号？</span>
        <router-link to="/login" class="link">去登录</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = reactive({ email: '', code: '', password: '', confirmPassword: '', role: 'student' })
const registerForm = ref(null)
const sending = ref(false)
const count = ref(60)
let timer = null

const validateConfirm = (rule, value, callback) => {
  if (!value) {
    return callback(new Error('请确认密码'))
  }
  if (value !== form.password) {
    return callback(new Error('两次密码不一致'))
  }
  callback()
}

const validatePassword = (rule, value, callback) => {
  if (!value) return callback(new Error('请输入密码'))
  // 密码至少8位，且包含字母和数字
  const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
  if (!re.test(value)) return callback(new Error('密码至少8位，需包含字母和数字'))
  callback()
}

const validateCode = (rule, value, callback) => {
  if (!value) return callback(new Error('请输入验证码'))
  if (!/^\d{6}$/.test(value)) return callback(new Error('验证码为6位数字'))
  callback()
}

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'change'] }
  ],
  code: [{ validator: validateCode, trigger: 'blur' }],
  password: [{ validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirm, trigger: 'blur' }]
}

async function sendCode() {
  if (!form.email) {
    ElMessage.warning('请输入邮箱以接收验证码')
    return
  }
  // 简单前端格式校验，规则已在 el-form 中声明
  const emailRe = /^\S+@\S+\.\S+$/
  if (!emailRe.test(form.email)) {
    ElMessage.warning('邮箱格式不正确')
    return
  }
  try {
    // 示例接口：根据后端实际路径修改，如 '/auth/send-code' 或 '/send_email_code'
    await request.post('/auth/send-code', { email: form.email })
    sending.value = true
    count.value = 60
    timer = setInterval(() => {
      count.value -= 1
      if (count.value <= 0) {
        clearInterval(timer)
        sending.value = false
      }
    }, 1000)
    ElMessage.success('验证码已发送')
  } catch (err) {
    console.error('发送验证码失败', err)
  }
}

async function onRegister() {
  if (!registerForm.value) return
  registerForm.value.validate(async (valid) => {
    if (!valid) return
    try {
      // 示例接口：根据后端实际路径修改，如 '/auth/register'
      const res = await request.post('/auth/register', {
        email: form.email,
        code: form.code,
        password: form.password,
        role: form.role
      })
      ElMessage.success(res.msg || '注册成功')
      const token = res.data?.token || res.token
      if (token) {
        localStorage.setItem('token', token)
        router.push('/')
      } else {
        router.push('/login')
      }
    } catch (err) {
      console.error('注册失败', err)
    }
  })
}
</script>

<style scoped>
.auth-page { width:100%; display:flex; align-items:center; justify-content:center; padding:24px }
.card { width:100%; max-width:520px; padding:20px }
h2 { margin:0 0 12px 0; font-size:20px }
.code-row { display:flex; gap:12px }
.code-row .el-input { flex:1 }
.foot { margin-top:12px; display:flex; gap:8px; align-items:center; color:#445 }
.link { color:#409EFF; text-decoration:underline }

@media (max-width:480px){ .card{ padding:14px } .code-row{ flex-direction:column } .code-row .el-button{ width:100% } }
</style>
