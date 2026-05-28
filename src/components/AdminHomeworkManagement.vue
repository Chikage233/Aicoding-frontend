<template>
  <div class="homework-management-page">
    <div class="page-header">
      <h1>作业管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="goBack">返回控制台</el-button>
        <el-button type="success" @click="openCreateDialog">发布作业</el-button>
      </div>
    </div>

    <el-table :data="homeworks" border stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="作业标题" min-width="220" />
      <el-table-column label="起止时间" min-width="260">
        <template #default="scope">
          <div>{{ formatDateTime(scope.row.start_at) }}</div>
          <div>{{ formatDateTime(scope.row.due_at) }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="problem_count" label="题目数" width="90" />
      <el-table-column prop="submission_count" label="提交人数" width="100" />
      <el-table-column label="发布" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.is_published ? 'success' : 'info'">
            {{ scope.row.is_published ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="允许补交" width="110">
        <template #default="scope">
          <el-tag :type="scope.row.allow_late_submission ? 'warning' : 'info'">
            {{ scope.row.allow_late_submission ? '允许' : '不允许' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="210" fixed="right">
        <template #default="scope">
          <el-button size="small" type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteHomework(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑作业' : '发布作业'" width="760px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="作业标题">
          <el-input v-model="form.title" placeholder="请输入作业标题" />
        </el-form-item>
        <el-form-item label="作业描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="选填" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="form.start_at"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            placeholder="选择开始时间"
          />
        </el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker
            v-model="form.due_at"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            placeholder="选择截止时间"
          />
        </el-form-item>
        <el-form-item label="题目ID列表">
          <el-input
            v-model="form.problem_ids_text"
            type="textarea"
            :rows="3"
            placeholder="例如：1,2,3"
          />
        </el-form-item>
        <el-form-item label="发布状态">
          <el-switch v-model="form.is_published" />
        </el-form-item>
        <el-form-item label="允许补交">
          <el-switch v-model="form.allow_late_submission" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveHomework">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const homeworks = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const currentId = ref(null)

const form = reactive({
  title: '',
  description: '',
  start_at: '',
  due_at: '',
  problem_ids_text: '',
  is_published: true,
  allow_late_submission: false
})

function formatDateTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('zh-CN')
}

function normalizeResponseList(res) {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  return []
}

async function fetchHomeworks() {
  const res = await request.get('/api/admin/homeworks/')
  homeworks.value = normalizeResponseList(res)
}

function resetForm() {
  form.title = ''
  form.description = ''
  form.start_at = ''
  form.due_at = ''
  form.problem_ids_text = ''
  form.is_published = true
  form.allow_late_submission = false
  currentId.value = null
}

function openCreateDialog() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

async function openEditDialog(row) {
  isEdit.value = true
  currentId.value = row.id
  const res = await request.get(`/api/admin/homeworks/${row.id}/`)
  const detail = res?.data || {}
  form.title = detail.title || ''
  form.description = detail.description || ''
  form.start_at = (detail.start_at || '').slice(0, 19)
  form.due_at = (detail.due_at || '').slice(0, 19)
  form.problem_ids_text = Array.isArray(detail.problem_items)
    ? detail.problem_items.map((item) => item.problem_id).join(',')
    : ''
  form.is_published = Boolean(detail.is_published)
  form.allow_late_submission = Boolean(detail.allow_late_submission)
  dialogVisible.value = true
}

function buildPayload() {
  const ids = String(form.problem_ids_text || '')
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && v > 0)

  return {
    title: form.title,
    description: form.description || '',
    start_at: form.start_at,
    due_at: form.due_at,
    is_published: form.is_published,
    allow_late_submission: form.allow_late_submission,
    problem_items: ids.map((pid, idx) => ({
      problem_id: pid,
      order: idx + 1,
      points: 100
    }))
  }
}

async function saveHomework() {
  const payload = buildPayload()
  if (!payload.title || !payload.start_at || !payload.due_at || payload.problem_items.length === 0) {
    ElMessage.warning('请完整填写作业标题、时间和题目列表')
    return
  }

  saving.value = true
  try {
    if (isEdit.value && currentId.value) {
      await request.put(`/api/admin/homeworks/${currentId.value}/`, payload)
      ElMessage.success('作业更新成功')
    } else {
      await request.post('/api/admin/homeworks/', payload)
      ElMessage.success('作业创建成功')
    }
    dialogVisible.value = false
    await fetchHomeworks()
  } catch (error) {
    console.error('保存作业失败', error)
    ElMessage.error(error?.message || '保存作业失败')
  } finally {
    saving.value = false
  }
}

async function deleteHomework(row) {
  try {
    await ElMessageBox.confirm(`确认删除作业《${row.title}》吗？`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }

  await request.delete(`/api/admin/homeworks/${row.id}/`)
  ElMessage.success('删除成功')
  await fetchHomeworks()
}

function goBack() {
  router.push('/admin')
}

onMounted(async () => {
  const isAdmin = localStorage.getItem('is_admin') === 'true'
  if (!isAdmin) {
    router.push('/main')
    return
  }
  await fetchHomeworks()
})
</script>
