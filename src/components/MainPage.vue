    goProfile() {
      // 添加错误处理和调试信息
      try {
        this.$router.push('/profile').catch(err => {
          console.error('路由跳转失败:', err);
        });
        this.showUserMenu = false;
      } catch (error) {
        console.error('goProfile 方法执行出错:', error);
      }
    },

<template>
  <div class="main-page">
    <nav class="navbar">
      <div class="navbar-left">
        <span class="system-name">编程 AI 助教</span>
      </div>
      <div class="navbar-right">
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
    <div class="main-content">
      <h1>主页面</h1>
      <p>欢迎来到主页面！</p>
    </div>
  </div>
</template>

<script>
import request from '@/utils/request';
import { ElMessageBox } from 'element-plus';
export default {
  name: 'MainPage',
  data() {
    return {
      user: {
        username: '',
        avatar: '',
      },
      showUserMenu: false,
      searchQuery: '',
      showSuggestions: false,
      suggestions: [
        '课程：前端开发',
        '课程：Python基础',
        '题目：二分查找',
        '题目：排序算法',
        '知识点：Vue组件',
        '知识点：异步编程',
      ],
    };
  },
  computed: {
    filteredSuggestions() {
      if (!this.searchQuery) return [];
      const q = this.searchQuery.toLowerCase();
      return this.suggestions.filter(item => item.toLowerCase().includes(q));
    },
  },
  methods: {
    async fetchUserInfo() {
      try {
        const res = await request.get('/auth/jwt/me/');
        console.log('用户信息接口返回：', res);
        // 假设返回 { username, avatar, ... }
        const userInfo = res.data && res.data.user ? res.data.user : {};
        this.user.username = userInfo.username || '未登录';
        this.user.avatar = userInfo.avatar || 'https://i.pravatar.cc/40?img=3';
      } catch (e) {
        this.user.username = '未登录';
        this.user.avatar = 'https://i.pravatar.cc/40?img=3';
      }
    },
    goProfile() {
      // 添加错误处理和调试信息
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
      this.showSuggestions = !!this.filteredSuggestions.length;
    },
    onSuggestionClick(item) {
      this.searchQuery = item;
      this.showSuggestions = false;
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
        // 用户取消
        return;
      }
      try {
        await request.post('/auth/jwt/logout/');
      } catch (e) {
        // 可忽略错误，保证本地登出
      }
      localStorage.removeItem('token');
      this.$router.push('/login');
    },
  },
  mounted() {
    // 页面加载时获取用户信息
    this.fetchUserInfo();
  },
};
</script>

<style scoped>
/* 样式同之前，直接粘贴原有内容 */
.main-page {
  min-height: 100vh;
  min-width: 100vw;
  width: 100vw;
  height: 100vh;
  background: #fff;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.navbar {
  flex-shrink: 0;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 64px;
  background: #222;
  color: #fff;
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.navbar-left {
  display: flex;
  align-items: center;
}
.system-name {
  font-size: 22px;
  font-weight: bold;
  margin-right: 32px;
}
.nav-links {
  display: flex;
  gap: 20px;
}
.nav-link {
  color: #fff;
  text-decoration: none;
  font-size: 16px;
  transition: color 0.2s;
}
.nav-link:hover {
  color: #409eff;
}
.navbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.navbar-search {
  position: relative;
  width: 320px;
}
.search-input {
  width: 320px;
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  outline: none;
  font-size: 15px;
}
.suggestions-list {
  position: absolute;
  top: 38px;
  left: 0;
  width: 320px;
  background: #fff;
  color: #222;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 10;
  list-style: none;
  margin: 0;
  padding: 0;
}
.suggestions-list li {
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.suggestions-list li:hover {
  background: #f5f7fa;
}
.navbar-right {
  position: relative;
  display: flex;
  align-items: center;
}
.user-center {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #409eff;
}
.username {
  font-size: 16px;
}
.user-menu {
  position: absolute;
  top: 54px;
  right: 0;
  background: #fff;
  color: #222;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  min-width: 120px;
  z-index: 20;
}
.user-menu-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s;
}
.user-menu-item:hover {
  background: #f5f7fa;
}
.main-content {
  flex: 1 1 auto;
  width: 100vw;
  padding: 32px;
  box-sizing: border-box;
  background: #fff;
  overflow: auto;
}
</style>