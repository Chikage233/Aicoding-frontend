<template>
  <div class="main-page">
    <nav class="navbar">
      <div class="navbar-left">
        <span class="system-name">编程 AI 助教</span>
      </div>

      <div class="navbar-right">
        <button @click="goToAIChat" class="ai-chat-button">
          <span class="icon-message">🤖</span>
          AI 助手
        </button>

        <div class="user-center" @click.stop="toggleUserMenu">
          <img class="avatar" :src="user.avatar" alt="avatar" />
          <div class="user-meta">
            <span class="username">{{ displayName }}</span>
            <span
              v-if="nicknameStatusTag"
              class="nickname-status-tag"
              :class="`nickname-status-${nicknameStatusTag.type}`"
            >
              {{ nicknameStatusTag.text }}
            </span>
          </div>
        </div>

        <div v-if="showUserMenu" class="user-menu" @click.stop>
          <div class="user-menu-item" @click="goProfile">个人中心</div>
          <div class="user-menu-item" @click="logout">退出登录</div>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <section class="overview">
        <div class="overview-main">
          <p class="overview-eyebrow">学习总览</p>
          <h1>欢迎回来，{{ displayName }}</h1>
          <p class="overview-subtext">
            目前累计完成
            <strong>{{ doneCount }}</strong>
            题，继续保持节奏。
          </p>
          <div class="progress-inline">
            <span>题库总量 {{ totalQuestionCount }}</span>
            <span>完成率 {{ completionRateText }}</span>
          </div>
          <div class="progress-track" aria-hidden="true">
            <span class="progress-fill" :style="{ width: completionRateText }"></span>
          </div>
          <p
            v-if="
              nicknameStatusTag &&
              nicknameStatusTag.type === 'rejected' &&
              user.nicknameRejectReason
            "
            class="nickname-reject-reason"
          >
            昵称驳回原因：{{ user.nicknameRejectReason }}
          </p>
        </div>
        <div class="overview-stats">
          <div class="stat-card">
            <span class="stat-label">简单</span>
            <span class="stat-value easy">{{ easyCount }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">中等</span>
            <span class="stat-value medium">{{ mediumCount }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">困难</span>
            <span class="stat-value hard">{{ hardCount }}</span>
          </div>
        </div>
      </section>

      <section class="toolbar">
        <div class="toolbar-primary">
          <div class="search-container">
            <input
              v-model="searchQuery"
              @input="onSearchInput"
              class="search-input"
              placeholder="搜索题号或题目关键词"
              type="text"
            />
          </div>

          <div class="filter-container">
            <label>难度筛选:</label>
            <el-radio-group v-model="difficultyFilter" @change="onDifficultyChange">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="简单">简单</el-radio-button>
              <el-radio-button label="中等">中等</el-radio-button>
              <el-radio-button label="困难">困难</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="toolbar-secondary">
          <p class="result-summary">当前显示 {{ paginatedQuestions.length }} / {{ filteredQuestions.length }} 题</p>
          <button v-if="hasActiveFilter" class="clear-filter-button" @click="resetFilters">
            清空筛选
          </button>
        </div>
      </section>

      <section class="table-wrapper">
        <div v-if="loading" class="loading">题目加载中...</div>

        <table v-else-if="filteredQuestions.length > 0" class="questions-table">
          <thead>
            <tr>
              <th>题号</th>
              <th>题目</th>
              <th>难度</th>
              <th>状态</th>
              <th>通过率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedQuestions" :key="item.problem_id" :class="{ 'row-done': item.is_done }">
              <td class="id-cell">{{ item.problem_id }}</td>
              <td>
                <router-link :to="`/leetcode/problems/${item.problem_id}/`" class="problem-link">
                  {{ item.title }}
                </router-link>
              </td>
              <td>
                <span class="difficulty-chip" :class="difficultyClass(item.difficulty)">
                  {{ item.difficulty }}
                </span>
              </td>
              <td>
                <span class="status-chip" :class="item.is_done ? 'is-done' : 'is-todo'">
                  {{ item.is_done ? '已完成' : '待完成' }}
                </span>
              </td>
              <td>{{ formatAcceptanceRate(item.acceptance_rate) }}</td>
            </tr>
          </tbody>
        </table>

        <div v-else class="no-data">未找到匹配题目，换个关键词试试。</div>
      </section>

      <div v-if="!loading && filteredQuestions.length > 0" class="pagination">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredQuestions.length"
        />
      </div>
    </main>
  </div>
</template>

<script>
import request from '@/utils/request'
import { ElMessageBox } from 'element-plus'
import { getUserCompletedProblemIds, getUserCompletedProblemIdsWithMeta } from '@/utils/user'

export default {
  name: 'MainPage',
  data() {
    return {
      user: {
        username: '',
        nickname: '',
        displayName: '',
        nicknameStatus: '',
        nicknameRejectReason: '',
        avatar: '',
      },
      userProgress: {
        total: null,
        easy: null,
        medium: null,
        hard: null,
      },
      showUserMenu: false,
      searchQuery: '',
      questions: [],
      loading: true,
      difficultyFilter: '',
      currentPage: 1,
      pageSize: 15,
    }
  },
  computed: {
    displayName() {
      const displayName = String(this.user.displayName || '').trim()
      if (displayName && displayName !== '-') return displayName

      const nickname = String(this.user.nickname || '').trim()
      if (nickname && nickname !== '-') return nickname

      const username = String(this.user.username || '').trim()
      if (username && username !== '-') return username

      return '未登录'
    },
    nicknameStatusTag() {
      const status = String(this.user.nicknameStatus || '').trim().toLowerCase()
      if (status === 'pending') return { text: '审核中', type: 'pending' }
      if (status === 'rejected') return { text: '已驳回', type: 'rejected' }
      return null
    },
    filteredQuestions() {
      let result = this.questions

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase()
        result = result.filter((item) => {
          const title = String(item.title || '').toLowerCase()
          const id = String(item.problem_id || '')
          return title.includes(q) || id.includes(q)
        })
      }

      if (this.difficultyFilter) {
        result = result.filter((item) => item.difficulty === this.difficultyFilter)
      }

      return result
    },
    paginatedQuestions() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredQuestions.slice(start, end)
    },
    doneCount() {
      if (Number.isFinite(this.userProgress.total)) return this.userProgress.total
      return this.questions.filter((item) => item.is_done === true).length
    },
    easyCount() {
      if (Number.isFinite(this.userProgress.easy)) return this.userProgress.easy
      return this.questions.filter((item) => item.is_done === true && item.difficulty === '简单').length
    },
    mediumCount() {
      if (Number.isFinite(this.userProgress.medium)) return this.userProgress.medium
      return this.questions.filter((item) => item.is_done === true && item.difficulty === '中等').length
    },
    hardCount() {
      if (Number.isFinite(this.userProgress.hard)) return this.userProgress.hard
      return this.questions.filter((item) => item.is_done === true && item.difficulty === '困难').length
    },
    totalQuestionCount() {
      return Array.isArray(this.questions) ? this.questions.length : 0
    },
    completionRate() {
      if (!this.totalQuestionCount) return 0
      const percentage = Math.round((this.doneCount / this.totalQuestionCount) * 100)
      return Math.max(0, Math.min(100, percentage))
    },
    completionRateText() {
      return `${this.completionRate}%`
    },
    hasActiveFilter() {
      return Boolean(String(this.searchQuery || '').trim() || this.difficultyFilter)
    },
  },
  methods: {
    toFiniteNumber(value) {
      if (value === undefined || value === null || value === '') return null
      const num = Number(value)
      return Number.isFinite(num) ? num : null
    },

    extractMeRoot(payload) {
      if (!payload || typeof payload !== 'object') return {}
      const level1 = payload.data && typeof payload.data === 'object' ? payload.data : payload
      return level1 && typeof level1 === 'object' ? level1 : {}
    },

    pickStatNumber(sources, keys) {
      const candidateBuckets = []

      sources.forEach((source) => {
        if (!source || typeof source !== 'object') return
        candidateBuckets.push(source)
        if (source.stats && typeof source.stats === 'object') candidateBuckets.push(source.stats)
        if (source.summary && typeof source.summary === 'object') candidateBuckets.push(source.summary)
        if (source.progress && typeof source.progress === 'object') candidateBuckets.push(source.progress)
        if (source.user_stats && typeof source.user_stats === 'object') candidateBuckets.push(source.user_stats)
        if (source.userStats && typeof source.userStats === 'object') candidateBuckets.push(source.userStats)
      })

      for (const bucket of candidateBuckets) {
        for (const key of keys) {
          const num = this.toFiniteNumber(bucket[key])
          if (num !== null) return num
        }
      }

      return null
    },

    extractUserProgress(userInfo, root) {
      const sources = [userInfo, root]
      const easy = this.pickStatNumber(sources, [
        'problems_completed_easy',
        'completed_problems_easy',
        'completed_easy_problems',
        'solved_easy',
        'easy_completed',
        'easy_completed_count',
        'easy_solved',
        'easy_done',
        'easy_count',
      ])
      const medium = this.pickStatNumber(sources, [
        'problems_completed_medium',
        'completed_problems_medium',
        'completed_medium_problems',
        'solved_medium',
        'medium_completed',
        'medium_completed_count',
        'medium_solved',
        'medium_done',
        'medium_count',
      ])
      const hard = this.pickStatNumber(sources, [
        'problems_completed_hard',
        'completed_problems_hard',
        'completed_hard_problems',
        'solved_hard',
        'hard_completed',
        'hard_completed_count',
        'hard_solved',
        'hard_done',
        'hard_count',
      ])

      let total = this.pickStatNumber(sources, [
        'problems_completed_total',
        'completed_problems_total',
        'total_completed_problems',
        'problems_completed',
        'completed_problem_count',
        'completed_count',
        'total_solved',
        'solved_total',
        'solved_count',
        'done_count',
      ])

      if (total === null && easy !== null && medium !== null && hard !== null) {
        total = easy + medium + hard
      }

      return { total, easy, medium, hard }
    },

    extractDisplayName(userInfo, root, fallbackUsername = '') {
      const candidates = [
        userInfo?.display_name,
        userInfo?.displayName,
        userInfo?.nickname_approved,
        userInfo?.approved_nickname,
        root?.display_name,
        root?.displayName,
        root?.nickname_approved,
        root?.approved_nickname,
        userInfo?.nickname,
        fallbackUsername,
      ]

      for (const value of candidates) {
        const text = String(value || '').trim()
        if (text && text !== '-') return text
      }

      return ''
    },

    extractNicknameStatus(userInfo, root) {
      const status = String(
        userInfo?.nickname_status ??
          userInfo?.nicknameStatus ??
          root?.nickname_status ??
          root?.nicknameStatus ??
          ''
      )
        .trim()
        .toLowerCase()

      if (['pending', 'rejected', 'approved'].includes(status)) return status
      return ''
    },

    getCachedUserInfo() {
      try {
        const raw = localStorage.getItem('user_info')
        const parsed = raw ? JSON.parse(raw) : {}
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (error) {
        console.warn('读取本地 user_info 失败:', error)
        return {}
      }
    },

    syncUserInfoCache(partialUser = {}) {
      try {
        const cached = this.getCachedUserInfo()
        localStorage.setItem(
          'user_info',
          JSON.stringify({
            ...cached,
            ...partialUser,
          })
        )
      } catch (error) {
        console.warn('同步本地 user_info 失败:', error)
      }
    },

    normalizeDifficulty(value) {
      if (value === 'easy' || value === 1 || value === '1') return '简单'
      if (value === 'medium' || value === 2 || value === '2') return '中等'
      if (value === 'hard' || value === 3 || value === '3') return '困难'
      if (value === '简单' || value === '中等' || value === '困难') return value
      return String(value || '未知')
    },

    difficultyClass(value) {
      const difficulty = this.normalizeDifficulty(value)
      if (difficulty === '简单') return 'is-easy'
      if (difficulty === '中等') return 'is-medium'
      if (difficulty === '困难') return 'is-hard'
      return ''
    },

    parseProblemBatch(responsePayload) {
      const candidates = [responsePayload]
      if (responsePayload && typeof responsePayload === 'object' && responsePayload.data) {
        candidates.push(responsePayload.data)
      }

      for (const item of candidates) {
        if (Array.isArray(item)) return { list: item, hasNext: item.length > 0, hasNextFromApi: false }
        if (!item || typeof item !== 'object') continue

        if (Array.isArray(item.results)) {
          return { list: item.results, hasNext: Boolean(item.next), hasNextFromApi: true }
        }
        if (Array.isArray(item.problems)) {
          const hasNext = Object.prototype.hasOwnProperty.call(item, 'next')
            ? Boolean(item.next)
            : item.problems.length > 0
          return { list: item.problems, hasNext, hasNextFromApi: Object.prototype.hasOwnProperty.call(item, 'next') }
        }
        if (Array.isArray(item.items)) {
          return { list: item.items, hasNext: item.items.length > 0, hasNextFromApi: false }
        }
        if (Array.isArray(item.list)) {
          return { list: item.list, hasNext: item.list.length > 0, hasNextFromApi: false }
        }
        if (item.problem_id || item.id) {
          return { list: [item], hasNext: false, hasNextFromApi: true }
        }
      }

      return { list: [], hasNext: false, hasNextFromApi: true }
    },

    async fetchUserInfo() {
      const cachedUser = this.getCachedUserInfo()
      const defaultAvatar = 'https://i.pravatar.cc/40?img=3'

      try {
        const res = await request.get('/api/auth/jwt/me/')
        const root = this.extractMeRoot(res)
        const userInfo = root.user && typeof root.user === 'object' ? root.user : root
        const username = userInfo.username || cachedUser.username || '未登录'
        const nickname = userInfo.nickname || cachedUser.nickname || username || '未登录'
        const displayName = this.extractDisplayName(userInfo, root, username) || cachedUser.display_name || ''
        const nicknameStatus = this.extractNicknameStatus(userInfo, root) || cachedUser.nickname_status || ''
        const nicknameRejectReason = String(
          userInfo.nickname_reject_reason ??
            userInfo.reject_reason ??
            root.nickname_reject_reason ??
            root.reject_reason ??
            cachedUser.nickname_reject_reason ??
            ''
        ).trim()
        const avatar = userInfo.avatar || cachedUser.avatar || defaultAvatar
        this.userProgress = this.extractUserProgress(userInfo, root)

        this.user.username = username
        this.user.nickname = nickname
        this.user.displayName = displayName
        this.user.nicknameStatus = nicknameStatus
        this.user.nicknameRejectReason = nicknameRejectReason
        this.user.avatar = avatar

        this.syncUserInfoCache({
          username,
          nickname: nickname === '未登录' ? '' : nickname,
          display_name: displayName,
          nickname_status: nicknameStatus,
          nickname_reject_reason: nicknameRejectReason,
          avatar,
        })
      } catch (error) {
        const token =
          localStorage.getItem('token') ||
          localStorage.getItem('access_token') ||
          localStorage.getItem('jwt_token')
        if (!token) this.$router.push('/login')

        this.userProgress = { total: null, easy: null, medium: null, hard: null }
        this.user.username = cachedUser.username || '未登录'
        this.user.nickname = cachedUser.nickname || cachedUser.username || '未登录'
        this.user.displayName = cachedUser.display_name || cachedUser.nickname || cachedUser.username || '未登录'
        this.user.nicknameStatus = String(cachedUser.nickname_status || '').trim().toLowerCase()
        this.user.nicknameRejectReason = String(cachedUser.nickname_reject_reason || '').trim()
        this.user.avatar = cachedUser.avatar || defaultAvatar
      }
    },

    async fetchQuestions() {
      try {
        this.loading = true

        let allQuestions = []
        let page = 1
        const requestPageSize = 50
        let hasMore = true
        let safeGuard = 0

        while (hasMore) {
          const response = await request.get('/api/leetcode/problems/', {
            params: {
              page,
              page_size: requestPageSize,
            },
          })

          const { list, hasNext, hasNextFromApi } = this.parseProblemBatch(response)
          allQuestions = allQuestions.concat(list)

          if (hasNextFromApi) {
            hasMore = hasNext
          } else {
            hasMore = list.length === requestPageSize
          }

          page += 1
          safeGuard += 1
          if (safeGuard > 40 || allQuestions.length >= 2000) hasMore = false
        }

        let completedProblemIds = new Set()
        let completionLoaded = false
        try {
          const completionResult = await getUserCompletedProblemIdsWithMeta()
          completedProblemIds = completionResult.ids
          completionLoaded = completionResult.loaded
        } catch (error) {
          console.warn('获取已完成题目失败，将回退接口字段:', error)
        }

        this.questions = allQuestions
          .map((question) => {
            const problemId = Number(question.problem_id ?? question.id)
            const apiMarkedDone =
              question.is_done === true ||
              question.is_done === 1 ||
              question.is_done === '1' ||
              String(question.is_done).toLowerCase() === 'true'

            const completionMarkedDone = completedProblemIds.has(problemId)
            const isDone = completionLoaded ? completionMarkedDone : apiMarkedDone

            return {
              ...question,
              problem_id: question.problem_id ?? question.id,
              difficulty: this.normalizeDifficulty(question.difficulty),
              is_done: isDone,
            }
          })
          .sort((a, b) => Number(a.problem_id) - Number(b.problem_id))

        const totalPages = Math.ceil(this.filteredQuestions.length / this.pageSize) || 1
        if (this.currentPage > totalPages) this.currentPage = 1
      } catch (error) {
        console.error('获取题目列表失败:', error)
        this.questions = []
      } finally {
        this.loading = false
      }
    },

    handleSizeChange(newSize) {
      this.pageSize = newSize
      this.currentPage = 1
    },

    handleCurrentChange(newPage) {
      this.currentPage = newPage
    },

    goProfile() {
      this.showUserMenu = false
      this.$router.push('/profile').catch((err) => {
        console.error('跳转个人中心失败:', err)
      })
    },

    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu
    },

    closeUserMenu() {
      this.showUserMenu = false
    },

    onSearchInput() {
      this.currentPage = 1
    },

    onDifficultyChange() {
      this.currentPage = 1
    },

    resetFilters() {
      this.searchQuery = ''
      this.difficultyFilter = ''
      this.currentPage = 1
    },

    formatAcceptanceRate(value) {
      if (value === undefined || value === null || value === '') return '--'
      const normalized = typeof value === 'string' ? value.replace('%', '').trim() : value
      const rate = Number(normalized)
      if (!Number.isFinite(rate)) return '--'
      return `${rate % 1 === 0 ? rate.toFixed(0) : rate.toFixed(1)}%`
    },

    goToAIChat() {
      this.$router.push('/ai-chat')
    },

    async logout() {
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
      } catch {
        return
      }

      try {
        await request.post('/api/auth/jwt/logout/')
      } catch (error) {
        console.warn('退出登录接口失败，已执行本地清理:', error)
      }

      localStorage.removeItem('token')
      localStorage.removeItem('access_token')
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('is_admin')
      localStorage.removeItem('user_info')

      this.$router.push('/login').catch(() => {
        window.location.href = '#/login'
      })
    },

    async fetchUserCompletedProblems() {
      return getUserCompletedProblemIds()
    },
  },
  mounted() {
    this.fetchUserInfo()
    this.fetchQuestions()
    document.addEventListener('click', this.closeUserMenu)

    window.problemCompletedCallback = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await this.fetchQuestions()
      await this.fetchUserInfo()
    }
  },
  beforeUnmount() {
    if (window.problemCompletedCallback) {
      delete window.problemCompletedCallback
    }
    document.removeEventListener('click', this.closeUserMenu)
  },
  beforeDestroy() {
    if (window.problemCompletedCallback) {
      delete window.problemCompletedCallback
    }
    document.removeEventListener('click', this.closeUserMenu)
  },
}
</script>

