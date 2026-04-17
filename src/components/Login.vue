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
        <button class="solid-btn" @click="goRegister">免费注册</button>
      </div>
    </header>

    <main class="register-shell">
      <section class="intro-card">
        <p class="eyebrow">Welcome Back</p>
        <h1>继续你的刷题训练流程</h1>
        <p class="intro-copy">
          登录后可同步题目进度、查看个人统计、继续 AI 讲解与判题记录。
        </p>
        <ul class="intro-list">
          <li>自动恢复上次学习路径</li>
          <li>按账号同步已完成题目与难度分布</li>
          <li>管理员账号可直接进入审核与管理后台</li>
        </ul>
      </section>

      <section class="auth-card">
        <div class="card-head">
          <span class="pulse" />
          <span>账号登录</span>
        </div>

        <el-form
          ref="loginForm"
          :model="form"
          :rules="rules"
          label-position="top"
          class="form"
          @submit.prevent="onLogin"
        >
          <el-form-item prop="username" label="账号（邮箱/用户名）">
            <el-input
              v-model="form.username"
              placeholder="请输入邮箱或用户名"
              clearable
              autocomplete="username"
            />
          </el-form-item>

          <el-form-item prop="password" label="密码">
            <el-input
              v-model="form.password"
              placeholder="请输入密码"
              show-password
              type="password"
              autocomplete="current-password"
            />
          </el-form-item>

          <el-form-item prop="captcha_code" label="图片验证码">
            <div class="captcha-row">
              <el-input
                v-model="form.captcha_code"
                placeholder="请输入图片验证码"
                clearable
                maxlength="8"
                autocomplete="off"
              />
              <button
                type="button"
                class="captcha-preview"
                :disabled="captchaLoading"
                @click="fetchCaptcha()"
              >
                <img v-if="captcha.image" :src="captcha.image" alt="captcha" />
                <span v-else class="captcha-text">{{ captchaLoading ? '加载中...' : '点击获取' }}</span>
              </button>
            </div>
            <button
              type="button"
              class="captcha-refresh"
              :disabled="captchaLoading"
              @click="fetchCaptcha()"
            >
              看不清？换一张
            </button>
          </el-form-item>

          <el-form-item>
            <el-button class="register-btn" type="primary" native-type="submit" :loading="loading">
              登录并进入
            </el-button>
          </el-form-item>
        </el-form>

        <div class="foot">
          <span>还没有账号？</span>
          <router-link to="/register" class="link">创建账号</router-link>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()
const form = reactive({ username: '', password: '', captcha_code: '' })
const loginForm = ref(null)
const loading = ref(false)
const captchaLoading = ref(false)
const captcha = reactive({ id: '', image: '' })

const validatePassword = (rule, value, callback) => {
  if (!value) return callback(new Error('请输入密码'))
  const re = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
  if (!re.test(value)) return callback(new Error('密码至少8位，需包含字母和数字'))
  callback()
}

const validateCaptcha = (rule, value, callback) => {
  if (!value) return callback(new Error('请输入验证码'))
  if (value.trim().length < 4) return callback(new Error('验证码格式不正确'))
  callback()
}

const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, message: '账号至少3位', trigger: 'blur' }
  ],
  password: [{ validator: validatePassword, trigger: 'blur' }],
  captcha_code: [{ validator: validateCaptcha, trigger: 'blur' }]
}

function unwrapResponse(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return unwrapResponse(payload.data)
  }
  return payload
}

