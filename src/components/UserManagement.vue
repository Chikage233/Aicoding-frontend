<template>
  <div class="user-management-page">
    <div class="page-header">
      <h1>用户管理</h1>
      <div class="header-actions">
        <el-button @click="goBack" type="primary">返回控制台</el-button>
      </div>
    </div>
    
    <div class="search-section">
      <el-input 
        v-model="userSearchQuery" 
        placeholder="搜索用户名或邮箱" 
        clearable
        style="width: 300px;"
        @input="handleSearch"
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
        class="user-table"
      >
        <el-table-column prop="id" label="用户ID" width="70" sortable />
        <el-table-column prop="username" label="用户名" min-width="120" sortable />
        <el-table-column prop="email" label="邮箱" min-width="180" sortable />
        <el-table-column prop="is_staff" label="管理员" width="90" align="center">
          <template #default="scope">
            <el-switch
              :model-value="scope.row.is_staff"
              @change="() => toggleAdminStatus(scope.row)"
              :disabled="scope.row.id === currentUserId"
            />
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="90" align="center">
          <template #default="scope">
            <el-switch
              :model-value="scope.row.is_active"
              @change="() => toggleUserStatus(scope.row)"
              :disabled="scope.row.id === currentUserId"
            />
          </template>
        </el-table-column>
        <el-table-column prop="date_joined" label="注册时间" min-width="160" sortable>
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
                @click="editUser(scope.row)"
                :disabled="scope.row.id === currentUserId"
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
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'UserManagement',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const users = ref([]);
    const userSearchQuery = ref('');
    const currentPage = ref(1);
    const pageSize = ref(10);
    const currentUserId = ref(null);
    const filteredUsers = ref([]);
    
    // 计算属性
    const paginatedUsers = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return filteredUsers.value.slice(start, end);
    });
    
    const adminCount = computed(() => {
      return users.value.filter(user => user.is_staff === true).length;
    });
    
    const activeUserCount = computed(() => {
      return users.value.filter(user => user.is_active === true).length;
    });
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // 返回控制台
    const goBack = () => {
      router.push('/admin');
    };
    
    // 获取用户列表
    const fetchUsers = async () => {
      loading.value = true;
      try {
        const response = await request.get('/admin/users/');
        let usersData = response.data || response;
        
        // 确保usersData是数组
        if (!Array.isArray(usersData)) {
          usersData = usersData.users || usersData.results || [];
        }
        
        // 处理每个用户的管理员状态，兼容不同的字段名称
        usersData = usersData.map(user => {
          // 根据后端可能返回的不同字段确定管理员状态
          const isStaff = user.is_staff || 
                         user.is_admin || 
                         user.is_superuser || 
                         (user.role && (user.role === 'admin' || user.role === 'administrator'));
          
          return {
            ...user,
            is_staff: !!isStaff, // 确保是布尔值
            is_active: user.is_active !== undefined ? user.is_active : true // 默认激活
          };
        });
        
        users.value = usersData;
        filteredUsers.value = [...users.value];
        
        // 获取当前用户ID
        const userInfoResponse = await request.get('/auth/jwt/me/');
        const userInfo = userInfoResponse.data || userInfoResponse;
        currentUserId.value = userInfo.id || null;
      } catch (error) {
        console.error('获取用户列表失败:', error);
        ElMessage.error('获取用户列表失败');
        users.value = [];
        filteredUsers.value = [];
      } finally {
        loading.value = false;
      }
    };
    
    // 搜索处理
    const handleSearch = () => {
      if (!userSearchQuery.value) {
        filteredUsers.value = [...users.value];
        currentPage.value = 1;
        return;
      }
      
      const query = userSearchQuery.value.toLowerCase();
      filteredUsers.value = users.value.filter(user => 
        user.username.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
      );
      currentPage.value = 1;
    };
    
    // 切换管理员状态
    const toggleAdminStatus = async (user) => {
      // 保存原始状态
      const originalIsStaff = user.is_staff;
      
      try {
        await ElMessageBox.confirm(
          `确定要${originalIsStaff ? '撤销' : '授予'}用户 "${user.username}" 的管理员权限吗？`,
          '确认操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        // 确认后才改变状态
        user.is_staff = !originalIsStaff;
        
        const response = await request.patch(`/admin/users/${user.id}/`, {
          is_staff: user.is_staff
        });
        
        ElMessage.success('权限更新成功');
      } catch (error) {
        if (error.name !== 'Cancel') {
          console.error('更新管理员权限失败:', error);
          ElMessage.error('更新权限失败');
          // 恢复原状态
          user.is_staff = originalIsStaff;
        } else {
          // 用户取消操作，恢复原状态
          user.is_staff = originalIsStaff;
        }
      }
    };
    
    // 切换用户状态（启用/禁用）
    const toggleUserStatus = async (user) => {
      // 保存原始状态
      const originalIsActive = user.is_active;
      
      try {
        await ElMessageBox.confirm(
          `确定要${originalIsActive ? '禁用' : '启用'}用户 "${user.username}" 吗？`,
          '确认操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        // 确认后才改变状态
        user.is_active = !originalIsActive;
        
        const response = await request.patch(`/admin/users/${user.id}/`, {
          is_active: user.is_active
        });
        
        ElMessage.success('用户状态更新成功');
      } catch (error) {
        if (error.name !== 'Cancel') {
          console.error('更新用户状态失败:', error);
          ElMessage.error('更新用户状态失败');
          // 恢复原状态
          user.is_active = originalIsActive;
        } else {
          // 用户取消操作，恢复原状态
          user.is_active = originalIsActive;
        }
      }
    };
    
    // 编辑用户
    const editUser = (user) => {
      ElMessageBox.alert(
        `编辑用户功能暂未实现。\n用户名: ${user.username}\n邮箱: ${user.email}`,
        '用户信息',
        {
          confirmButtonText: '确定'
        }
      );
    };
    
    // 处理分页变化
    const handlePageChange = (page) => {
      currentPage.value = page;
    };
    
    onMounted(() => {
      // 检查权限
      const isAdmin = localStorage.getItem('is_admin') === 'true';
      const token = localStorage.getItem('token');
      
      if (!token || !isAdmin) {
        router.push('/main');
        return;
      }
      
      fetchUsers();
    });
    
    return {
      loading,
      users,
      userSearchQuery,
      filteredUsers,
      paginatedUsers,
      currentPage,
      pageSize,
      currentUserId,
      adminCount,
      activeUserCount,
      formatDate,
      goBack,
      fetchUsers,
      handleSearch,
      toggleAdminStatus,
      toggleUserStatus,
      editUser,
      handlePageChange
    };
  }
};
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 操作列样式 */
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
}

/* 响应式设计 */
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
  
  .search-section .el-input {
    width: 100% !important;
  }
  
  /* 移动端操作列调整 */
  .action-cell .el-button {
    width: 60px;
    font-size: 12px;
    padding: 6px 8px;
  }
}
</style>