<style scoped>
.main-page {
  min-height: 100vh;
  width: 100%;
  background:
    radial-gradient(circle at 8% 0%, #ecf7ff 0, transparent 32%),
    radial-gradient(circle at 90% 10%, #fff1e8 0, transparent 28%),
    #f6f8fc;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid #e8edf5;
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
}

.system-name {
  font-size: 20px;
  font-weight: 700;
  color: #1c2942;
  letter-spacing: 0.01em;
}

.ai-chat-button {
  background: linear-gradient(120deg, #0f6fff, #438dff);
  color: #fff;
  border: none;
  padding: 9px 14px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 8px 18px rgba(15, 111, 255, 0.26);
}

.ai-chat-button:hover {
  transform: translateY(-1px);
}

.user-center {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 12px;
  transition: background-color 0.2s;
}

.user-center:hover {
  background-color: #f2f5fb;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ebeff7;
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.username {
  font-size: 15px;
  color: #1f2d48;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.nickname-status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
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

.user-menu {
  position: absolute;
  top: 58px;
  right: 0;
  background: #fff;
  border: 1px solid #e6ebf4;
  border-radius: 10px;
  box-shadow: 0 12px 24px rgba(20, 37, 63, 0.12);
  z-index: 1000;
  min-width: 130px;
  overflow: hidden;
}

.user-menu-item {
  padding: 12px 14px;
  cursor: pointer;
  font-size: 14px;
  color: #25324b;
}

.user-menu-item:hover {
  background-color: #f3f6fb;
}

.main-content {
  max-width: 1180px;
  margin: 0 auto;
  padding: 22px 18px 30px;
  box-sizing: border-box;
}

.overview {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 14px;
  margin-bottom: 14px;
}

.overview-main,
.overview-stats {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e7edf6;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(24, 44, 77, 0.07);
}

.overview-main {
  padding: 20px 22px;
}

.overview-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  color: #6a7690;
  font-weight: 600;
}

.overview-main h1 {
  margin: 0;
  font-size: 24px;
  color: #1c2942;
}

.overview-subtext {
  margin: 10px 0 0;
  color: #55627d;
  font-size: 14px;
}

.progress-inline {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: #5f6f8b;
}

.progress-track {
  margin-top: 8px;
  width: 100%;
  height: 7px;
  border-radius: 999px;
  overflow: hidden;
  background: #e8eef9;
}

.progress-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #2e8bff, #6ab3ff);
  transition: width 0.24s ease;
}

.nickname-reject-reason {
  margin: 10px 0 0;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 13px;
  color: #8a2f2f;
  background: #fff1f0;
  border: 1px solid #ffd5d2;
}

.overview-stats {
  padding: 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  background: #f8faff;
  border: 1px solid #e7edf9;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #67748f;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
}

.stat-value.easy {
  color: #22a06b;
}

.stat-value.medium {
  color: #c97a00;
}

.stat-value.hard {
  color: #d14343;
}

.toolbar {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e7edf6;
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar-primary {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
}

.toolbar-secondary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.search-container {
  flex: 1;
  min-width: 260px;
}

.search-input {
  width: 100%;
  max-width: 460px;
  padding: 11px 14px;
  border: 1px solid #d8e2f0;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  color: #1f2d48;
}

.search-input:focus {
  border-color: #5797ff;
  box-shadow: 0 0 0 3px rgba(87, 151, 255, 0.16);
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-container label {
  font-size: 14px;
  color: #3b4a68;
  white-space: nowrap;
}

.result-summary {
  margin: 0;
  color: #566684;
  font-size: 13px;
}

.clear-filter-button {
  border: 1px solid #d1dced;
  background: #fff;
  color: #2a3a56;
  height: 34px;
  padding: 0 12px;
  border-radius: 9px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-filter-button:hover {
  border-color: #9bbdf3;
  color: #165ed8;
  background: #f4f8ff;
}

.table-wrapper {
  background: rgba(255, 255, 255, 0.93);
  border: 1px solid #e7edf6;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(24, 44, 77, 0.07);
  overflow: hidden;
}

.loading,
.no-data {
  text-align: center;
  padding: 44px 20px;
  font-size: 16px;
  color: #6b7790;
}

.questions-table {
  width: 100%;
  border-collapse: collapse;
}

.questions-table th,
.questions-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid #edf1f8;
  font-size: 14px;
}

.questions-table th {
  background: #f8faff;
  font-weight: 600;
  color: #364460;
}

.questions-table tbody tr:hover {
  background: #fbfcff;
}

.row-done {
  background: rgba(34, 160, 107, 0.04);
}

.id-cell {
  color: #61708d;
  width: 70px;
}

.problem-link {
  color: #176ad8;
  text-decoration: none;
  font-weight: 500;
}

.problem-link:hover {
  text-decoration: underline;
}

.difficulty-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.difficulty-chip.is-easy {
  color: #177a4b;
  background: #eaf8f0;
  border: 1px solid #bde8cf;
}

.difficulty-chip.is-medium {
  color: #8a5a00;
  background: #fff3cd;
  border: 1px solid #f8d57e;
}

.difficulty-chip.is-hard {
  color: #b42318;
  background: #fee4e2;
  border: 1px solid #fda29b;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 24px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  padding: 0 8px;
}

.status-chip.is-done {
  color: #17623f;
  background: #e7f8ee;
  border: 1px solid #bfead2;
}

.status-chip.is-todo {
  color: #7b879f;
  background: #f3f5f9;
  border: 1px solid #e0e6f0;
}

.pagination {
  margin-top: 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e7edf6;
  border-radius: 14px;
  padding: 12px;
}

.icon-message {
  font-size: 16px;
}

@media (max-width: 980px) {
  .overview {
    grid-template-columns: 1fr;
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

  .overview-main h1 {
    font-size: 20px;
  }

  .overview-stats {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .toolbar {
    padding: 12px;
  }

  .toolbar-primary {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-secondary {
    justify-content: flex-start;
  }

  .search-container {
    min-width: 100%;
  }

  .search-input {
    max-width: none;
  }

  .questions-table th,
  .questions-table td {
    padding: 10px 8px;
    font-size: 13px;
  }
}
</style>
