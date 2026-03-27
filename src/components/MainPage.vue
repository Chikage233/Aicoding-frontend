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
        <span class="difficulty-easy">简单 {{ easyCount }}</span>
      </div>
      <div class="status-item">
        <span class="difficulty-medium">中等 {{ mediumCount }}</span>
      </div>
      <div class="status-item">
        <span class="difficulty-hard">困难 {{ hardCount }}</span>
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
      // 使用统一处理后的 is_done 字段
      return this.questions.filter(item => item.is_done === true).length;
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
        const token = localStorage.getItem('token') || 
                     localStorage.getItem('access_token') || 
                     localStorage.getItem('jwt_token');
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
        let allQuestions = [];
        let page = 1;
        const pageSize = 50; // 每页获取50道题目
        let hasMore = true;
        
        // 分页加载所有题目
        while (hasMore) {
          const response = await request.get('/api/leetcode/problems/', {
            params: {
              page: page,
              page_size: pageSize
            }
          });
          
          let currentBatch = [];
          if (Array.isArray(response.data)) {
            currentBatch = response.data;
            hasMore = currentBatch.length === pageSize;
          } else if (response.data && Array.isArray(response.data.problems)) {
            currentBatch = response.data.problems;
            hasMore = currentBatch.length === pageSize;
          } else if (response.data && Array.isArray(response.data.results)) {
            currentBatch = response.data.results;
            // 对于DRF分页，检查是否有下一页
            hasMore = !!response.data.next;
          } else if (response.data) {
            currentBatch = [response.data];
            hasMore = false;
          } else {
            hasMore = false;
          }
          
          allQuestions = allQuestions.concat(currentBatch);
          console.log(`第${page}页获取到${currentBatch.length}道题目，累计${allQuestions.length}道`);
          
          if (currentBatch.length < pageSize) {
            hasMore = false;
          }
          
          page++;
          
          // 安全限制：最多获取500道题目，避免无限循环
          if (allQuestions.length >= 500) {
            hasMore = false;
          }
        }
        
        this.questions = allQuestions;
        console.log('最终获取到题目总数:', this.questions.length);
        
        // 获取用户完成的题目ID集合
        const completedProblemIds = await this.fetchUserCompletedProblems();
        
        // 确保难度字段格式正确并更新完成状态
        this.questions.forEach(question => {
          if (question.difficulty === 'easy' || question.difficulty === 1) {
            question.difficulty = '简单';
          } else if (question.difficulty === 'medium' || question.difficulty === 2) {
            question.difficulty = '中等';
          } else if (question.difficulty === 'hard' || question.difficulty === 3) {
            question.difficulty = '困难';
          }
          
          // 根据用户完成的题目ID集合设置完成状态
          question.is_done = completedProblemIds.has(Number(question.problem_id));
        });
        
        console.log('题目列表处理完成，已做题数:', this.doneCount);
      } catch (error) {
        console.error('获取题目列表失败:', error);
        this.questions = [];
      } finally {
        this.loading = false;
      }
    },
    
    // 获取用户完成的题目ID集合
    async fetchUserCompletedProblems() {
      try {
        // 使用 completions 接口获取完成的题目ID列表
        // 根据项目规范，使用 /api/ 前缀
        const response = await request.get('/api/user/completions/');
        console.log('completions 接口返回:', response.data);
        
        const completedProblems = new Set();
        const completions = response.data || response;
        if (Array.isArray(completions)) {
          completions.forEach(completion => {
            if (completion.problem_id) {
              completedProblems.add(Number(completion.problem_id));
            }
          });
        }
        
        console.log('解析到的已完成题目ID集合:', completedProblems);
        return completedProblems;
        
      } catch (error) {
        console.warn('获取用户完成题目失败，使用空集合:', error);
        // 如果 completions 接口失败，尝试从用户信息接口获取统计（但无法获取具体题目ID）
        try {
          const userResponse = await request.get('/api/auth/jwt/me/');
          console.log('用户信息接口返回（备用方案）:', userResponse.data);
          // 这里只能获取统计数字，无法知道具体哪些题目完成
          // 所以还是返回空集合，依赖后端题目列表接口返回正确的 is_done 状态
        } catch (userError) {
          console.warn('用户信息接口也失败:', userError);
        }
        return new Set();
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
        // 即使登出API失败，也要清除本地存储并跳转到登录页
        console.warn('登出API调用失败，但已清除本地数据:', e);
      }
      // 清除所有用户相关的本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('access_token'); // 添加这个以确保完全清除
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('is_admin');
      localStorage.removeItem('user_info');
      this.$router.push('/login');
    }
  },
  mounted() {
    this.fetchUserInfo();
    this.fetchQuestions();
    
    // 注册全局回调函数，当题目完成时刷新数据
    window.problemCompletedCallback = async (data) => {
      console.log('收到题目完成通知:', data);
      // 重新获取题目列表以更新统计数据
      await this.fetchQuestions();
      
      // 同时获取最新的用户信息和统计
      try {
        const userResponse = await request.get('/api/auth/jwt/me/');
        console.log('主页面获取到最新用户统计:', userResponse.data);
        // 如果需要更新用户显示信息，可以在这里处理
      } catch (error) {
        console.warn('获取用户统计失败:', error);
      }
    };
  },
  
  beforeDestroy() {
    // 清理全局回调函数
    if (window.problemCompletedCallback) {
      delete window.problemCompletedCallback;
    }
  }
};
</script>

<style scoped>
.main-page {
  min-height: 100vh;
  /* 移除居中限制，占满整个屏幕宽度 */
  width: 100%;
  background: #fff; /* 设置为白色背景 */
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.navbar-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.system-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.ai-chat-button {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: background-color 0.3s;
  text-decoration: none;
}

.ai-chat-button:hover {
  background: #45a049;
}

.user-center {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-center:hover {
  background-color: #f5f5f5;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-size: 16px;
  color: #333;
}

.user-menu {
  position: absolute;
  top: 60px;
  right: 24px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  min-width: 120px;
}

.user-menu-item {
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
}

.user-menu-item:hover {
  background-color: #f0f0f0;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

.questions-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.questions-table th,
.questions-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.questions-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.problem-link {
  color: #1890ff;
  text-decoration: none;
}

.problem-link:hover {
  text-decoration: underline;
}

.difficulty-简单 {
  color: #52c41a;
}

.difficulty-中等 {
  color: #faad14;
}

.difficulty-困难 {
  color: #f5222d;
}

.status-bar {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  gap: 24px;
}

.status-item {
  display: flex;
  flex-direction: column;
}

.status-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.status-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.search-container {
  padding: 24px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.search-input {
  width: 300px;
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.filter-container {
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.filter-container label {
  font-size: 14px;
  color: #333;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar {
    padding: 0 16px;
  }
  
  .search-container {
    padding: 16px;
  }
  
  .search-input {
    width: 100%;
    max-width: 250px;
  }
  
  .filter-container {
    padding: 12px 16px;
    flex-wrap: wrap;
  }
  
  .status-bar {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .questions-table {
    font-size: 12px;
  }
  
  .questions-table th,
  .questions-table td {
    padding: 4px;
  }
  
  .pagination {
    padding: 16px;
  }
}

.icon-message {
  margin-right: 6px;
  font-size: 16px;
}
</style>