<template>
  <div class="main-page">
    <nav class="navbar">
      <div class="navbar-left">
        <span class="system-name">编程 AI 助教</span>
      </div>
      <div class="navbar-right">
        <button @click="goToAIChat" class="ai-chat-button">
          <span class="icon-message">💬</span>
          AI 助手
        </button>
        <div class="user-center" @click="toggleUserMenu">
          <img class="avatar" :src="user.avatar" alt="avatar" />
          <span class="username">{{ user.username }}</span>
        </div>
        <div v-if="showUserMenu" class="user-menu">
          <div class="user-menu-item" @click="goProfile">个人中心</div>
          <div class="user-menu-item" @click="logout">退出登录</div>
        </div>
      </div>
    </nav>
    
    <!-- 状态栏 - 当选择"全部"时显示 -->
    <div v-if="difficultyFilter === ''" class="status-bar">
      <div class="status-item">
        <span class="status-label">已做题数</span>
        <span class="status-value">{{ doneCount }}</span>
      </div>
      <div class="status-item">
        <span class="status-label difficulty-easy">简单 {{ easyCount }}</span>
      </div>
      <div class="status-item">
        <span class="status-label difficulty-medium">中等 {{ mediumCount }}</span>
      </div>
      <div class="status-item">
        <span class="status-label difficulty-hard">困难 {{ hardCount }}</span>
      </div>
    </div>
    
    <div class="main-content">
      <div class="search-container">
        <input
          v-model="searchQuery"
          @input="onSearchInput"
          @focus="onSearchInput"
          @blur="hideSuggestions"
          class="search-input"
          placeholder="搜索题目名称或编号"
          type="text"
        />
      </div>
      
      <!-- 筛选项 -->
      <div class="filter-container">
        <label>难度:</label>
        <el-radio-group v-model="difficultyFilter" @change="onDifficultyChange">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="简单">简单</el-radio-button>
          <el-radio-button label="中等">中等</el-radio-button>
          <el-radio-button label="困难">困难</el-radio-button>
        </el-radio-group>
      </div>
      
      <div v-if="loading" class="loading">加载中...</div>
      <table v-else class="questions-table">
        <thead>
          <tr>
            <th>编号</th>
            <th>题目</th>
            <th>难度</th>
            <th>通过率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedQuestions" :key="item.problem_id">
            <td>{{ item.problem_id }}</td>
            <td>
              <router-link :to="`/leetcode/problems/${item.problem_id}/`" class="problem-link">
                {{ item.title }}
              </router-link>
            </td>
            <td :class="'difficulty-' + item.difficulty">{{ item.difficulty }}</td>
            <td>{{ item.acceptance_rate }}%</td>
          </tr>
        </tbody>
      </table>
      
      <!-- 分页组件 -->
      <div class="pagination" v-if="!loading && filteredQuestions.length > 0">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredQuestions.length">
        </el-pagination>
      </div>
      
      <div v-if="!loading && filteredQuestions.length === 0" class="no-data">
        没有找到匹配的题目
      </div>
    </div>
  </div>
</template>

<script>
import request from '@/utils/request';
import { ElMessageBox } from 'element-plus';
import { ElRadio, ElRadioButton, ElRadioGroup, ElPagination } from 'element-plus';

