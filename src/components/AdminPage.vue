<template>
  <div class="admin-page">
    <div class="admin-header">
      <h1>管理员控制台</h1>
      <p v-if="hasPermission">欢迎，管理员！</p>
      <p v-else>您没有访问管理员页面的权限。</p>
      <!-- 退出登录按钮 -->
      <button class="logout-button" @click="handleLogout">退出管理员登录</button>
    </div>
    
    <!-- 用户活跃度统计 -->
    <div class="stats-section">
      <h2>用户活跃度统计</h2>
      <div class="stats-grid">
        <router-link to="/admin/users" class="stat-card-link">
          <div class="stat-card clickable">
            <div class="stat-value">{{ userStats.total_users }}</div>
            <div class="stat-label">总用户数</div>
            <div class="expand-indicator">
              →
            </div>
          </div>
        </router-link>
        <div class="stat-card">
          <div class="stat-value">{{ userStats.active_users }}</div>
          <div class="stat-label">活跃用户数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ userStats.today_logins }}</div>
          <div class="stat-label">今日登录</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ userStats.week_logins }}</div>
          <div class="stat-label">本周登录</div>
        </div>
      </div>
    </div>
    
    <!-- 题目使用统计 -->
    <div class="stats-section">
      <h2>题目使用统计</h2>
      <div class="stats-grid">
        <router-link to="/admin/problems" class="stat-card-link">
          <div class="stat-card clickable">
            <div class="stat-value">{{ problemStats.total_problems }}</div>
            <div class="stat-label">总题目数</div>
            <div class="expand-indicator">
              →
            </div>
          </div>
        </router-link>
        <div class="stat-card">
          <div class="stat-value">{{ problemStats.solved_count }}</div>
          <div class="stat-label">已解决题目</div>
        </div>
        <div class="stat-card difficulty-easy">
          <div class="stat-value">{{ problemStats.easy_count }}</div>
          <div class="stat-label">简单题目</div>
        </div>
        <div class="stat-card difficulty-medium">
          <div class="stat-value">{{ problemStats.medium_count }}</div>
          <div class="stat-label">中等题目</div>
        </div>
        <div class="stat-card difficulty-hard">
          <div class="stat-value">{{ problemStats.hard_count }}</div>
          <div class="stat-label">困难题目</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ problemStats.avg_acceptance_rate }}%</div>
          <div class="stat-label">平均通过率</div>
        </div>
      </div>
    </div>
    
    <!-- 详细统计表格 -->
    <div class="detailed-stats">
      <div class="stats-table">
        <h3>题目难度分布</h3>
        <table class="stats-table-content">
          <thead>
            <tr>
              <th>难度</th>
              <th>题目数量</th>
              <th>完成数量</th>
              <th>完成率</th>
              <th>平均通过率</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="difficulty-easy">简单</td>
              <td>{{ problemStats.easy_count }}</td>
              <td>{{ problemStats.easy_solved }}</td>
              <td>{{ getCompletionRate(problemStats.easy_solved, problemStats.easy_count) }}%</td>
              <td>{{ problemStats.easy_acceptance_rate }}%</td>
            </tr>
            <tr>
              <td class="difficulty-medium">中等</td>
              <td>{{ problemStats.medium_count }}</td>
              <td>{{ problemStats.medium_solved }}</td>
              <td>{{ getCompletionRate(problemStats.medium_solved, problemStats.medium_count) }}%</td>
              <td>{{ problemStats.medium_acceptance_rate }}%</td>
            </tr>
            <tr>
              <td class="difficulty-hard">困难</td>
              <td>{{ problemStats.hard_count }}</td>
              <td>{{ problemStats.hard_solved }}</td>
              <td>{{ getCompletionRate(problemStats.hard_solved, problemStats.hard_count) }}%</td>
              <td>{{ problemStats.hard_acceptance_rate }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="stats-table">
        <h3>用户活跃度趋势</h3>
        <table class="stats-table-content">
          <thead>
            <tr>
              <th>时间段</th>
              <th>新注册用户</th>
              <th>活跃用户</th>
              <th>登录次数</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>今日</td>
              <td>{{ userStats.today_registrations }}</td>
              <td>{{ userStats.today_active }}</td>
              <td>{{ userStats.today_logins }}</td>
            </tr>
            <tr>
              <td>本周</td>
              <td>{{ userStats.week_registrations }}</td>
              <td>{{ userStats.week_active }}</td>
              <td>{{ userStats.week_logins }}</td>
            </tr>
            <tr>
              <td>本月</td>
              <td>{{ userStats.month_registrations }}</td>
              <td>{{ userStats.month_active }}</td>
              <td>{{ userStats.month_logins }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/utils/request';

export default {
  name: 'AdminPage',
  setup() {
    const hasPermission = ref(false);
    const router = useRouter();
    
    // 用户统计数据
    const userStats = ref({
      total_users: 0,
      active_users: 0,
      today_registrations: 0,
      week_registrations: 0,
      month_registrations: 0,
      today_active: 0,
      week_active: 0,
      month_active: 0,
      today_logins: 0,
      week_logins: 0,
      month_logins: 0
    });
    
    // 题目统计数据
    const problemStats = ref({
      total_problems: 0,
      solved_count: 0,
      easy_count: 0,
      medium_count: 0,
      hard_count: 0,
      easy_solved: 0,
      medium_solved: 0,
      hard_solved: 0,
      avg_acceptance_rate: 0,
      easy_acceptance_rate: 0,
      medium_acceptance_rate: 0,
      hard_acceptance_rate: 0
    });
    
    // 用户管理相关状态
    const showUserManagement = ref(false);
    const users = ref([]);
    const userSearchQuery = ref('');
    const currentPage = ref(1);
    const pageSize = ref(10);
    const currentUserId = ref(null);
    
    // 计算属性：过滤后的用户列表
    const filteredUsers = computed(() => {
      let filtered = users.value;
      
      if (userSearchQuery.value) {
        const query = userSearchQuery.value.toLowerCase();
        filtered = filtered.filter(user => 
          user.username.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query)
        );
      }
      
      return filtered;
    });
    
    // 计算属性：当前页用户
    const paginatedUsers = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return filteredUsers.value.slice(start, end);
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
    
    // 切换用户管理面板
    const toggleUserManagement = () => {
      showUserManagement.value = !showUserManagement.value;
      if (showUserManagement.value && users.value.length === 0) {
        fetchUsers();
      }
    };
    
    // 获取用户列表
    const fetchUsers = async () => {
      try {
        const response = await request.get('/admin/users/');
        users.value = response.data || response;
        
        // 获取当前用户ID
        const userInfoResponse = await request.get('/auth/jwt/me/');
        const userInfo = userInfoResponse.data || userInfoResponse;
        currentUserId.value = userInfo.id || null;
      } catch (error) {
        console.error('获取用户列表失败:', error);
        users.value = [];
      }
    };
    
    // 计算完成率
    const getCompletionRate = (solved, total) => {
      if (total === 0) return 0;
      return Math.round((solved / total) * 100);
    };
    
    // 退出登录处理
    const handleLogout = () => {
      // 清除所有与用户权限相关的本地存储状态
      localStorage.removeItem('token');
      localStorage.removeItem('is_admin');
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      
      // 重定向到登录页面
      router.push('/login');
    };
    
    // 获取用户统计信息
    const fetchUserStats = async () => {
      try {
        // 使用正确的用户统计API端点
        const response = await request.get('/admin/statistics/users/');
        const apiData = response.data || response;
        
        // 根据实际API响应格式映射字段
        userStats.value = {
          total_users: apiData.total_users || 0,
          active_users: apiData.active_users_today || 0, // 使用今日活跃用户作为活跃用户数
          today_registrations: apiData.registrations_today || 0,
          week_registrations: apiData.registrations_week || 0,
          month_registrations: apiData.registrations_month || 0,
          today_active: apiData.active_users_today || 0,
          week_active: apiData.active_users_week || 0,
          month_active: apiData.active_users_month || 0,
          today_logins: apiData.logins_today || 0,
          week_logins: apiData.logins_week || 0,
          month_logins: apiData.logins_month || 0
        };
      } catch (error) {
        console.warn('用户统计API不可用，使用默认值:', error);
        // 设置合理的默认值
        userStats.value = {
          total_users: 0,
          active_users: 0,
          today_registrations: 0,
          week_registrations: 0,
          month_registrations: 0,
          today_active: 0,
          week_active: 0,
          month_active: 0,
          today_logins: 0,
          week_logins: 0,
          month_logins: 0
        };
      }
    };
    
    // 获取题目完成状态
    const fetchUserCompletions = async () => {
      try {
        const response = await request.get('/user/completions/');
        // 返回完成的题目ID集合，便于快速查找
        const completedProblems = new Set();
        const completions = response.data || response;
        if (Array.isArray(completions)) {
          completions.forEach(completion => {
            if (completion.problem_id) {
              completedProblems.add(Number(completion.problem_id));
            }
          });
        }
        return completedProblems;
      } catch (error) {
        console.warn('获取用户完成状态失败:', error);
        return new Set();
      }
    };
    
    // 获取题目列表并计算统计信息
    const fetchProblemStats = async () => {
      try {
        // 并行获取题目列表和完成状态
        const [problemsResponse, completedProblems] = await Promise.all([
          request.get('/leetcode/problems/'),
          fetchUserCompletions()
        ]);
        
        const problems = problemsResponse.data.problems || problemsResponse.data || [];
        
        // 初始化计数器
        let totalProblems = 0;
        let solvedCount = 0;
        let easyCount = 0, mediumCount = 0, hardCount = 0;
        let easySolved = 0, mediumSolved = 0, hardSolved = 0;
        let totalAcceptance = 0;
        let easyAcceptance = 0, mediumAcceptance = 0, hardAcceptance = 0;
        
        // 遍历题目计算统计信息
        problems.forEach(problem => {
          if (!problem) return;
          
          totalProblems++;
          const acceptanceRate = problem.acceptance_rate || 0;
          totalAcceptance += acceptanceRate;
          
          // 检查是否已完成
          const isSolved = completedProblems.has(Number(problem.problem_id));
          if (isSolved) {
            solvedCount++;
          }
          
          // 转换难度并统计
          let difficulty = problem.difficulty;
          if (difficulty === 'easy' || difficulty === 1) {
            difficulty = '简单';
            easyCount++;
            easyAcceptance += acceptanceRate;
            if (isSolved) easySolved++;
          } else if (difficulty === 'medium' || difficulty === 2) {
            difficulty = '中等';
            mediumCount++;
            mediumAcceptance += acceptanceRate;
            if (isSolved) mediumSolved++;
          } else if (difficulty === 'hard' || difficulty === 3) {
            difficulty = '困难';
            hardCount++;
            hardAcceptance += acceptanceRate;
            if (isSolved) hardSolved++;
          } else if (difficulty === '简单') {
            easyCount++;
            easyAcceptance += acceptanceRate;
            if (isSolved) easySolved++;
          } else if (difficulty === '中等') {
            mediumCount++;
            mediumAcceptance += acceptanceRate;
            if (isSolved) mediumSolved++;
          } else if (difficulty === '困难') {
            hardCount++;
            hardAcceptance += acceptanceRate;
            if (isSolved) hardSolved++;
          }
        });
        
        // 计算平均通过率
        const avgAcceptance = totalProblems > 0 ? totalAcceptance / totalProblems : 0;
        const easyAvgAcceptance = easyCount > 0 ? easyAcceptance / easyCount : 0;
        const mediumAvgAcceptance = mediumCount > 0 ? mediumAcceptance / mediumCount : 0;
        const hardAvgAcceptance = hardCount > 0 ? hardAcceptance / hardCount : 0;
        
        problemStats.value = {
          total_problems: totalProblems,
          solved_count: solvedCount,
          easy_count: easyCount,
          medium_count: mediumCount,
          hard_count: hardCount,
          easy_solved: easySolved,
          medium_solved: mediumSolved,
          hard_solved: hardSolved,
          avg_acceptance_rate: Math.round(avgAcceptance * 100) / 100,
          easy_acceptance_rate: Math.round(easyAvgAcceptance * 100) / 100,
          medium_acceptance_rate: Math.round(mediumAvgAcceptance * 100) / 100,
          hard_acceptance_rate: Math.round(hardAvgAcceptance * 100) / 100
        };
      } catch (error) {
        console.error('获取题目统计信息失败:', error);
        // 设置默认值
        problemStats.value = {
          total_problems: 0,
          solved_count: 0,
          easy_count: 0,
          medium_count: 0,
          hard_count: 0,
          easy_solved: 0,
          medium_solved: 0,
          hard_solved: 0,
          avg_acceptance_rate: 0,
          easy_acceptance_rate: 0,
          medium_acceptance_rate: 0,
          hard_acceptance_rate: 0
        };
      }
    };
    
    onMounted(async () => {
      // 检查是否有管理员权限
      const isAdmin = localStorage.getItem('is_admin') === 'true';
      const token = localStorage.getItem('token');
      
      if (!token || !isAdmin) {
        // 没有权限，重定向到主页面
        router.push('/main');
        return;
      }
      
      hasPermission.value = true;
      
      // 并行获取统计数据
      await Promise.all([
        fetchUserStats(),
        fetchProblemStats()
      ]);
    });
    
    return {
      hasPermission,
      userStats,
      problemStats,
      getCompletionRate,
      handleLogout,
      // 用户管理相关
      showUserManagement,
      toggleUserManagement,
      users,
      userSearchQuery,
      filteredUsers,
      currentPage,
      pageSize,
      currentUserId,
      paginatedUsers,
      formatDate,
      fetchUsers,
      fetchUserStats,
      fetchProblemStats
    };
  }
};
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #fff;
  padding: 20px;
}