async function fetchUserInfo(token) {
  try {
    const response = await request.get('/api/auth/jwt/me/', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    const userData = unwrapResponse(response)?.user || unwrapResponse(response)
    if (userData && typeof userData === 'object' && !Array.isArray(userData)) {
      const isAdmin = Boolean(userData.is_staff || userData.is_admin || userData.role === 'admin')
      localStorage.setItem('is_admin', isAdmin ? 'true' : 'false')
      localStorage.setItem('user_info', JSON.stringify(userData))
      return isAdmin
    }
    localStorage.setItem('is_admin', 'false')
    return false
  } catch (error) {
    console.error('获取用户信息失败:', error)
    localStorage.setItem('is_admin', 'false')
    return false
  }
}

function goShowcase() {
  router.push('/showcase')
}

function goRegister() {
  router.push('/register')
}

function normalizeCaptchaImage(rawImage) {
  if (!rawImage || typeof rawImage !== 'string') return ''

  const value = rawImage.trim()
  if (!value) return ''
  if (value.startsWith('data:image/')) return value
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) return value
  if (value.includes('<svg')) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`
  }
  return `data:image/svg+xml;base64,${value}`
}

function extractCaptchaPayload(raw) {
  const payload = unwrapResponse(raw) || {}
  const nested = payload.captcha && typeof payload.captcha === 'object' ? payload.captcha : payload
  const id =
    nested.captcha_id || nested.captchaId || nested.id || nested.key || nested.uuid || nested.token || ''
  const imageRaw =
    nested.captcha_svg ||
    nested.svg ||
    nested.image_data ||
    nested.captcha_image ||
    nested.image ||
    nested.image_url ||
    nested.url ||
    ''

  return {
    id: String(id || ''),
    image: normalizeCaptchaImage(String(imageRaw || ''))
  }
}

async function fetchCaptcha(options = {}) {
  const { silent = false } = options
  captchaLoading.value = true

  try {
    const res = await request.get('/api/auth/captcha/')
    const data = extractCaptchaPayload(res)
    if (!data.id || !data.image) {
      throw new Error('验证码响应格式异常')
    }

    captcha.id = data.id
    captcha.image = data.image
    form.captcha_code = ''
  } catch (err) {
    console.error('获取验证码失败', err)
    captcha.id = ''
    captcha.image = ''
    if (!silent) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.detail ||
        err?.message ||
        '验证码加载失败，请重试'
      ElMessage.error(errorMessage)
    }
  } finally {
    captchaLoading.value = false
  }
}

async function onLogin() {
  if (!loginForm.value) return

  loginForm.value.validate(async (valid) => {
    if (!valid) return
    if (!captcha.id) {
      ElMessage.warning('验证码尚未就绪，请刷新后再试')
      await fetchCaptcha({ silent: true })
      return
    }

    loading.value = true

    try {
      const res = await request.post('/api/auth/jwt/login/', {
        username: form.username,
        password: form.password,
        captcha_id: captcha.id,
        captcha_code: form.captcha_code.trim()
      })

      const authData = unwrapResponse(res) || {}
      const access = authData.access
      const refresh = authData.refresh

      if (!access) {
        ElMessage.error('登录响应缺少令牌，请联系管理员')
        return
      }

      localStorage.setItem('token', access)
      localStorage.setItem('access_token', access)
      localStorage.setItem('jwt_token', access)
      if (refresh) localStorage.setItem('refresh_token', refresh)

      const isAdmin = await fetchUserInfo(access)
      ElMessage.success('登录成功')

      const redirectPath = sessionStorage.getItem('redirectAfterLogin')
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin')
        router.push(redirectPath)
        return
      }

      router.push(isAdmin ? '/admin' : '/main')
    } catch (err) {
      console.error('登录失败', err)
      const backendPayload = err?.response?.data || err || {}
      const businessCode =
        backendPayload.business_code || backendPayload.code || backendPayload.error_code || ''

      const errorMap = {
        CAPTCHA_REQUIRED: '请先输入验证码',
        CAPTCHA_INVALID: '验证码错误，请重试',
        CAPTCHA_EXPIRED: '验证码已过期，请重新获取',
        CAPTCHA_TOO_MANY_ATTEMPTS: '验证码错误次数过多，请稍后重试'
      }

      const errorMessage =
        errorMap[businessCode] ||
        backendPayload.detail ||
        backendPayload.message ||
        backendPayload.msg ||
        err?.message ||
        '登录失败，请检查账号密码'
      ElMessage.error(errorMessage)
      await fetchCaptcha({ silent: true })
    } finally {
      loading.value = false
    }
  })
}

onMounted(() => {
  fetchCaptcha({ silent: true })
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

.captcha-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.captcha-row .el-input {
  flex: 1;
}

.captcha-preview {
  width: 132px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #d8e1ef;
  background: #f9fbff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
}

.captcha-preview img {
  width: 100%;
  height: 100%;
  display: block;
}

.captcha-preview:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.captcha-text {
  font-size: 12px;
  color: #56627a;
}

.captcha-refresh {
  margin-top: 8px;
  border: none;
  background: transparent;
  color: #0f6fff;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.captcha-refresh:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

  .captcha-row {
    flex-direction: column;
    align-items: stretch;
  }

  .captcha-preview {
    width: 100%;
  }
}
</style>
