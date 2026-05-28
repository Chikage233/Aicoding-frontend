<template>
  <div class="profile-page">
    <nav class="navbar">
      <div class="navbar-left">
        <span class="system-name">编程 AI 助教</span>
      </div>
      <div class="navbar-right">
        <button @click="goBack" class="back-button">返回</button>
      </div>
    </nav>

    <div class="main-content">
      <section class="page-intro">
        <div>
          <p class="page-eyebrow">个人工作台</p>
          <h1>个人中心</h1>
          <p class="page-subtitle">把常用操作放在手边，让资料维护更轻松。</p>
        </div>
      </section>

      <div v-if="profileLoading" class="profile-loading-card">正在加载个人资料...</div>

      <div v-else class="profile-layout">
        <aside class="profile-sidebar">
          <section class="summary-card">
            <img :src="displayAvatar" alt="头像" class="avatar-large" />
            <h2>{{ user.displayName || user.username || '暂无用户名' }}</h2>
            <p class="summary-contact">{{ user.email && user.email !== '-' ? user.email : user.phone || '暂无联系方式' }}</p>

            <p v-if="nicknameStatusTag" class="summary-status">
              <span class="nickname-status-badge" :class="`nickname-status-${nicknameStatusTag.type}`">
                {{ nicknameStatusTag.text }}
              </span>
              <span v-if="user.nicknameRejectReason" class="nickname-reject-reason">
                {{ user.nicknameRejectReason }}
              </span>
            </p>

            <p class="header-bio">{{ user.bio || '暂无个人简介' }}</p>

            <div class="completeness">
              <div class="completeness-meta">
                <span>资料完整度</span>
                <strong>{{ profileCompleteness }}%</strong>
              </div>
              <div class="completeness-track" aria-hidden="true">
                <span class="completeness-fill" :style="{ width: `${profileCompleteness}%` }"></span>
              </div>
            </div>

            <div class="user-tags">
              <span class="user-tag">账号：{{ user.username || '-' }}</span>
              <span class="user-tag">{{ contactStatusText }}</span>
            </div>

            <div class="sidebar-actions">
              <button type="button" class="profile-action-btn light" @click="goPersonalizedExercises">
                个性化习题
              </button>
              <button type="button" class="profile-action-btn light" @click="goToAIChat">
                AI 助手
              </button>
            </div>
          </section>

          <section class="overview-card">
            <h3>账号概览</h3>
            <div class="overview-item">
              <span>注册时间</span>
              <strong>{{ user.registerDate || '未知' }}</strong>
            </div>
            <div class="overview-item">
              <span>邮箱</span>
              <strong>{{ user.email || '未设置邮箱' }}</strong>
            </div>
            <div class="overview-item">
              <span>手机号</span>
              <strong>{{ user.phone || '未设置手机号' }}</strong>
            </div>
          </section>
        </aside>

        <div class="profile-main">
          <section class="panel-card">
            <h3>个人信息</h3>
            <p class="section-hint">更新昵称、头像及个人资料，保存后即时生效。</p>

            <div class="info-item">
              <div class="info-label">昵称:</div>
              <div class="info-value">
                <template v-if="isEditing">
                  <input
                    v-model="editForm.nickname"
                    class="field-input"
                    type="text"
                    maxlength="20"
                    placeholder="请输入昵称"
                  />
                  <div class="nickname-audit-tip">
                    2-20位，仅支持中文/英文/数字/_/-，禁止冒充官方身份
                  </div>
                </template>
                <template v-else>{{ user.nickname || '-' }}</template>
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">头像:</div>
              <div class="info-value">
                <template v-if="isEditing">
                  <div v-if="avatarPresetLoading" class="avatar-presets-state">头像加载中...</div>
                  <div v-else-if="!avatarPresets.length" class="avatar-presets-state">
                    暂无可选择的头像
                  </div>
                  <div v-else class="avatar-presets-grid">
                    <button
                      v-for="preset in avatarPresets"
                      :key="preset"
                      type="button"
                      class="avatar-preset-btn"
                      :class="{ active: editForm.avatar === preset }"
                      @click="selectAvatar(preset)"
                    >
                      <img :src="preset" alt="avatar-preset" />
                    </button>
                  </div>
                  <div class="avatar-presets-tip">仅支持平台预置头像</div>
                </template>
                <template v-else>
                  <span>已选择预置头像</span>
                </template>
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">生日:</div>
              <div class="info-value">
                <template v-if="isEditing">
                  <input v-model="editForm.birthday" class="field-input" type="date" />
                </template>
                <template v-else>{{ formatBirthday(user.birthday) }}</template>
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">性别:</div>
              <div class="info-value">
                <template v-if="isEditing">
                  <select v-model="editForm.gender" class="field-input">
                    <option value="">请选择</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                  </select>
                </template>
                <template v-else>{{ formatGender(user.gender) }}</template>
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">个人简介:</div>
              <div class="info-value bio-display">
                <template v-if="isEditing">
                  <textarea
                    v-model="editForm.bio"
                    class="field-input bio-input"
                    rows="3"
                    placeholder="请输入个人简介"
                  ></textarea>
                </template>
                <template v-else>{{ user.bio || '-' }}</template>
              </div>
            </div>

            <div class="action-row">
              <button v-if="!isEditing" type="button" class="profile-action-btn" @click="startEdit">
                编辑资料
              </button>
              <template v-else>
                <button type="button" class="profile-action-btn secondary" @click="cancelEdit">取消</button>
                <button type="button" class="profile-action-btn" :disabled="saving || !isEditDirty" @click="saveProfile">
                  {{ saving ? '保存中...' : isEditDirty ? '保存' : '无变更' }}
                </button>
              </template>
            </div>
          </section>

          <section class="panel-card">
            <h3>账户安全</h3>
            <p class="section-hint">以下信息用于登录与通知，请保持可用。</p>
            <div class="info-item">
              <div class="info-label">注册邮箱:</div>
              <div class="info-value">{{ user.email || '未设置邮箱' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">手机号:</div>
              <div class="info-value">{{ user.phone || '未设置手机号' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">密码:</div>
              <div class="info-value">••••••••</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const NICKNAME_MIN_LENGTH = 2
const NICKNAME_MAX_LENGTH = 20
const NICKNAME_ALLOWED_REGEX = /^[\u4e00-\u9fa5A-Za-z0-9_-]+$/
const NICKNAME_FORBIDDEN_WORDS = [
  'admin',
  'administrator',
  'official',
  'system',
  'root',
  'gm',
  '客服',
  '官方',
  '管理员',
  '系统'
]
const DEFAULT_AVATAR = 'https://i.pravatar.cc/100?img=3'

export default {
  name: 'ProfilePage',
  data() {
    return {
      user: {
        username: '',
        displayName: '',
        nickname: '',
        nicknameStatus: '',
        nicknameRejectReason: '',
        avatar: '',
        email: '',
        phone: '',
        bio: '',
        birthday: '',
        gender: '',
        registerDate: ''
      },
      isEditing: false,
      saving: false,
      avatarPresetLoading: false,
      avatarPresets: [],
      editForm: {
        nickname: '',
        avatar: '',
        birthday: '',
        gender: '',
        bio: ''
      },
      profileLoading: false
    }
  },
  computed: {
    nicknameStatusTag() {
      const status = this.normalizeNicknameStatus(this.user.nicknameStatus)
      if (status === 'pending') return { text: '审核中', type: 'pending' }
      if (status === 'rejected') return { text: '已驳回', type: 'rejected' }
      return null
    },
    displayAvatar() {
      const candidate = this.isEditing ? this.editForm.avatar : this.user.avatar
      return this.normalizeAvatar(candidate) || DEFAULT_AVATAR
    },
    contactStatusText() {
      const email = String(this.user.email || '').trim()
      const phone = String(this.user.phone || '').trim()
      if (email && email !== '-') return '邮箱已绑定'
      if (phone && phone !== '-') return '手机已绑定'
      return '未绑定联系方式'
    },
    profileCompleteness() {
      const checks = [
        Boolean(this.normalizeNickname(this.user.nickname) && this.user.nickname !== '-'),
        Boolean(this.normalizeAvatar(this.user.avatar)),
        Boolean(this.normalizeBirthday(this.user.birthday)),
        Boolean(this.normalizeGender(this.user.gender)),
        Boolean(this.user.bio && this.user.bio !== '-' && this.user.bio !== '暂无个人简介'),
        Boolean(
          (this.user.email && this.user.email !== '-') || (this.user.phone && this.user.phone !== '-')
        )
      ]
      const filled = checks.filter(Boolean).length
      return Math.round((filled / checks.length) * 100)
    },
    isEditDirty() {
      const nicknameCurrent = this.normalizeNickname(this.user.nickname === '-' ? '' : this.user.nickname)
      const birthdayCurrent = this.normalizeBirthday(this.user.birthday)
      const genderCurrent = this.normalizeGender(this.user.gender)
      const bioCurrent =
        this.user.bio && this.user.bio !== '-' && this.user.bio !== '暂无个人简介'
          ? String(this.user.bio).trim()
          : ''
      const avatarCurrent = this.normalizeAvatar(this.user.avatar)

      const nicknameNext = this.normalizeNickname(this.editForm.nickname)
      const birthdayNext = this.normalizeBirthday(this.editForm.birthday)
      const genderNext = this.normalizeGender(this.editForm.gender)
      const bioNext = String(this.editForm.bio || '').trim()
      const avatarNext = this.normalizeAvatar(this.editForm.avatar)

      return (
        nicknameCurrent !== nicknameNext ||
        birthdayCurrent !== birthdayNext ||
        genderCurrent !== genderNext ||
        bioCurrent !== bioNext ||
        avatarCurrent !== avatarNext
      )
    }
  },
  methods: {
    unwrapData(payload, depth = 0) {
      if (depth > 6 || payload == null) return payload
      if (Array.isArray(payload)) return payload
      if (typeof payload !== 'object') return payload

      if (Object.prototype.hasOwnProperty.call(payload, 'data')) {
        const next = payload.data
        if (next !== undefined) return this.unwrapData(next, depth + 1)
      }
      return payload
    },

    extractUser(payload) {
      const obj = this.unwrapData(payload) || {}
      if (obj.user && typeof obj.user === 'object') return obj.user
      if (obj.profile && typeof obj.profile === 'object') return obj.profile
      return obj
    },

    normalizeNickname(value) {
      return String(value || '').replace(/\s+/g, ' ').trim()
    },

    normalizeAvatar(value) {
      return String(value || '').trim()
    },

    normalizeBirthday(value) {
      if (!value) return ''
      if (typeof value === 'string') {
        const matched = value.match(/^(\d{4}-\d{2}-\d{2})/)
        if (matched) return matched[1]
      }
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    normalizeGender(value) {
      const text = String(value || '').trim().toLowerCase()
      if (!text) return ''
      if (['male', 'm', 'man', '男'].includes(text)) return 'male'
      if (['female', 'f', 'woman', '女'].includes(text)) return 'female'
      if (['other', '其他', 'unknown', '未知'].includes(text)) return 'other'
      return text
    },

    normalizeNicknameStatus(value) {
      const text = String(value || '').trim().toLowerCase()
      if (['pending', 'rejected', 'approved'].includes(text)) return text
      return ''
    },

    formatBirthday(value) {
      return this.normalizeBirthday(value) || '-'
    },

    formatGender(value) {
      const normalized = this.normalizeGender(value)
      if (normalized === 'male') return '男'
      if (normalized === 'female') return '女'
      if (normalized === 'other') return '其他'
      return '-'
    },

    pickRegisterDate(userInfo) {
      const candidates = [
        userInfo.register_date,
        userInfo.registerDate,
        userInfo.date_joined,
        userInfo.created_at,
        userInfo.createdAt,
        userInfo.created_time,
        userInfo.create_time,
        userInfo.registration_time
      ]
      for (const value of candidates) {
        if (value !== undefined && value !== null && String(value).trim() !== '') return value
      }
      return ''
    },

    formatDateTime(value) {
      if (value === undefined || value === null || value === '') return '-'

      let dateObj = null
      if (typeof value === 'number') {
        dateObj = new Date(value < 1e12 ? value * 1000 : value)
      } else {
        dateObj = new Date(value)
      }
      if (Number.isNaN(dateObj.getTime())) return String(value)
      return dateObj.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    extractDisplayName(userInfo, root) {
      const candidates = [
        userInfo?.display_name,
        userInfo?.displayName,
        userInfo?.nickname_approved,
        userInfo?.approved_nickname,
        root?.display_name,
        root?.displayName,
        root?.nickname_approved,
        root?.approved_nickname,
        userInfo?.username
      ]
      for (const candidate of candidates) {
        const text = String(candidate || '').trim()
        if (text && text !== '-') return text
      }
      return ''
    },

    collectAvatarPresetUrls(...sources) {
      const urls = []
      const pushUrl = (value) => {
        const text = this.normalizeAvatar(value)
        if (text) urls.push(text)
      }

      const walk = (item) => {
        if (!item) return
        if (Array.isArray(item)) {
          item.forEach(walk)
          return
        }
        if (typeof item === 'string') {
          pushUrl(item)
          return
        }
        if (typeof item !== 'object') return

        pushUrl(item.url)
        pushUrl(item.avatar)
        pushUrl(item.image)
        pushUrl(item.src)
        pushUrl(item.value)

        ;[
          'avatar_presets',
          'avatarPresets',
          'presets',
          'list',
          'items',
          'results',
          'data'
        ].forEach((key) => {
          if (item[key] !== undefined) walk(item[key])
        })
      }

      sources.forEach(walk)
      return Array.from(new Set(urls))
    },

    async fetchAvatarPresets(forceRefresh = false) {
      if (!forceRefresh && this.avatarPresets.length > 0) return this.avatarPresets

      this.avatarPresetLoading = true
      try {
        const response = await request.get('/api/auth/jwt/avatar-presets/')
        const presets = this.collectAvatarPresetUrls(response)
        if (presets.length) this.avatarPresets = presets
        return this.avatarPresets
      } catch (error) {
        console.error('获取预置头像失败:', error)
        return this.avatarPresets
      } finally {
        this.avatarPresetLoading = false
      }
    },

    fillEditForm() {
      this.editForm.nickname = this.user.nickname && this.user.nickname !== '-' ? this.user.nickname : ''
      this.editForm.birthday = this.normalizeBirthday(this.user.birthday)
      this.editForm.gender = this.normalizeGender(this.user.gender)
      this.editForm.bio = this.user.bio && this.user.bio !== '暂无个人简介' ? this.user.bio : ''

      const currentAvatar = this.normalizeAvatar(this.user.avatar)
      if (currentAvatar && (!this.avatarPresets.length || this.avatarPresets.includes(currentAvatar))) {
        this.editForm.avatar = currentAvatar
      } else if (this.avatarPresets.length) {
        this.editForm.avatar = this.avatarPresets[0]
      } else {
        this.editForm.avatar = currentAvatar || ''
      }
    },

    selectAvatar(avatarUrl) {
      const normalized = this.normalizeAvatar(avatarUrl)
      if (!normalized) return
      this.editForm.avatar = normalized
    },

    auditNickname(rawNickname) {
      const nickname = this.normalizeNickname(rawNickname)
      if (!nickname) return { passed: true, normalized: '', reason: '' }

      if (nickname.length < NICKNAME_MIN_LENGTH || nickname.length > NICKNAME_MAX_LENGTH) {
        return {
          passed: false,
          normalized: nickname,
          reason: `昵称长度需在 ${NICKNAME_MIN_LENGTH}-${NICKNAME_MAX_LENGTH} 个字符之间`
        }
      }

      if (!NICKNAME_ALLOWED_REGEX.test(nickname)) {
        return {
          passed: false,
          normalized: nickname,
          reason: '昵称仅支持中文、英文、数字、下划线和中划线'
        }
      }

      if (/(.)\1{4,}/.test(nickname)) {
        return {
          passed: false,
          normalized: nickname,
          reason: '昵称存在异常重复字符，请调整后再提交'
        }
      }

      const lowerNickname = nickname.toLowerCase()
      const hitWord = NICKNAME_FORBIDDEN_WORDS.find((word) =>
        lowerNickname.includes(String(word).toLowerCase())
      )
      if (hitWord) {
        return {
          passed: false,
          normalized: nickname,
          reason: `昵称包含敏感或保留词：${hitWord}`
        }
      }

      return { passed: true, normalized: nickname, reason: '' }
    },

    syncUserInfoToLocal() {
      try {
        const raw = localStorage.getItem('user_info')
        const existing = raw ? JSON.parse(raw) : {}
        const safeExisting = existing && typeof existing === 'object' ? existing : {}
        const merged = {
          ...safeExisting,
          username: this.user.username || safeExisting.username || '',
          nickname: this.user.nickname && this.user.nickname !== '-' ? this.user.nickname : '',
          display_name: this.user.displayName && this.user.displayName !== '-'
            ? this.user.displayName
            : safeExisting.display_name || '',
          nickname_status: this.normalizeNicknameStatus(this.user.nicknameStatus),
          nickname_reject_reason: this.user.nicknameRejectReason || '',
          avatar: this.user.avatar || safeExisting.avatar || '',
          email: this.user.email || safeExisting.email || '',
          phone: this.user.phone || safeExisting.phone || '',
          bio: this.user.bio && this.user.bio !== '暂无个人简介' ? this.user.bio : '',
          birthday: this.user.birthday && this.user.birthday !== '-' ? this.user.birthday : '',
          gender: this.user.gender && this.user.gender !== '-' ? this.user.gender : ''
        }
        localStorage.setItem('user_info', JSON.stringify(merged))
      } catch (error) {
        console.warn('同步本地 user_info 失败:', error)
      }
    },

    async startEdit() {
      this.isEditing = true
      await this.fetchAvatarPresets()
      this.fillEditForm()
    },

    cancelEdit() {
      this.isEditing = false
      this.fillEditForm()
    },

    buildProfilePayload() {
      return {
        nickname: this.normalizeNickname(this.editForm.nickname),
        bio: this.editForm.bio?.trim() || '',
        gender: this.editForm.gender || '',
        birthday: this.editForm.birthday || null,
        avatar: this.normalizeAvatar(this.editForm.avatar)
      }
    },

    async saveProfile() {
      this.saving = true
      try {
        const payload = this.buildProfilePayload()
        const nicknameAudit = this.auditNickname(payload.nickname)
        if (!nicknameAudit.passed) {
          ElMessage.warning(`昵称审核未通过：${nicknameAudit.reason}`)
          return
        }
        payload.nickname = nicknameAudit.normalized

        if (!this.avatarPresets.length) await this.fetchAvatarPresets()
        if (this.avatarPresets.length && !this.avatarPresets.includes(payload.avatar)) {
          ElMessage.warning('请选择平台预置头像')
          return
        }

        await request.patch('/api/auth/jwt/me/', payload)
        await this.fetchUserInfo(false)

        this.isEditing = false
        const status = this.normalizeNicknameStatus(this.user.nicknameStatus)
        if (payload.nickname) {
          if (status === 'pending') {
            ElMessage.success('昵称已提交审核，审核通过后生效')
          } else if (status === 'rejected') {
            ElMessage.warning('昵称当前为驳回状态，请根据原因修改后重试')
          } else {
            ElMessage.success('个人信息已保存')
          }
        } else {
          ElMessage.success('个人信息已保存')
        }
      } catch (error) {
        console.error('保存个人信息失败:', error)
        const detail =
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.message ||
          '保存失败'
        ElMessage.error(detail)
      } finally {
        this.saving = false
      }
    },

    async fetchUserInfo(showLoading = false) {
      if (showLoading) this.profileLoading = true
      try {
        const res = await request.get('/api/auth/jwt/me/')
        const root = this.unwrapData(res) || {}
        const userInfo = this.extractUser(res)

        const registerDateRaw = this.pickRegisterDate(userInfo)
        const nicknameStatus = this.normalizeNicknameStatus(
          userInfo.nickname_status ?? userInfo.nicknameStatus ?? root.nickname_status ?? root.nicknameStatus
        )
        const nicknameRejectReason = String(
          userInfo.nickname_reject_reason ??
          userInfo.reject_reason ??
          root.nickname_reject_reason ??
          root.reject_reason ??
          ''
        ).trim()
        const nicknameValue =
          userInfo.nickname ??
          userInfo.nickname_pending ??
          userInfo.pending_nickname ??
          userInfo.nickname_approved ??
          userInfo.display_name ??
          userInfo.username ??
          '-'
        const displayName = this.extractDisplayName(userInfo, root) || userInfo.username || '-'

        const avatarPresetsFromMe = this.collectAvatarPresetUrls(
          root.avatar_presets,
          root.avatarPresets,
          userInfo.avatar_presets,
          userInfo.avatarPresets
        )
        if (avatarPresetsFromMe.length) this.avatarPresets = avatarPresetsFromMe
        if (!this.avatarPresets.length) await this.fetchAvatarPresets()

        const avatarCandidate = this.normalizeAvatar(userInfo.avatar ?? root.avatar ?? '')
        const avatar = avatarCandidate || this.avatarPresets[0] || DEFAULT_AVATAR

        this.user = {
          username: userInfo.username || '未设置用户名',
          displayName,
          nickname: nicknameValue || '-',
          nicknameStatus,
          nicknameRejectReason,
          avatar,
          email: userInfo.email || '-',
          phone: userInfo.phone || '-',
          bio: userInfo.bio || '暂无个人简介',
          birthday: this.normalizeBirthday(userInfo.birthday) || '-',
          gender: this.normalizeGender(userInfo.gender) || '-',
          registerDate: this.formatDateTime(registerDateRaw)
        }

        this.fillEditForm()
        this.syncUserInfoToLocal()
      } catch (error) {
        console.error('获取用户信息失败:', error)
        const token =
          localStorage.getItem('token') ||
          localStorage.getItem('access_token') ||
          localStorage.getItem('jwt_token')
        if (!token) this.$router.push('/login')

        this.user = {
          username: '未登录',
          displayName: '未登录',
          nickname: '-',
          nicknameStatus: '',
          nicknameRejectReason: '',
          avatar: DEFAULT_AVATAR,
          email: '-',
          phone: '-',
          bio: '暂无个人简介',
          birthday: '-',
          gender: '-',
          registerDate: '-'
        }
        this.fillEditForm()
      } finally {
        if (showLoading) this.profileLoading = false
      }
    },

    goPersonalizedExercises() {
      this.$router.push('/personalized-exercises')
    },

    goToAIChat() {
      this.$router.push('/ai-chat')
    },

    goBack() {
      this.$router.push('/main')
    }
  },
  mounted() {
    this.fetchUserInfo(true)
  }
}
</script>

<style scoped>
.profile-page {
  --bg-base: #f4f1ea;
  --bg-soft: #f9f7f3;
  --card: #fffdf9;
  --card-soft: #f7f4ee;
  --text-strong: #2f3a32;
  --text-main: #465248;
  --text-muted: #768475;
  --line: #ddd9cf;
  --line-soft: #e8e3d9;
  --accent: #6f8b6f;
  --accent-deep: #5d745d;
  --accent-soft: #edf4ec;
  --danger-text: #9c3f36;
  --danger-bg: #fbe9e7;
  --danger-line: #e8c0ba;

  min-height: 100vh;
  width: 100%;
  background:
    radial-gradient(circle at 8% 0%, #e8f0e7 0, transparent 36%),
    radial-gradient(circle at 90% 10%, #f5ebe0 0, transparent 28%),
    var(--bg-base);
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  font-family: 'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei UI', sans-serif;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  background: rgba(255, 253, 249, 0.92);
  border-bottom: 1px solid var(--line-soft);
  backdrop-filter: blur(8px);
}

.navbar-left,
.navbar-right {
  display: flex;
  align-items: center;
}

.system-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: 0.01em;
}

.back-button {
  border: none;
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  color: var(--accent-deep);
  background: var(--accent-soft);
  border: 1px solid #d4e0d1;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #e3eee1;
}

.main-content {
  max-width: 1220px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 18px 34px;
  box-sizing: border-box;
}

.page-intro {
  background: linear-gradient(130deg, #fdfbf7, #f6f1e8);
  border: 1px solid var(--line-soft);
  border-radius: 20px;
  box-shadow: 0 10px 26px rgba(64, 55, 42, 0.08);
  padding: 24px 24px 22px;
  margin-bottom: 16px;
}

.page-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  color: #7e8f7e;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-intro h1 {
  margin: 0;
  font-size: 30px;
  color: var(--text-strong);
}

.page-subtitle {
  margin: 10px 0 0;
  color: var(--text-main);
  font-size: 15px;
}

.profile-loading-card {
  background: var(--card);
  border: 1px solid var(--line-soft);
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(64, 55, 42, 0.08);
  text-align: center;
  padding: 48px 20px;
  font-size: 15px;
  color: var(--text-muted);
}

.profile-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-card,
.overview-card,
.panel-card {
  background: var(--card);
  border: 1px solid var(--line-soft);
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(64, 55, 42, 0.08);
}

.summary-card {
  padding: 20px 18px;
  text-align: center;
}

.avatar-large {
  width: 98px;
  height: 98px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #dbe3d8;
  box-shadow: 0 10px 22px rgba(64, 55, 42, 0.16);
}

.summary-card h2 {
  margin: 12px 0 0;
  font-size: 23px;
  color: var(--text-strong);
  font-weight: 700;
}

.summary-contact {
  margin: 7px 0 0;
  font-size: 13px;
  color: var(--text-muted);
}

.summary-status {
  margin: 12px 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.header-bio {
  margin: 12px 0 0;
  color: var(--text-main);
  font-size: 14px;
  line-height: 1.6;
  text-align: left;
  background: var(--bg-soft);
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  padding: 10px 12px;
}

.completeness {
  margin-top: 14px;
  text-align: left;
}

.completeness-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-main);
}

.completeness-meta strong {
  color: var(--accent-deep);
  font-size: 15px;
}

.completeness-track {
  margin-top: 8px;
  width: 100%;
  height: 7px;
  border-radius: 999px;
  background: #e8e4da;
  overflow: hidden;
}

.completeness-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #7f977c, #96ab91);
}

.user-tags {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #5d6a5d;
  background: var(--accent-soft);
  border: 1px solid #d4e0d1;
}

.sidebar-actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.overview-card {
  padding: 16px 16px 8px;
}

.overview-card h3 {
  margin: 0 0 10px;
  color: var(--text-strong);
  font-size: 17px;
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 0;
  border-top: 1px dashed var(--line-soft);
}

.overview-item:first-of-type {
  border-top: none;
}

.overview-item span {
  font-size: 12px;
  color: var(--text-muted);
}

.overview-item strong {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 600;
}

.nickname-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  margin-left: 6px;
}

.nickname-status-pending {
  color: #8e6a2e;
  background: #f6edd6;
  border: 1px solid #e7d2a3;
}

.nickname-status-rejected {
  color: var(--danger-text);
  background: var(--danger-bg);
  border: 1px solid var(--danger-line);
}

.nickname-reject-reason {
  color: var(--danger-text);
  font-size: 12px;
}

.profile-main {
  display: grid;
  gap: 16px;
}

.panel-card {
  padding: 18px;
}

.panel-card h3 {
  margin: 0;
  color: var(--text-strong);
  font-size: 18px;
  padding-bottom: 11px;
  border-bottom: 1px solid var(--line-soft);
}

.section-hint {
  margin: 10px 0 2px;
  color: var(--text-muted);
  font-size: 13px;
}

.info-item {
  display: flex;
  margin-bottom: 16px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--line-soft);
}

.info-item:last-of-type {
  border-bottom: none;
}

.info-label {
  width: 100px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
}

.info-value {
  flex: 1;
  color: var(--text-main);
  font-size: 14px;
  word-break: break-word;
}

.bio-display {
  min-height: 60px;
  line-height: 1.6;
}

.field-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 9px 11px;
  font-size: 14px;
  color: var(--text-main);
  background: #fffcf8;
  outline: none;
}

.field-input:focus {
  border-color: #9aad98;
  box-shadow: 0 0 0 3px rgba(143, 163, 140, 0.22);
}

.nickname-audit-tip {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.4;
}

.bio-input {
  resize: vertical;
  min-height: 78px;
}

.avatar-presets-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.avatar-preset-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid var(--line);
  padding: 0;
  background: #fffcf8;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s ease;
}

.avatar-preset-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-preset-btn:hover {
  border-color: #8ea588;
}

.avatar-preset-btn.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(111, 139, 111, 0.2);
}

