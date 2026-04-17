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
      <h1>个人中心</h1>

      <div class="profile-container">
        <div class="profile-header">
          <div class="avatar-section">
            <img :src="displayAvatar" alt="头像" class="avatar-large" />
          </div>

          <div class="user-info">
            <h2>{{ user.displayName || user.username || '暂无用户名' }}</h2>
            <p v-if="nicknameStatusTag">
              <strong>昵称审核:</strong>
              <span class="nickname-status-badge" :class="`nickname-status-${nicknameStatusTag.type}`">
                {{ nicknameStatusTag.text }}
              </span>
              <span v-if="user.nicknameRejectReason" class="nickname-reject-reason">
                {{ user.nicknameRejectReason }}
              </span>
            </p>
            <p v-if="user.email"><strong>邮箱:</strong>{{ user.email }}</p>
            <p v-else-if="user.phone"><strong>手机:</strong>{{ user.phone }}</p>
            <p><strong>注册时间:</strong>{{ user.registerDate || '未知' }}</p>
            <p>{{ user.bio || '暂无个人简介' }}</p>
          </div>
        </div>

        <div class="profile-details">
          <div class="info-section">
            <h3>个人信息</h3>

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
              <button v-if="!isEditing" class="profile-action-btn" @click="startEdit">编辑资料</button>
              <template v-else>
                <button class="profile-action-btn secondary" @click="cancelEdit">取消</button>
                <button class="profile-action-btn" :disabled="saving" @click="saveProfile">
                  {{ saving ? '保存中...' : '保存' }}
                </button>
              </template>
            </div>
          </div>

          <div class="security-section">
            <h3>账户安全</h3>
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
          </div>
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
      }
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
        await this.fetchUserInfo()

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

    async fetchUserInfo() {
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
      }
    },

    goBack() {
      this.$router.push('/main')
    }
  },
  mounted() {
    this.fetchUserInfo()
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  width: 100%;
  background: #fff;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.navbar {
  flex-shrink: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 64px;
  background: #222;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.navbar-left,
.navbar-right {
  display: flex;
  align-items: center;
}

.system-name {
  font-size: 22px;
  font-weight: bold;
}

.back-button {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  transition: color 0.2s;
}

.back-button:hover {
  color: #409eff;
}

.main-content {
  flex: 1 1 auto;
  width: 100%;
  padding: 32px;
  box-sizing: border-box;
  background: #fff;
  overflow: auto;
}

.profile-container {
  max-width: 860px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.profile-header {
  display: flex;
  align-items: center;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
  margin-bottom: 24px;
}

.avatar-section {
  margin-right: 24px;
}

.avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ddd;
}

.user-info h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.user-info p {
  margin: 4px 0;
  color: #606266;
  line-height: 1.6;
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
  color: #8a5a00;
  background: #fff3cd;
  border: 1px solid #f8d57e;
}

.nickname-status-rejected {
  color: #b42318;
  background: #fee4e2;
  border: 1px solid #fda29b;
}

.nickname-reject-reason {
  margin-left: 8px;
  color: #b42318;
}

.profile-details {
  display: flex;
  gap: 40px;
}

.info-section,
.security-section {
  flex: 1;
}

.info-section h3,
.security-section h3 {
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
  color: #303133;
  font-size: 18px;
}

.info-item {
  display: flex;
  margin-bottom: 16px;
  padding: 8px 0;
}

.info-label {
  width: 100px;
  color: #909399;
  font-size: 14px;
  font-weight: 500;
}

.info-value {
  flex: 1;
  color: #303133;
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
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 14px;
  color: #303133;
  background: #fff;
}

.nickname-audit-tip {
  margin-top: 6px;
  color: #909399;
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
  border: 2px solid #dcdfe6;
  padding: 0;
  background: #fff;
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
  border-color: #409eff;
}

.avatar-preset-btn.active {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.18);
}

.avatar-presets-state {
  color: #909399;
}

.avatar-presets-tip {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

.action-row {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.profile-action-btn {
  border: none;
  background: #409eff;
  color: #fff;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.profile-action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.profile-action-btn.secondary {
  background: #909399;
}

@media (max-width: 860px) {
  .profile-details {
    flex-direction: column;
    gap: 24px;
  }

  .info-item {
    flex-direction: column;
    gap: 8px;
  }

  .info-label {
    width: auto;
  }
}
</style>
