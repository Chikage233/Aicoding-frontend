<template>
  <div class="problem-management-page">
    <div class="page-header">
      <h1>题目管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="goBack">返回控制台</el-button>
        <el-button type="success" @click="openAddProblemDialog">新增题目</el-button>
        <el-button
          v-if="selectedProblems.length > 0"
          type="danger"
          @click="batchDeleteProblems"
        >
          批量删除 ({{ selectedProblems.length }})
        </el-button>
      </div>
    </div>

    <div class="search-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索题目名称或ID"
        clearable
        style="width: 300px"
      />
      <el-select
        v-model="difficultyFilter"
        placeholder="筛选难度"
        clearable
        style="width: 140px; margin-left: 10px"
      >
        <el-option label="简单" value="easy" />
        <el-option label="中等" value="medium" />
        <el-option label="困难" value="hard" />
      </el-select>
    </div>

    <div class="stats-summary">
      <div class="stat-item">
        <span class="stat-label">总题数:</span>
        <span class="stat-value">{{ problems.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">简单:</span>
        <span class="stat-value">{{ easyCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">中等:</span>
        <span class="stat-value">{{ mediumCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">困难:</span>
        <span class="stat-value">{{ hardCount }}</span>
      </div>
    </div>

    <div class="problems-table-container">
      <el-table
        :data="paginatedProblems"
        style="width: 100%"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="problem_id" label="编号" width="90" sortable />
        <el-table-column prop="title" label="题目名称" min-width="220">
          <template #default="scope">
            <span class="problem-title">{{ scope.row.title }}</span>
            <span v-if="scope.row.slug" class="problem-slug">({{ scope.row.slug }})</span>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="110">
          <template #default="scope">
            <el-tag :type="getDifficultyType(scope.row.difficulty)" size="small" effect="plain">
              {{ getDifficultyText(scope.row.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="acceptance_rate" label="通过率" width="110">
          <template #default="scope">
            {{ Number(scope.row.acceptance_rate || 0).toFixed(2) }}%
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ scope.row.created_at ? formatDate(scope.row.created_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editProblem(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteProblem(scope.row)" style="margin-left: 6px">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          layout="total, prev, pager, next"
          :total="filteredProblems.length"
        />
      </div>
    </div>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="620px" @close="closeDialog">
      <el-form ref="problemFormRef" :model="currentProblem" :rules="rules" label-width="100px">
        <el-form-item label="题目ID" prop="problem_id">
          <el-input v-model="currentProblem.problem_id" :disabled="isEditing" placeholder="留空则自动生成" />
        </el-form-item>
        <el-form-item label="题目名称" prop="title">
          <el-input v-model="currentProblem.title" placeholder="请输入题目名称" />
        </el-form-item>
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="currentProblem.slug" placeholder="请输入题目 slug" />
        </el-form-item>
        <el-form-item label="难度" prop="difficulty">
          <el-select v-model="currentProblem.difficulty" placeholder="请选择难度">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
        <el-form-item label="通过率" prop="acceptance_rate">
          <el-input-number v-model="currentProblem.acceptance_rate" :min="0" :max="100" :precision="2" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="currentProblem.description" type="textarea" :rows="4" placeholder="请输入题目描述" />
        </el-form-item>
        <el-form-item v-if="isEditing" label="创建时间">
          <el-input v-model="currentProblem.created_at" readonly />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveProblem">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

const problems = ref([])
const searchQuery = ref('')
const difficultyFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(15)
const selectedProblems = ref([])

const dialogVisible = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const problemFormRef = ref(null)

const currentProblem = reactive({
  problem_id: '',
  title: '',
  slug: '',
  difficulty: 'easy',
  acceptance_rate: 0,
  description: '',
  created_at: ''
})

const rules = {
  title: [{ required: true, message: '请输入题目名称', trigger: 'blur' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }]
}

const dialogTitle = computed(() => (isEditing.value ? '编辑题目' : '新增题目'))

const filteredProblems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return problems.value.filter((p) => {
    const matchesQuery =
      !query ||
      String(p.title || '').toLowerCase().includes(query) ||
      String(p.problem_id || '').toLowerCase().includes(query) ||
      String(p.slug || '').toLowerCase().includes(query)

    const matchesDifficulty = !difficultyFilter.value || p.difficulty === difficultyFilter.value
    return matchesQuery && matchesDifficulty
  })
})

const paginatedProblems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProblems.value.slice(start, start + pageSize.value)
})

const easyCount = computed(() => problems.value.filter((p) => p.difficulty === 'easy').length)
const mediumCount = computed(() => problems.value.filter((p) => p.difficulty === 'medium').length)
const hardCount = computed(() => problems.value.filter((p) => p.difficulty === 'hard').length)

function normalizeDifficulty(raw) {
  if (raw === 1 || raw === '1' || raw === 'easy') return 'easy'
  if (raw === 2 || raw === '2' || raw === 'medium') return 'medium'
  if (raw === 3 || raw === '3' || raw === 'hard') return 'hard'
  return 'easy'
}

function getDifficultyText(difficulty) {
  if (difficulty === 'easy') return '简单'
  if (difficulty === 'medium') return '中等'
  if (difficulty === 'hard') return '困难'
  return String(difficulty || '-')
}

function getDifficultyType(difficulty) {
  if (difficulty === 'easy') return 'success'
  if (difficulty === 'medium') return 'warning'
  if (difficulty === 'hard') return 'danger'
  return 'info'
}

function formatDate(dateString) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function resetCurrentProblem() {
  currentProblem.problem_id = ''
  currentProblem.title = ''
  currentProblem.slug = ''
  currentProblem.difficulty = 'easy'
  currentProblem.acceptance_rate = 0
  currentProblem.description = ''
  currentProblem.created_at = ''
}

function toPayload(input) {
  return {
    ...input,
    acceptance_rate: Number(input.acceptance_rate || 0),
    difficulty: normalizeDifficulty(input.difficulty)
  }
}

function parseProblemList(raw) {
  const list =
    Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.problems)
      ? raw.problems
      : Array.isArray(raw?.results)
      ? raw.results
      : raw
      ? [raw]
      : []

  return list.map((problem) => ({
    ...problem,
    difficulty: normalizeDifficulty(problem.difficulty),
    acceptance_rate: Number(problem.acceptance_rate || 0),
    created_at:
      problem.created_at ||
      problem.create_time ||
      problem.created_time ||
      problem.creation_date ||
      problem.date_created ||
      ''
  }))
}

async function fetchProblems() {
  try {
    const res = await request.get('/api/leetcode/problems/')
    const payload = res?.data ?? res
    problems.value = parseProblemList(payload)
  } catch (error) {
    console.error('获取题目列表失败:', error)
    problems.value = []
    ElMessage.error('获取题目列表失败')
  }
}

function goBack() {
  router.push('/admin')
}

function handleSelectionChange(selection) {
  selectedProblems.value = selection
}

function openAddProblemDialog() {
  isEditing.value = false
  resetCurrentProblem()
  dialogVisible.value = true
}

function editProblem(problem) {
  isEditing.value = true
  currentProblem.problem_id = problem.problem_id
  currentProblem.title = problem.title || ''
  currentProblem.slug = problem.slug || ''
  currentProblem.difficulty = normalizeDifficulty(problem.difficulty)
  currentProblem.acceptance_rate = Number(problem.acceptance_rate || 0)
  currentProblem.description = problem.description || ''
  currentProblem.created_at = problem.created_at || ''
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  problemFormRef.value?.clearValidate?.()
}

async function deleteProblem(problem) {
  try {
    await ElMessageBox.confirm(`确定删除题目「${problem.title}」吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    ElMessage.warning('后端暂未开放题目删除接口，已在前端列表移除')
    problems.value = problems.value.filter((p) => p.problem_id !== problem.problem_id)
    selectedProblems.value = selectedProblems.value.filter((p) => p.problem_id !== problem.problem_id)
  } catch (error) {
    if (error !== 'cancel' && error?.name !== 'Cancel') {
      console.error('删除题目失败:', error)
      ElMessage.error('删除题目失败')
    }
  }
}

async function batchDeleteProblems() {
  if (selectedProblems.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedProblems.value.length} 道题目吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = new Set(selectedProblems.value.map((p) => p.problem_id))
    problems.value = problems.value.filter((p) => !ids.has(p.problem_id))
    selectedProblems.value = []
    ElMessage.warning('后端暂未开放批量删除接口，已在前端列表移除')
  } catch (error) {
    if (error !== 'cancel' && error?.name !== 'Cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

async function saveProblem() {
  try {
    await problemFormRef.value?.validate?.()
    saving.value = true

    const payload = toPayload(currentProblem)

    if (isEditing.value) {
      const idx = problems.value.findIndex((p) => p.problem_id === payload.problem_id)
      if (idx >= 0) problems.value[idx] = { ...problems.value[idx], ...payload }
      ElMessage.warning('后端暂未开放题目更新接口，已仅在前端更新显示')
    } else {
      if (!payload.problem_id) {
        const maxId = problems.value.reduce((max, p) => Math.max(max, Number(p.problem_id) || 0), 0)
        payload.problem_id = maxId + 1
      }
      problems.value.unshift({ ...payload })
      ElMessage.warning('后端暂未开放题目创建接口，已仅在前端新增显示')
    }

    dialogVisible.value = false
    ElMessage.success('保存成功')
  } catch (error) {
    if (error?.name === 'Error') return
    if (typeof error === 'object' && error !== null && !Array.isArray(error) && !error.message) return
    console.error('保存题目失败:', error)
    ElMessage.error('保存题目失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const isAdmin = localStorage.getItem('is_admin') === 'true'
  const token = localStorage.getItem('token')

  if (!token || !isAdmin) {
    router.push('/main')
    return
  }

  await fetchProblems()
})
</script>

<style scoped>
.problem-management-page {
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
  font-size: 24px;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stats-summary {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-weight: 600;
  color: #555;
}

.stat-value {
  font-weight: bold;
  color: #333;
}

.problems-table-container {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.problem-title {
  font-weight: 600;
  color: #333;
}

.problem-slug {
  color: #666;
  font-size: 12px;
  margin-left: 5px;
}

.pagination-container {
  padding: 20px;
  text-align: center;
  background: #f8f9fa;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .search-section {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .search-section :deep(.el-input),
  .search-section :deep(.el-select) {
    width: 100% !important;
    margin-left: 0 !important;
  }
}
</style>
