<template>
  <div class="personalized-page">
    <nav class="navbar">
      <div class="navbar-left">
        <span class="system-name">编程 AI 助教</span>
      </div>
      <div class="navbar-right">
        <button class="nav-button secondary" @click="goBackMain">返回主页面</button>
      </div>
    </nav>

    <main class="page-content">
      <section class="hero-card">
        <div class="hero-copy">
          <p class="hero-eyebrow">智能推荐</p>
          <h1>个性化习题生成</h1>
          <p>基于你的学习记录、策略偏好与标签方向生成专属题单。</p>
        </div>
        <button class="generate-button" :disabled="personalizedLoading" @click="generatePersonalizedExercises()">
          {{ personalizedLoading ? '生成中...' : '生成题单' }}
        </button>
      </section>

      <section class="config-card">
        <div class="config-grid">
          <div class="config-field">
            <label for="personalized-count">题量</label>
            <input
              id="personalized-count"
              v-model.number="personalizedForm.count"
              class="field-input"
              type="number"
              min="1"
              max="30"
            />
          </div>

          <div class="config-field">
            <label for="personalized-strategy">策略</label>
            <select id="personalized-strategy" v-model="personalizedForm.strategy" class="field-input">
              <option value="balanced">balanced（均衡）</option>
              <option value="review">review（复习）</option>
              <option value="challenge">challenge（挑战）</option>
            </select>
          </div>

          <div class="config-field">
            <label for="personalized-difficulty">难度</label>
            <select id="personalized-difficulty" v-model="personalizedForm.difficulty" class="field-input">
              <option value="">全部</option>
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </div>

          <div class="config-field">
            <label for="personalized-focus-tag">聚焦标签</label>
            <input
              id="personalized-focus-tag"
              v-model="personalizedForm.focusTag"
              class="field-input"
              type="text"
              placeholder="如：动态规划、双指针"
            />
          </div>
        </div>

        <label class="config-checkbox">
          <input v-model="personalizedForm.includeCompleted" type="checkbox" />
          <span>包含已完成题目</span>
        </label>

        <p v-if="personalizedGeneratedAt" class="generated-at">
          最近生成时间：{{ formatDateTime(personalizedGeneratedAt) }}
        </p>
      </section>

      <section class="result-card">
        <div v-if="personalizedLoading && !personalizedExercises.length" class="state-box">
          正在生成个性化题单...
        </div>
        <div v-else-if="personalizedError" class="state-box error">
          {{ personalizedError }}
        </div>
        <div v-else-if="personalizedExercises.length" class="exercise-grid">
          <article
            v-for="exercise in personalizedExercises"
            :key="exercise.problemId"
            class="exercise-card"
          >
            <div class="exercise-head">
              <span class="exercise-id">#{{ exercise.problemId }}</span>
              <div class="exercise-head-right">
                <span class="exercise-difficulty" :class="`difficulty-${exercise.difficultyClass}`">
                  {{ exercise.difficultyText }}
                </span>
                <span v-if="exercise.isDone" class="exercise-done">已完成</span>
              </div>
            </div>

            <h3 class="exercise-title">{{ exercise.title }}</h3>

            <p class="exercise-meta">推荐类型：{{ formatRecommendationType(exercise.recommendationType) }}</p>
            <p v-if="exercise.recommendationReason" class="exercise-reason">
              推荐理由：{{ exercise.recommendationReason }}
            </p>

            <div v-if="exercise.tags.length" class="exercise-tags">
              <span v-for="tag in exercise.tags" :key="`${exercise.problemId}-${tag}`">{{ tag }}</span>
            </div>

            <div class="exercise-footer">
              <span class="match-score">匹配度：{{ formatMatchScore(exercise.matchScore) }}</span>
              <button class="start-button" @click="goToProblem(exercise.problemId)">开始练习</button>
            </div>
          </article>
        </div>
        <div v-else class="state-box">暂无推荐结果，点击“生成题单”开始。</div>
      </section>
    </main>
  </div>
</template>

<script>
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const PERSONALIZED_COUNT_MIN = 1
const PERSONALIZED_COUNT_MAX = 30
const DEFAULT_PERSONALIZED_STRATEGY = 'balanced'
const STRATEGY_OPTIONS = new Set(['balanced', 'review', 'challenge'])
const DIFFICULTY_OPTIONS = new Set(['easy', 'medium', 'hard'])