.avatar-presets-state {
  color: var(--text-muted);
}

.avatar-presets-tip {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 12px;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.profile-action-btn {
  border: none;
  background: linear-gradient(120deg, var(--accent-deep), var(--accent));
  color: #fff;
  padding: 9px 16px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 8px 18px rgba(74, 93, 74, 0.22);
}

.profile-action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.profile-action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.profile-action-btn.secondary {
  background: #b3b2aa;
  box-shadow: none;
}

.profile-action-btn.light {
  background: #f2ede4;
  color: #596858;
  border: 1px solid var(--line);
  box-shadow: none;
}

.profile-action-btn.light:hover:not(:disabled) {
  background: #ebe4d7;
  transform: none;
}

@media (max-width: 860px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }

  .profile-sidebar {
    order: 2;
  }

  .profile-main {
    order: 1;
  }

  .summary-card {
    text-align: left;
  }

  .summary-status {
    justify-content: flex-start;
  }

  .info-item {
    flex-direction: column;
    gap: 8px;
  }

  .info-label {
    width: auto;
  }
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 14px;
  }

  .system-name {
    font-size: 17px;
  }

  .main-content {
    padding: 14px 10px 20px;
  }

  .page-intro h1 {
    font-size: 24px;
  }

  .profile-action-btn,
  .profile-action-btn.light {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
}
</style>
