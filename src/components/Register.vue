<template>
  <div class="register-page">
    <div class="ambient ambient-left" />
    <div class="ambient ambient-right" />

    <header class="topbar">
      <div class="brand">
        <span class="brand-dot" />
        <span class="brand-text">编程 AI 助教</span>
      </div>
      <div class="topbar-actions">
        <button class="ghost-btn" @click="goShowcase">返回</button>
        <button class="solid-btn" @click="goLogin">去登录</button>
      </div>
    </header>

    <main class="register-shell">
      <section class="intro-card">
        <p class="eyebrow">Create Account</p>
        <h1>创建账号，开始你的训练计划</h1>
        <p class="intro-copy">
          通过邮箱验证码快速注册，完成后即可进入个人主页继续刷题与 AI 学习。
        </p>
        <ul class="intro-list">
          <li>验证码注册，减少误注册风险</li>
          <li>自动同步个人做题统计和进度</li>
          <li>支持后续昵称审核与账号管理流程</li>
        </ul>
      </section>

      <section class="auth-card">
        <div class="card-head">
          <span class="pulse" />
          <span>账号注册</span>
        </div>

        <el-form
          ref="registerForm"
          :model="form"
          :rules="rules"
          label-position="top"
          class="form"
          @submit.prevent="onRegister"
        >
          <el-form-item prop="email" label="邮箱">
            <el-input
              v-model="form.email"
              placeholder="请输入邮箱"
              clearable
              autocomplete="email"
            />
          </el-form-item>

          <el-form-item prop="code" label="验证码">
            <div class="code-row">
              <el-input
                v-model="form.code"
                placeholder="请输入 6 位验证码"
                clearable
                maxlength="6"
              />
              <el-button
                class="send-code-btn"
                type="primary"
                plain
                :disabled="sending"
                @click="sendCode"
              >
                {{ sending ? `${count}s` : '发送验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item prop="password" label="设置密码">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="至少 8 位，包含字母和数字"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>

          <el-form-item prop="confirmPassword" label="确认密码">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>

          <el-form-item>
            <el-button class="register-btn" type="primary" native-type="submit" :loading="registering">
              注册并开始
            </el-button>
          </el-form-item>
        </el-form>

        <div class="foot">
          <span>已有账号？</span>
          <router-link to="/login" class="link">立即登录</router-link>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onBeforeUnmount, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = reactive({ email: '', code: '', password: '', confirmPassword: '' })
const registerForm = ref(null)
const sending = ref(false)
const count = ref(60)
const registering = ref(false)
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
  const re = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
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

function unwrapResponse(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return unwrapResponse(payload.data)
  }
  return payload
}

function goShowcase() {
  router.push('/showcase')
}

function goLogin() {
  router.push('/login')
}

function resetCountdown() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  sending.value = false
}

function startCountdown() {
  resetCountdown()
  sending.value = true
  count.value = 60
  timer = setInterval(() => {
    count.value -= 1
    if (count.value <= 0) {
      resetCountdown()
    }
  }, 1000)
}

async function sendCode() {
  if (!form.email) {
    ElMessage.warning('请输入邮箱以接收验证码')
    return
  }

  const emailRe = /^\S+@\S+\.\S+$/
  if (!emailRe.test(form.email)) {
    ElMessage.warning('邮箱格式不正确')
    return
  }

  try {
    await request.post('/api/auth/send-verification-code/', { email: form.email })
    startCountdown()
    ElMessage.success('验证码已发送')
  } catch (err) {
    console.error('发送验证码失败', err)
    const errorMessage =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.detail ||
      err?.message ||
      '发送验证码失败，请稍后重试'
    ElMessage.error(errorMessage)
  }
}

async function onRegister() {
  if (!registerForm.value) return

  registerForm.value.validate(async (valid) => {
    if (!valid) return
    registering.value = true

    try {
      await request.post('/api/auth/verify-code/', {
        email: form.email,
        code: form.code
      })

      const res = await request.post('/api/auth/register-with-code/', {
        email: form.email,
        code: form.code,
        password: form.password
      })

      const responseData = unwrapResponse(res) || {}
      const token = responseData.token || responseData.access

      ElMessage.success(responseData.msg || responseData.message || '注册成功')

      if (token) {
        localStorage.setItem('token', token)
        localStorage.setItem('access_token', token)
        localStorage.setItem('jwt_token', token)
        router.push('/main')
        return
      }

      router.push('/login')
    } catch (err) {
      console.error('注册失败', err)
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.detail ||
        err?.message ||
        '注册失败，请检查信息后重试'
      ElMessage.error(errorMessage)
    } finally {
      registering.value = false
    }
  })
}

onBeforeUnmount(() => {
  resetCountdown()
})
</script>

<style scoped>
:global(body) {
  background: #f6f8fb;
}

