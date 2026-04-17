<template>
  <div class="showcase-page">
    <div class="ambient ambient-left" />
    <div class="ambient ambient-right" />

    <header class="topbar">
      <div class="brand">
        <span class="brand-dot" />
        <span class="brand-text">编程 AI 助教</span>
      </div>
      <div class="topbar-actions">
        <button class="ghost-btn" @click="goLogin">登录</button>
        <button class="solid-btn" @click="goRegister">免费注册</button>
      </div>
    </header>

    <main class="hero">
      <section class="hero-main">
        <p class="eyebrow">AI Coding Co-Pilot</p>
        <h1>把刷题、调试、讲解，放进同一条学习流</h1>
        <p class="subtext">
          从题目理解到代码调优，全流程由 AI 助教陪你练。更快定位问题，更清楚理解思路。
        </p>
        <div class="hero-actions">
          <button class="solid-btn large" @click="goToStart">
            {{ hasToken ? '进入学习主页' : '立即体验' }}
          </button>
          <button class="ghost-btn large" @click="goLogin">已有账号，去登录</button>
        </div>
      </section>

      <section class="hero-panel">
        <div class="panel-head">
          <span class="pulse" />
          <span>实时学习面板</span>
        </div>
        <div class="panel-grid">
          <article class="panel-card">
            <h3>题目训练</h3>
            <p>按难度分层练习，自动同步个人完成记录</p>
          </article>
          <article class="panel-card">
            <h3>AI 判题</h3>
            <p>提交后即时反馈，定位错误更高效</p>
          </article>
          <article class="panel-card">
            <h3>智能讲解</h3>
            <p>支持追问与对比讲解，真正理解而不是记答案</p>
          </article>
          <article class="panel-card">
            <h3>管理后台</h3>
            <p>用户、题目、昵称审核统一管理</p>
          </article>
        </div>
      </section>
    </main>

    <section class="metrics">
      <article class="metric">
        <div class="metric-value">192+</div>
        <div class="metric-label">题库规模</div>
      </article>
      <article class="metric">
        <div class="metric-value">3s</div>
        <div class="metric-label">平均反馈延迟</div>
      </article>
      <article class="metric">
        <div class="metric-value">多角色</div>
        <div class="metric-label">学员/管理员协作</div>
      </article>
    </section>

    <footer class="footer-cta">
      <p>准备好开始你的下一次高质量练习了吗？</p>
      <button class="solid-btn" @click="goToFooterAction">{{ hasToken ? '继续学习' : '创建账号' }}</button>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

const hasToken = computed(() => {
  return Boolean(
    localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('jwt_token')
  )
})

function goLogin() {
  router.push('/login')
}

function goRegister() {
  router.push('/register')
}

async function ensureLoggedIn() {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('jwt_token')

  if (!token) return false

  try {
    await request.get('/api/auth/jwt/me/')
    return true
  } catch (error) {
    localStorage.removeItem('token')
    localStorage.removeItem('access_token')
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('is_admin')
    localStorage.removeItem('user_info')
    return false
  }
}

async function goToStart() {
  const loggedIn = await ensureLoggedIn()
  if (!loggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  router.push('/main')
}

function goToFooterAction() {
  router.push(hasToken.value ? '/login' : '/register')
}
</script>

<style scoped>
:global(body) {
  background: #f6f8fb;
}

.showcase-page {
  --accent: #ff6b35;
  --accent-2: #0f6fff;
  --ink: #17233a;
  --muted: #58637b;
  --paper: #ffffff;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  padding: 22px 22px 40px;
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
  top: 280px;
  background: #ffc7a2;
}

.ambient-right {
  width: 340px;
  height: 340px;
  right: -140px;
  top: 160px;
  background: #b7d0ff;
}

.topbar,
.hero,
.metrics,
.footer-cta {
  position: relative;
  z-index: 1;
}

.topbar {
  max-width: 1120px;
  margin: 0 auto 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  letter-spacing: 0.01em;
}

.topbar-actions {
  display: flex;
  gap: 10px;
}

.hero {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 22px;
}

.hero-main,
.hero-panel {
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(23, 35, 58, 0.08);
  border-radius: 18px;
  backdrop-filter: blur(6px);
  box-shadow: 0 10px 28px rgba(22, 36, 64, 0.08);
}

.hero-main {
  padding: 30px 30px 34px;
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

.hero-main h1 {
  margin: 14px 0 14px;
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.12;
  letter-spacing: -0.01em;
  max-width: 13ch;
}

.subtext {
  margin: 0;
  max-width: 38ch;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.65;
}

.hero-actions {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-panel {
  padding: 20px 20px 18px;
  animation: riseIn 0.7s ease;
}

.panel-head {
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

.panel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.panel-card {
  background: #f9fbff;
  border-radius: 12px;
  border: 1px solid #e6edf9;
  padding: 12px;
}

.panel-card h3 {
  margin: 0 0 6px;
  font-size: 14px;
}

.panel-card p {
  margin: 0;
  color: #5a667e;
  font-size: 12px;
  line-height: 1.55;
}

.metrics {
  max-width: 1120px;
  margin: 18px auto 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric {
  background: var(--paper);
  border-radius: 14px;
  border: 1px solid #e9edf5;
  padding: 16px;
  box-shadow: 0 6px 18px rgba(22, 36, 64, 0.06);
}

.metric-value {
  font-size: 26px;
  font-weight: 700;
}

.metric-label {
  margin-top: 4px;
  color: #5e6a81;
  font-size: 13px;
}

.footer-cta {
  max-width: 1120px;
  margin: 20px auto 0;
  padding: 16px 18px;
  border-radius: 14px;
  background: linear-gradient(110deg, #11253c, #1f3f67);
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.footer-cta p {
  margin: 0;
  font-size: 15px;
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

.large {
  padding: 12px 18px;
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

@media (max-width: 980px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero-main h1 {
    max-width: 17ch;
  }
}

@media (max-width: 720px) {
  .showcase-page {
    padding: 14px 14px 26px;
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

  .hero-main {
    padding: 22px 18px;
  }

  .hero-main h1 {
    margin-top: 10px;
    max-width: none;
  }

  .subtext {
    max-width: none;
    font-size: 14px;
  }

  .hero-panel {
    padding: 16px 14px;
  }

  .panel-grid {
    grid-template-columns: 1fr;
  }

  .metrics {
    grid-template-columns: 1fr;
  }

  .footer-cta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
