<template>
  <div class="user-homework-page">
    <div class="page-header">
      <h1>我的作业</h1>
      <el-button type="primary" @click="goBack">返回主页</el-button>
    </div>

    <el-table :data="homeworks" border stripe style="width: 100%">
      <el-table-column prop="title" label="作业" min-width="220" />
      <el-table-column label="时间" min-width="260">
        <template #default="scope">
          <div>开始：{{ formatDateTime(scope.row.start_at) }}</div>
          <div>截止：{{ formatDateTime(scope.row.due_at) }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="problem_count" label="题目数" width="90" />
      <el-table-column label="状态" width="120">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.submission_status)">
            {{ statusText(scope.row.submission_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="viewDetail(scope.row)">查看详情</el-button>
          <el-button size="small" type="success" @click="openSubmit(scope.row)">提交作业</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="detailVisible" title="作业详情" width="760px">
      <template v-if="currentDetail">
        <h3>{{ currentDetail.title }}</h3>
        <p>{{ currentDetail.description || '无描述' }}</p>
        <p>截止时间：{{ formatDateTime(currentDetail.due_at) }}</p>
        <el-table :data="currentDetail.problem_items || []" border stripe>
          <el-table-column prop="problem_id" label="题号" width="100" />
          <el-table-column prop="title" label="题目" min-width="220" />
          <el-table-column prop="difficulty" label="难度" width="120" />
          <el-table-column prop="points" label="分值" width="100" />
        </el-table>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="submitVisible" title="提交作业" width="560px">
      <p v-if="submitTarget">作业：{{ submitTarget.title }}</p>
      <el-input v-model="submitNotes" type="textarea" :rows="4" placeholder="可填写提交说明" />
      <template #footer>
        <el-button @click="submitVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitHomework">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const homeworks = ref([])
const detailVisible = ref(false)
const currentDetail = ref(null)
const submitVisible = ref(false)
const submitTarget = ref(null)
const submitNotes = ref('')
const submitting = ref(false)

function formatDateTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('zh-CN')
}

function statusText(status) {
  if (status === 'submitted') return '已提交'
  if (status === 'late_submitted') return '逾期提交'
  if (status === 'in_progress') return '进行中'
  if (status === 'expired') return '已截止'
  return '未开始'
}

function statusTagType(status) {
  if (status === 'submitted') return 'success'
  if (status === 'late_submitted') return 'warning'
  if (status === 'expired') return 'danger'
  return 'info'
}

function normalizeResponseList(res) {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  return []
}

async function fetchHomeworks() {
  const res = await request.get('/api/user/homeworks/')
  homeworks.value = normalizeResponseList(res)
}

async function viewDetail(row) {
  const res = await request.get(`/api/user/homeworks/${row.id}/`)
  currentDetail.value = res?.data || null
  detailVisible.value = true
}

function openSubmit(row) {
  submitTarget.value = row
  submitNotes.value = ''
  submitVisible.value = true
}

async function submitHomework() {
  if (!submitTarget.value) return
  submitting.value = true
  try {
    await request.post(`/api/user/homeworks/${submitTarget.value.id}/submit/`, {
      notes: submitNotes.value
    })
    ElMessage.success('提交成功')
    submitVisible.value = false
    await fetchHomeworks()
  } catch (error) {
    console.error('提交作业失败', error)
    ElMessage.error(error?.message || '提交作业失败')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/main')
}

onMounted(async () => {
  await fetchHomeworks()
})
</script>