.register-page {
  --accent: #ff6b35;
  --accent-2: #0f6fff;
  --ink: #17233a;
  --muted: #58637b;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  padding: 22px;
  color: var(--ink);
  font-family: 'Lexend', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  text-align: left;
  background:
    radial-gradient(circle at 10% 12%, #ffe0d2 0%, transparent 34%),
    radial-gradient(circle at 88% 6%, #d8e8ff 0%, transparent 36%),
    linear-gradient(165deg, #fefefe 0%, #eef4ff 100%);
}

.ambient {
  position: absolute;
  pointer-events: none;
  filter: blur(30px);
  opacity: 0.5;
  z-index: 0;
}

.ambient-left {
  width: 280px;
  height: 280px;
  left: -120px;
  top: 260px;
  background: #ffc7a2;
}

.ambient-right {
  width: 340px;
  height: 340px;
  right: -140px;
  top: 120px;
  background: #b7d0ff;
}

.topbar,
.register-shell {
  position: relative;
  z-index: 1;
}

.topbar {
  max-width: 1120px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: linear-gradient(120deg, var(--accent), var(--accent-2));
  box-shadow: 0 0 0 6px rgba(255, 107, 53, 0.12);
}

.brand-text {
  font-size: 18px;
  font-weight: 700;
}

.topbar-actions {
  display: flex;
  gap: 10px;
}

.register-shell {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 22px;
}

.intro-card,
.auth-card {
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(23, 35, 58, 0.08);
  border-radius: 18px;
  backdrop-filter: blur(6px);
  box-shadow: 0 10px 28px rgba(22, 36, 64, 0.08);
}

.intro-card {
  padding: 30px;
  animation: riseIn 0.5s ease;
}

.eyebrow {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: #fff2eb;
  color: #b54708;
}

.intro-card h1 {
  margin: 14px 0 14px;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.12;
  letter-spacing: -0.01em;
  max-width: 13ch;
}

.intro-copy {
  margin: 0;
  max-width: 34ch;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.65;
}

.intro-list {
  margin: 22px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.intro-list li {
  padding: 11px 12px;
  border-radius: 12px;
  font-size: 14px;
  color: #2c3b59;
  background: #f8fbff;
  border: 1px solid #e6edf9;
}

.auth-card {
  padding: 22px 22px 16px;
  animation: riseIn 0.7s ease;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 12px;
}

.pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #16a34a;
  box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.6);
  animation: pulse 1.8s infinite;
}

.form {
  margin-top: 6px;
}

:deep(.el-form-item__label) {
  color: #33425f;
  font-weight: 600;
}

:deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 0 0 1px #d6ddeb inset;
}

:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #8cb4ff inset;
}

.code-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.code-row .el-input {
  flex: 1;
}

.send-code-btn {
  min-width: 110px;
  height: 40px;
  border-radius: 10px;
  border-color: #cdd8ea;
  color: #1f2d48;
}

.send-code-btn:disabled {
  opacity: 0.75;
}

.register-btn {
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(120deg, var(--accent), #ff844b);
  box-shadow: 0 8px 18px rgba(255, 107, 53, 0.32);
}

.register-btn:hover {
  transform: translateY(-1px);
}

.foot {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #44536f;
}

.link {
  color: #0f6fff;
  text-decoration: underline;
}

.solid-btn,
.ghost-btn {
  border: none;
  cursor: pointer;
  border-radius: 10px;
  font-family: inherit;
  font-weight: 600;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.solid-btn {
  background: linear-gradient(120deg, var(--accent), #ff844b);
  color: #fff;
  padding: 10px 16px;
  box-shadow: 0 8px 18px rgba(255, 107, 53, 0.32);
}

.solid-btn:hover {
  transform: translateY(-1px);
}

.ghost-btn {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.78);
  color: #1f2d48;
  border: 1px solid #d9e1ee;
}

.ghost-btn:hover {
  background: #fff;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.6);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(22, 163, 74, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(22, 163, 74, 0);
  }
}

@keyframes riseIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 960px) {
  .register-shell {
    grid-template-columns: 1fr;
  }

  .intro-card h1 {
    max-width: 17ch;
  }
}

@media (max-width: 720px) {
  .register-page {
    padding: 14px;
  }

  .topbar {
    margin-bottom: 14px;
  }

  .brand-text {
    font-size: 16px;
  }

  .topbar-actions {
    gap: 8px;
  }

  .ghost-btn,
  .solid-btn {
    padding: 8px 12px;
    font-size: 13px;
  }

  .intro-card {
    padding: 22px 18px;
  }

  .intro-copy {
    max-width: none;
    font-size: 14px;
  }

  .auth-card {
    padding: 18px 14px 14px;
  }

  .code-row {
    flex-direction: column;
    align-items: stretch;
  }

  .send-code-btn {
    width: 100%;
  }
}
</style>