.admin-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-header h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

/* 退出登录按钮样式 */
.logout-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.logout-button:hover {
  background-color: #c82333;
}

.stats-section {
  margin-bottom: 40px;
}

.stats-section h2 {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: transform 0.2s ease;
  position: relative;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* 可点击的统计卡片 */
.stat-card.clickable {
  cursor: pointer;
  background: #e9f5ff;
}

.stat-card.clickable:hover {
  background: #d1e9ff;
}

/* 统计卡片链接 */
.stat-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.stat-card-link:hover {
  text-decoration: none;
}

/* 展开指示器 */
.expand-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 16px;
  color: #007bff;
  transition: transform 0.3s ease;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.difficulty-easy {
  background-color: #dbf0df !important;
  border-left: 4px solid #28a745;
}

.difficulty-medium {
  background-color: #fef8dc !important;
  border-left: 4px solid #ffc107;
}

.difficulty-hard {
  background-color: #ffe0e0 !important;
  border-left: 4px solid #dc3545;
}

.detailed-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.stats-table h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
}

.stats-table-content {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stats-table-content th,
.stats-table-content td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.stats-table-content th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.stats-table-content tr:last-child td {
  border-bottom: none;
}

.stats-table-content td.difficulty-easy {
  color: #28a745;
  font-weight: 600;
}

.stats-table-content td.difficulty-medium {
  color: #ffc107;
  font-weight: 600;
}

.stats-table-content td.difficulty-hard {
  color: #dc3545;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .detailed-stats {
    grid-template-columns: 1fr;
  }
  
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .logout-button {
    align-self: flex-end;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .admin-header h1 {
    font-size: 20px;
  }
  
  .stat-value {
    font-size: 20px;
  }
}
</style>