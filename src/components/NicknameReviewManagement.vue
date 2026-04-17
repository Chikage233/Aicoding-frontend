<template>
  <div class="nickname-review-page">
    <div class="page-header">
      <h1>昵称审核</h1>
      <div class="header-actions">
        <el-button :loading="loading" @click="fetchPendingReviews">刷新</el-button>
        <el-button type="primary" @click="goBack">返回控制台</el-button>
      </div>
    </div>

    <div v-if="errorMessage" class="error-box">
      {{ errorMessage }}
    </div>

    <el-table
      :data="reviews"
      style="width: 100%"
      border
      stripe
      v-loading="loading"
    >
      <el-table-column prop="userId" label="用户ID" min-width="110" />
      <el-table-column prop="username" label="用户名" min-width="140" />
      <el-table-column prop="pendingNickname" label="提交昵称" min-width="180" />
      <el-table-column prop="currentDisplayName" label="当前展示名" min-width="180" />
      <el-table-column prop="submittedAtText" label="提交时间" min-width="170" />
      <el-table-column label="操作" min-width="200" fixed="right">
        <template #default="scope">
          <div class="action-cell">
            <el-button
              type="success"
              size="small"
              :loading="isProcessing(scope.row.rowKey)"
              :disabled="!scope.row.userId"
              @click="approve(scope.row)"
            >
              通过
            </el-button>
            <el-button
              type="danger"
              size="small"
              :loading="isProcessing(scope.row.rowKey)"
              :disabled="!scope.row.userId"
              @click="reject(scope.row)"
            >
              驳回
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!loading && reviews.length === 0" class="empty-box">
      当前没有待审核昵称
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

const loading = ref(false)
const reviews = ref([])
const errorMessage = ref('')
const processingKeys = ref([])

function unwrapData(payload, depth = 0) {
  if (depth > 6 || payload == null) return payload
  if (Array.isArray(payload)) return payload
  if (typeof payload !== 'object') return payload
  if (Object.prototype.hasOwnProperty.call(payload, 'data')) {
    const next = payload.data
    if (next !== undefined) return unwrapData(next, depth + 1)
  }
  return payload
}

function extractList(payload) {
  const raw = unwrapData(payload)
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.nickname_reviews)) return raw.nickname_reviews
    if (Array.isArray(raw.reviews)) return raw.reviews
    if (Array.isArray(raw.results)) return raw.results
    if (Array.isArray(raw.items)) return raw.items
  }
  return []
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizeReview(item, index = 0) {
  const row = item && typeof item === 'object' ? item : {}
  const user = row.user && typeof row.user === 'object' ? row.user : {}
  const userId = String(row.user_id ?? row.userId ?? user.id ?? '').trim()
  const username = String(row.username ?? row.user_username ?? user.username ?? '').trim()
  const pendingNickname = String(
    row.nickname_pending ?? row.pending_nickname ?? row.candidate_nickname ?? row.nickname ?? ''
  ).trim()
  const currentDisplayName = String(
    row.display_name ??
      row.current_display_name ??
      row.nickname_approved ??
      user.display_name ??
      user.nickname_approved ??
      ''
  ).trim()
  const submittedAt = row.submitted_at ?? row.created_at ?? row.updated_at ?? null

  return {
    rowKey: userId || `${username || 'unknown'}-${pendingNickname || 'empty'}-${index}`,
    userId,
    username,
    pendingNickname,
    currentDisplayName,
    submittedAt,
    submittedAtText: formatDateTime(submittedAt),
  }
}

function isProcessing(key) {
  return processingKeys.value.includes(key)
}

function setProcessing(key, value) {
  if (!key) return
  if (value) {
    if (!processingKeys.value.includes(key)) {
      processingKeys.value = [...processingKeys.value, key]
    }
    return
  }
  processingKeys.value = processingKeys.value.filter((item) => item !== key)
}

async function fetchPendingReviews() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await request.get('/api/admin/nickname-reviews', {
      params: { status: 'pending' },
    })
    const list = extractList(response)
    reviews.value = list.map((item, index) => normalizeReview(item, index))
  } catch (error) {
    console.error('加载昵称审核列表失败:', error)
    reviews.value = []
    errorMessage.value =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function approve(row) {
  if (!row?.userId) {
    ElMessage.error('该条记录缺少用户ID，无法审核')
    return
  }
  setProcessing(row.rowKey, true)
  try {
    await request.post(`/api/admin/nickname-reviews/${encodeURIComponent(row.userId)}/approve`, {})
    ElMessage.success('审核通过')
    await fetchPendingReviews()
  } catch (error) {
    console.error('昵称审核通过失败:', error)
    ElMessage.error(
      error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        '审核失败'
    )
  } finally {
    setProcessing(row.rowKey, false)
  }
}

async function reject(row) {
  if (!row?.userId) {
    ElMessage.error('该条记录缺少用户ID，无法审核')
    return
  }

  let promptResult
  try {
    promptResult = await ElMessageBox.prompt('请输入驳回原因', '驳回昵称', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputValidator: (value) => {
        if (!String(value || '').trim()) return '驳回原因不能为空'
        return true
      },
    })
  } catch {
    return
  }

  const reason = String(promptResult?.value || '').trim()
  if (!reason) {
    ElMessage.warning('驳回原因不能为空')
    return
  }

  setProcessing(row.rowKey, true)
  try {
    await request.post(`/api/admin/nickname-reviews/${encodeURIComponent(row.userId)}/reject`, {
      reason,
      reject_reason: reason,
    })
    ElMessage.success('已驳回')
    await fetchPendingReviews()
  } catch (error) {
    console.error('昵称驳回失败:', error)
    ElMessage.error(
      error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        '操作失败'
    )
  } finally {
    setProcessing(row.rowKey, false)
  }
}

function goBack() {
  router.push('/admin')
}

onMounted(async () => {
  const token = localStorage.getItem('token')
  const isAdmin = localStorage.getItem('is_admin') === 'true'
  if (!token || !isAdmin) {
    router.push('/main')
    return
  }
  await fetchPendingReviews()
})
</script>

<style scoped>
.nickname-review-page {
  min-height: 100vh;
  background: #fff;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.action-cell {
  display: flex;
  gap: 8px;
}

.error-box {
  margin-bottom: 14px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #fda29b;
  background: #fff4f4;
  color: #b42318;
  font-size: 13px;
}

.empty-box {
  margin-top: 12px;
  text-align: center;
  color: #667085;
  font-size: 14px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