export default {
  name: 'MainPage',
  components: {
    ElRadio,
    ElRadioButton,
    ElRadioGroup,
    ElPagination
  },
  data() {
    return {
      user: {
        username: '',
        avatar: '',
      },
      showUserMenu: false,
      searchQuery: '',
      questions: [],
      loading: true,
      difficultyFilter: '', // ''表示全部，其他值对应难度筛选
      currentPage: 1,
      pageSize: 15
    };
  },
  computed: {
    filteredQuestions() {
      let result = this.questions;
      
      // 按搜索关键词过滤
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        result = result.filter(item => 
          item.title.toLowerCase().includes(q) || 
          item.problem_id.toString().includes(q)
        );
      }
      
      // 按难度过滤
      if (this.difficultyFilter) {
        result = result.filter(item => item.difficulty === this.difficultyFilter);
      }
      
      return result;
    },
    paginatedQuestions() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredQuestions.slice(start, end);
    },
    doneCount() {
      // 计算已完成题目数量（这里可以根据实际数据结构调整）
      // 假设有字段标记题目是否完成，例如 is_done 或 solved
      return this.questions.filter(item => item.is_done || item.solved).length;
    },
    easyCount() {
      return this.questions.filter(item => item.difficulty === '简单').length;
    },
    mediumCount() {
      return this.questions.filter(item => item.difficulty === '中等').length;
    },
    hardCount() {
      return this.questions.filter(item => item.difficulty === '困难').length;
    }
  },
  methods: {
    async fetchUserInfo() {
      try {
        // 修复：添加 /api 前缀
        const res = await request.get('/api/auth/jwt/me/');
        console.log('用户信息接口返回：', res);
        const userInfo = res.data && res.data.user ? res.data.user : {};
        this.user.username = userInfo.username || '未登录';
        this.user.avatar = userInfo.avatar || 'https://i.pravatar.cc/40?img=3';
      } catch (e) {
        // 检查是否有token，如果没有则重定向到登录页面
        const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
        if(!token) {
          this.$router.push('/login');
        }
        this.user.username = '未登录';
        this.user.avatar = 'https://i.pravatar.cc/40?img=3';
      }
    },
    async fetchQuestions() {
      try {
        this.loading = true;
        // 修复：添加 /api 前缀
        const response = await request.get('/api/leetcode/problems/');
        this.questions = response.data.problems || response.data;
        
        // 确保难度字段格式正确
        this.questions.forEach(question => {
          if (question.difficulty === 'easy' || question.difficulty === 1) {
            question.difficulty = '简单';
          } else if (question.difficulty === 'medium' || question.difficulty === 2) {
            question.difficulty = '中等';
          } else if (question.difficulty === 'hard' || question.difficulty === 3) {
            question.difficulty = '困难';
          }
        });
      } catch (error) {
        console.error('获取题目列表失败:', error);
      } finally {
        this.loading = false;
      }
    },
    handleSizeChange(newSize) {
      this.pageSize = newSize;
      this.currentPage = 1;
    },
    handleCurrentChange(newPage) {
      this.currentPage = newPage;
    },
    goProfile() {
      try {
        this.$router.push('/profile').catch(err => {
          console.error('路由跳转失败:', err);
        });
        this.showUserMenu = false;
      } catch (error) {
        console.error('goProfile 方法执行出错:', error);
      }
    },
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
    },
    onSearchInput() {
      // 搜索逻辑
      this.currentPage = 1; // 重置到第一页
    },
    hideSuggestions() {
      // 隐藏建议列表
    },
    onDifficultyChange() {
      // 难度过滤变化
      this.currentPage = 1; // 重置到第一页
    },
    goToAIChat() {
      this.$router.push('/ai-chat');
    },
    async logout() {
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );
      } catch {
        return;
      }
      try {
        // 修复：添加 /api 前缀
        await request.post('/api/auth/jwt/logout/');
      } catch (e) {
      }
      // 清除所有用户相关的本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('is_admin');
      localStorage.removeItem('user_info');
      this.$router.push('/login');
    },
  },
  mounted() {
    this.fetchUserInfo();
    this.fetchQuestions();
  },
};
</script>

<style scoped>
/* 样式同之前，直接粘贴原有内容 */
.main-page {
  min-height: 100vh;
  width: 100%;
  background: #fff; /* 统一背景色为白色 */
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
  padding: 0 20px;
  height: 64px;
  background: #222;
  color: #fff;
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  min-height: 64px;
  box-sizing: border-box;
}