const RECOMMENDATION_TYPE_TEXT_MAP = {
  review: '复习强化',
  challenge: '挑战提升',
  balanced: '均衡推荐',
  weak_tag: '薄弱标签',
  weak_tag_review: '薄弱标签复习',
  weak_tag_challenge: '薄弱标签挑战',
  similar: '同类扩展',
  default: '个性化推荐'
}

export default {
  name: 'PersonalizedExercisesPage',
  data() {
    return {
      personalizedLoading: false,
      personalizedError: '',
      personalizedGeneratedAt: '',
      personalizedExercises: [],
      personalizedForm: {
        count: 10,
        strategy: DEFAULT_PERSONALIZED_STRATEGY,
        difficulty: '',
        focusTag: '',
        includeCompleted: false
      }
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

    toFiniteNumber(value) {
      if (value === undefined || value === null || value === '') return null
      const number = Number(value)
      return Number.isFinite(number) ? number : null
    },

    normalizeBooleanFlag(value) {
      if (value === true || value === 1 || value === '1') return true
      if (value === false || value === 0 || value === '0') return false

      const text = String(value ?? '')
        .trim()
        .toLowerCase()
      if (['true', 'yes', 'y'].includes(text)) return true
      if (['false', 'no', 'n'].includes(text)) return false
      return false
    },

    normalizeProblemId(value) {
      const id = Number(value)
      return Number.isFinite(id) ? id : null
    },

    normalizePersonalizedStrategy(value) {
      const text = String(value || '')
        .trim()
        .toLowerCase()
      return STRATEGY_OPTIONS.has(text) ? text : DEFAULT_PERSONALIZED_STRATEGY
    },

    normalizePersonalizedDifficulty(value) {
      const text = String(value || '')
        .trim()
        .toLowerCase()

      if (DIFFICULTY_OPTIONS.has(text)) return text
      if (['1', '简单'].includes(text)) return 'easy'
      if (['2', '中等'].includes(text)) return 'medium'
      if (['3', '困难'].includes(text)) return 'hard'
      return ''
    },

    getDifficultyPresentation(value) {
      const normalized = this.normalizePersonalizedDifficulty(value)
      if (normalized === 'easy') {
        return { difficultyKey: normalized, difficultyText: '简单', difficultyClass: 'easy' }
      }
      if (normalized === 'medium') {
        return { difficultyKey: normalized, difficultyText: '中等', difficultyClass: 'medium' }
      }
      if (normalized === 'hard') {
        return { difficultyKey: normalized, difficultyText: '困难', difficultyClass: 'hard' }
      }

      const fallback = String(value || '未知').trim() || '未知'
      return { difficultyKey: '', difficultyText: fallback, difficultyClass: 'unknown' }
    },

    normalizeRecommendationType(value) {
      const text = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/-/g, '_')
      return text || 'default'
    },

    formatRecommendationType(value) {
      const normalized = this.normalizeRecommendationType(value)
      return RECOMMENDATION_TYPE_TEXT_MAP[normalized] || value || RECOMMENDATION_TYPE_TEXT_MAP.default
    },

    normalizeMatchScore(value) {
      const number = this.toFiniteNumber(value)
      if (number === null) return null

      const normalized = number >= 0 && number <= 1 ? number * 100 : number
      return Math.max(0, Math.min(100, normalized))
    },

    formatMatchScore(value) {
      const score = this.normalizeMatchScore(value)
      if (score === null) return '--'
      return `${score % 1 === 0 ? score.toFixed(0) : score.toFixed(1)}%`
    },

    normalizeTags(value) {
      if (!value) return []

      const rawList = Array.isArray(value) ? value : [value]
      const tags = []

      rawList.forEach((item) => {
        if (item === undefined || item === null) return

        if (typeof item === 'string' || typeof item === 'number') {
          const text = String(item).trim()
          if (text) tags.push(text)
          return
        }

        if (typeof item === 'object') {
          const text = String(
            item.tag ?? item.name ?? item.title ?? item.slug ?? item.value ?? ''
          ).trim()
          if (text) tags.push(text)
        }
      })

      return Array.from(new Set(tags))
    },

    normalizePersonalizedExercise(item) {
      if (!item || typeof item !== 'object') return null

      const problemId = this.normalizeProblemId(item.problem_id ?? item.problemId ?? item.id)
      if (problemId === null) return null

      const title = String(item.title ?? item.problem_title ?? item.name ?? `题目 ${problemId}`).trim()
      const difficultyInfo = this.getDifficultyPresentation(item.difficulty)
      const recommendationType = this.normalizeRecommendationType(
        item.recommendation_type ?? item.recommendationType ?? this.personalizedForm.strategy
      )
      const recommendationReason = String(
        item.recommendation_reason ?? item.recommendationReason ?? ''
      ).trim()

      return {
        problemId,
        title,
        tags: this.normalizeTags(item.tags ?? item.topic_tags ?? item.topicTags ?? item.tag_list),
        matchScore: this.normalizeMatchScore(item.match_score ?? item.matchScore),
        recommendationType,
        recommendationReason,
        isDone: this.normalizeBooleanFlag(item.is_done ?? item.completed ?? item.is_completed),
        ...difficultyInfo
      }
    },

    extractPersonalizedList(payload) {
      const listKeys = [
        'results',
        'problems',
        'items',
        'list',
        'recommendations',
        'exercises',
        'personalized_exercises',
        'personalizedExercises'
      ]

      const readList = (source) => {
        if (Array.isArray(source)) return source
        if (!source || typeof source !== 'object') return null

        for (const key of listKeys) {
          if (Array.isArray(source[key])) return source[key]
        }

        if (source.problem_id || source.problemId || source.id) return [source]

        return null
      }

      const candidates = [
        payload,
        this.unwrapData(payload),
        payload?.data,
        payload?.data?.data,
        payload?.data?.results,
        payload?.data?.problems
      ]

      for (const candidate of candidates) {
        const list = readList(candidate)
        if (Array.isArray(list)) return list
      }

      return []
    },

    buildPersonalizedParams() {
      const count = Math.floor(Number(this.personalizedForm.count))
      if (
        !Number.isFinite(count) ||
        count < PERSONALIZED_COUNT_MIN ||
        count > PERSONALIZED_COUNT_MAX
      ) {
        ElMessage.warning(`题量需在 ${PERSONALIZED_COUNT_MIN}-${PERSONALIZED_COUNT_MAX} 之间`)
        return null
      }

      const strategy = this.normalizePersonalizedStrategy(this.personalizedForm.strategy)
      const difficulty = this.normalizePersonalizedDifficulty(this.personalizedForm.difficulty)
      const focusTag = String(this.personalizedForm.focusTag || '').trim()

      this.personalizedForm.count = count
      this.personalizedForm.strategy = strategy
      this.personalizedForm.difficulty = difficulty
      this.personalizedForm.focusTag = focusTag

      const params = {
        count,
        strategy,
        include_completed: Boolean(this.personalizedForm.includeCompleted)
      }

      if (difficulty) params.difficulty = difficulty
      if (focusTag) params.focus_tag = focusTag

      return params
    },

    extractErrorDetail(error, fallback = '请求失败') {
      const candidate =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        error?.message ||
        fallback

      if (Array.isArray(candidate)) return candidate.join('；')
      if (candidate && typeof candidate === 'object') return JSON.stringify(candidate)
      return String(candidate || fallback)
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

    async generatePersonalizedExercises(showToast = true) {
      const params = this.buildPersonalizedParams()
      if (!params) return

      this.personalizedLoading = true
      this.personalizedError = ''

      try {
        let response = null
        try {
          response = await request.get('/api/leetcode/personalized/', { params })
        } catch (primaryError) {
          if (primaryError?.response?.status !== 404) throw primaryError
          response = await request.get('/api/user/personalized-exercises/', { params })
        }
        const list = this.extractPersonalizedList(response)

        this.personalizedExercises = list
          .map((item) => this.normalizePersonalizedExercise(item))
          .filter(Boolean)
        this.personalizedGeneratedAt = new Date().toISOString()

        if (showToast) {
          if (this.personalizedExercises.length > 0) {
            ElMessage.success(`已生成 ${this.personalizedExercises.length} 道个性化习题`)
          } else {
            ElMessage.info('暂无符合条件的推荐结果，请调整条件后重试')
          }
        }
      } catch (error) {
        console.error('生成个性化习题失败:', error)
        const detail = this.extractErrorDetail(error, '生成个性化习题失败，请稍后重试')
        this.personalizedError = detail
        if (showToast) ElMessage.error(detail)
      } finally {
        this.personalizedLoading = false
      }
    },

    goToProblem(problemId) {
      const id = this.normalizeProblemId(problemId)
      if (id === null) return
      this.$router.push(`/leetcode/problems/${id}/`)
    },

    goBackMain() {
      this.$router.push('/main')
    }
  },
  mounted() {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('jwt_token')
    if (!token) {
      this.$router.push('/login')
      return
    }

    this.generatePersonalizedExercises(false)
  }
}
</script>

<style scoped>
.personalized-page {
  min-height: 100vh;
  width: 100%;
  background:
    radial-gradient(circle at 5% 0, #e8f2ff 0, transparent 35%),
    radial-gradient(circle at 95% 10%, #fff2e8 0, transparent 30%),
    #f6f8fc;
}

.navbar {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid #e8edf5;
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.navbar-left,
.navbar-right {
  display: flex;
  align-items: center;
}

.system-name {
  font-size: 20px;
  font-weight: 700;
  color: #1c2942;
}

.nav-button {
  border: none;
  border-radius: 10px;
  height: 36px;
  padding: 0 14px;
  font-size: 14px;
  cursor: pointer;
}

.nav-button.secondary {
  color: #1d4c96;
  background: #e9f1ff;
}

.page-content {
  max-width: 1180px;
  margin: 0 auto;
  padding: 22px 18px 30px;
}

.hero-card,
.config-card,
.result-card {
  background: rgba(255, 255, 255, 0.93);
  border: 1px solid #e7edf6;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(24, 44, 77, 0.07);
}

.hero-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px;
}

.hero-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  color: #6a7690;
  font-weight: 600;
}

.hero-copy h1 {
  margin: 0;
  color: #1c2942;
  font-size: 28px;
}

.hero-copy p {
  margin: 10px 0 0;
  font-size: 14px;
  color: #55627d;
}

.generate-button {
  border: none;
  border-radius: 10px;
  background: linear-gradient(120deg, #0f6fff, #438dff);
  color: #fff;
  padding: 10px 16px;
  min-width: 112px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(15, 111, 255, 0.26);
}

.generate-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.config-card {
  margin-top: 14px;
  padding: 16px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-field label {
  font-size: 13px;
  color: #3b4a68;
}

.field-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d8e2f0;
  border-radius: 10px;
  font-size: 14px;
  padding: 10px 12px;
  color: #1f2d48;
  background: #fff;
  outline: none;
}

.field-input:focus {
  border-color: #5797ff;
  box-shadow: 0 0 0 3px rgba(87, 151, 255, 0.16);
}

.config-checkbox {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #2a3a56;
  font-size: 14px;
}

.generated-at {
  margin: 10px 0 0;
  font-size: 12px;
  color: #6b7790;
}

.result-card {
  margin-top: 14px;
  padding: 14px;
  min-height: 180px;
}

.state-box {
  text-align: center;
  border-radius: 10px;
  padding: 24px 16px;
  color: #6b7790;
  background: #f7f9fc;
}

.state-box.error {
  color: #b42318;
  background: #fee4e2;
  border: 1px solid #fda29b;
}

.exercise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.exercise-card {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 14px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exercise-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.exercise-head-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.exercise-id {
  font-size: 13px;
  color: #606266;
}

.exercise-difficulty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
}

.exercise-difficulty.difficulty-easy {
  color: #177a4b;
  background: #eaf8f0;
  border: 1px solid #bde8cf;
}

.exercise-difficulty.difficulty-medium {
  color: #8a5a00;
  background: #fff3cd;
  border: 1px solid #f8d57e;
}

.exercise-difficulty.difficulty-hard {
  color: #b42318;
  background: #fee4e2;
  border: 1px solid #fda29b;
}

.exercise-difficulty.difficulty-unknown {
  color: #606266;
  background: #f2f4f7;
  border: 1px solid #d0d5dd;
}

.exercise-done {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  color: #17623f;
  background: #e7f8ee;
  border: 1px solid #bfead2;
}

.exercise-title {
  margin: 0;
  font-size: 16px;
  color: #303133;
  line-height: 1.4;
}

.exercise-meta,
.exercise-reason {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}

.exercise-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.exercise-tags span {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  background: #f5f7fa;
  color: #606266;
}

.exercise-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.match-score {
  color: #409eff;
  font-size: 13px;
  font-weight: 600;
}

.start-button {
  border: none;
  background: #409eff;
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

@media (max-width: 860px) {
  .navbar {
    padding: 0 14px;
  }

  .system-name {
    font-size: 17px;
  }

  .page-content {
    padding: 14px 10px 20px;
  }

  .hero-card {
    flex-direction: column;
    align-items: stretch;
  }

  .config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
