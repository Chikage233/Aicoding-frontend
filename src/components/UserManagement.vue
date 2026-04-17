<template>
  <div class="user-management-page">
    <div class="page-header">
      <h1>用户管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="goBack">返回控制台</el-button>
      </div>
    </div>

    <div class="search-section">
      <el-input
        v-model="userSearchQuery"
        placeholder="搜索用户名或邮箱"
        clearable
        style="width: 300px"
      />
    </div>

    <div class="stats-summary">
      <div class="stat-item">
        <span class="stat-label">总用户数:</span>
        <span class="stat-value">{{ users.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">管理员数:</span>
        <span class="stat-value">{{ adminCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">活跃用户:</span>
        <span class="stat-value">{{ activeUserCount }}</span>
      </div>
    </div>

    <div class="user-table-container">
      <el-table
        :data="paginatedUsers"
        style="width: 100%"
        border
        stripe
        v-loading="loading"
      >
        <el-table-column prop="id" label="用户ID" width="80" sortable />
        <el-table-column prop="username" label="用户名" min-width="140" sortable />
        <el-table-column prop="email" label="邮箱" min-width="200" sortable />

        <el-table-column prop="is_staff" label="管理员" width="100" align="center">
          <template #default="scope">
            <el-switch
              :model-value="scope.row.is_staff"
              :disabled="scope.row.id === currentUserId"
              @change="() => toggleAdminStatus(scope.row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="is_active" label="状态" width="100" align="center">
          <template #default="scope">
            <el-switch
              :model-value="scope.row.is_active"
              :disabled="scope.row.id === currentUserId"
              @change="() => toggleUserStatus(scope.row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="date_joined" label="注册时间" min-width="180" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.date_joined) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="scope">
            <div class="action-cell">
              <el-button
                size="small"
                type="primary"
                :disabled="scope.row.id === currentUserId"
                @click="editUser(scope.row)"
              >
                编辑
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          layout="total, prev, pager, next"
          :total="filteredUsers.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

const loading = ref(false)
const users = ref([])
const userSearchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const currentUserId = ref(null)

const filteredUsers = computed(() => {
  const query = userSearchQuery.value.trim().toLowerCase()
  if (!query) return users.value

  return users.value.filter((user) => {
    const username = String(user.username || '').toLowerCase()
    const email = String(user.email || '').toLowerCase()
    return username.includes(query) || email.includes(query)
  })
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

const adminCount = computed(() => users.value.filter((user) => user.is_staff).length)
const activeUserCount = computed(() => users.value.filter((user) => user.is_active).length)

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

function goBack() {
  router.push('/admin')
}

function normalizeUser(user) {
  return {
    ...user,
    is_staff:
      !!user.is_staff ||
      !!user.is_admin ||
      !!user.is_superuser ||
      (user.role && ['admin', 'administrator'].includes(String(user.role).toLowerCase())),
    is_active: user.is_active !== undefined ? !!user.is_active : true
  }
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await request.get('/api/admin/users/')
    const payload = res?.data ?? res

    const list =
      Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.users)
        ? payload.users
        : Array.isArray(payload?.results)
        ? payload.results
        : []

    users.value = list.map(normalizeUser)

    const meRes = await request.get('/api/auth/jwt/me/')
    const me = meRes?.data ?? meRes
    currentUserId.value = me?.id ?? null
  } catch (error) {
    console.error('获取用户列表失败:', error)
    users.value = []
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

async function toggleAdminStatus(user) {
  const original = !!user.is_staff

  try {
    await ElMessageBox.confirm(
      `确定要${original ? '撤销' : '授予'}用户「${user.username}」的管理员权限吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    user.is_staff = !original

    try {
      await request.patch(`/api/admin/users/${user.id}/role/`, {
        role: user.is_staff ? 'admin' : 'user'
      })
      ElMessage.success('权限更新成功')
    } catch (apiError) {
      user.is_staff = original
      console.error('更新管理员权限失败:', apiError)
      ElMessage.error('后端暂未开放权限修改接口或接口异常，已回滚')
    }
  } catch (error) {
    user.is_staff = original
    if (error !== 'cancel' && error?.name !== 'Cancel') {
      console.error('管理员状态切换失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

async function toggleUserStatus(user) {
  const original = !!user.is_active

  try {
    await ElMessageBox.confirm(
      `确定要${original ? '禁用' : '启用'}用户「${user.username}」吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    user.is_active = !original
    ElMessage.warning('后端暂未开放用户状态修改接口，已回滚')
    user.is_active = original
  } catch (error) {
    user.is_active = original
    if (error !== 'cancel' && error?.name !== 'Cancel') {
      console.error('用户状态切换失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

function editUser(user) {
  ElMessageBox.alert(`用户名: ${user.username}\n邮箱: ${user.email}`, '用户信息', {
    confirmButtonText: '确定'
  })
}

onMounted(async () => {
  const isAdmin = localStorage.getItem('is_admin') === 'true'
  const token = localStorage.getItem('token')

  if (!token || !isAdmin) {
    router.push('/main')
    return
  }

  await fetchUsers()
})
</script>

<style scoped>
.user-management-page {
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
}

.search-section {
  margin-bottom: 20px;
}

.stats-summary {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.user-table-container {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 0 8px;
}

.action-cell .el-button {
  width: 80px;
  text-align: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding-bottom: 20px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .stats-summary {
    flex-direction: column;
    gap: 15px;
  }

  .search-section :deep(.el-input) {
    width: 100% !important;
  }

  .action-cell .el-button {
    width: 60px;
    font-size: 12px;
    padding: 6px 8px;
  }
}
</style>