.navbar-left {
  display: flex;
  align-items: center;
}

.system-name {
  font-size: 22px;
  font-weight: bold;
  margin-right: 20px;
  white-space: nowrap;
}

.navbar-right {
  display: flex;
  align-items: center;
  min-width: 0; /* Allow this to shrink */
  flex-shrink: 1;
}

.user-center {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 18px;
  transition: background 0.2s;
  white-space: nowrap;
}

.user-center:hover {
  background: rgba(255, 255, 255, 0.1);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #409eff;
  flex-shrink: 0;
}

.username {
  font-size: 15px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-menu {
  position: absolute;
  top: 52px;
  right: 20px;
  background: #fff;
  color: #222;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 120px;
  z-index: 20;
}

.user-menu-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
}

.user-menu-item:hover {
  background: #f5f7fa;
}

.status-bar {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 15px 0;
  background-color: #f5f7fa;
  border-bottom: 1px solid #eee;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.status-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.difficulty-easy {
  color: green;
}

.difficulty-medium {
  color: #d4a70d;
}

.difficulty-hard {
  color: #e30f0f;
}

.main-content {
  flex: 1 1 auto;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 32px 20px;
  box-sizing: border-box;
  background: #fff;
  overflow: auto;
}

.search-container {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 8px 20px;
  border-radius: 24px;
  border: 1px solid #ccc;
  outline: none;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.filter-container {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-container label {
  font-weight: bold;
}

.questions-table {
  width: 100%;
  border-collapse: collapse;
}

.questions-table th,
.questions-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.problem-link {
  color: #409eff;
  text-decoration: underline;
  cursor: pointer;
}

.problem-link:hover {
  color: #2a6bd1;
}

.loading {
  text-align: center;
  padding: 20px;
  font-size: 16px;
  color: #666;
}

.no-data {
  text-align: center;
  padding: 20px;
  font-size: 16px;
  color: #666;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.difficulty-简单 {
  background-color: #dbf0df;
  color: green;
  padding: 4px 8px;
  border-radius: 4px;
}

.difficulty-中等 {
  background-color: #fef8dc;
  color: #d4a70d;
  padding: 4px 8px;
  border-radius: 4px;
}

.difficulty-困难 {
  background-color: #ffe0e0;
  color: #e30f0f;
  padding: 4px 8px;
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar {
    padding: 0 15px;
  }
  
  .system-name {
    font-size: 18px;
    margin-right: 10px;
  }
  
  .username {
    font-size: 14px;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .status-bar {
    gap: 15px;
    padding: 10px 0;
  }
  
  .status-item {
    flex: 1;
    min-width: 70px;
  }
  
  .main-content {
    padding: 20px 15px;
  }
  
  .filter-container {
    justify-content: center;
  }
  
  .questions-table {
    font-size: 14px;
  }
  
  .questions-table th,
  .questions-table td {
    padding: 6px;
  }
}

@media (max-width: 480px) {
  .navbar {
    padding: 0 10px;
    height: 56px;
  }
  
  .system-name {
    font-size: 16px;
    margin-right: 8px;
  }
  
  .username {
    display: none; /* 在小屏幕上隐藏用户名 */
  }
  
  .status-bar {
    flex-wrap: wrap;
    gap: 5px;
  }
  
  .status-item {
    min-width: calc(50% - 10px);
    margin-bottom: 5px;
  }
  
  .main-content {
    padding: 15px 10px;
  }
  
  .search-input {
    font-size: 16px; /* 防止iOS Safari缩放 */
  }
  
  .questions-table th,
  .questions-table td {
    padding: 4px;
  }
}

.ai-chat-button {
  width: 100px;
  padding: 8px 12px;
  margin: 0 15px 0 0;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background-color 0.3s;
}

.ai-chat-button:hover {
  background-color: #2a6bd1;
}

.icon-message {
  margin-right: 6px;
  font-size: 16px;
}
</style>