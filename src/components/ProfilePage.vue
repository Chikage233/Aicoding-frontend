<template>
  <div class="profile-page">
    <nav class="navbar">
      <div class="navbar-left">
        <span class="system-name">编程 AI 助教</span>
      </div>
      <div class="navbar-right">
        <!-- 替换为返回按钮 -->
        <button @click="goBack" class="back-button">
          返回
        </button>
      </div>
    </nav>
    <div class="main-content">
      <h1>个人中心</h1>
      
      <div class="profile-container">
        <div class="profile-header">
          <div class="avatar-section">
            <img :src="user.avatar" alt="头像" class="avatar-large" />
          </div>
          
          <div class="user-info">
            <h2>{{ user.username || '暂无用户名' }}</h2>
            <p v-if="user.email"><strong>邮箱：</strong>{{ user.email }}</p>
            <p v-else-if="user.phone"><strong>手机：</strong>{{ user.phone }}</p>
            <p><strong>注册时间：</strong>{{ user.registerDate || '未知' }}</p>
            <p>{{ user.bio || '暂无个人简介' }}</p>
          </div>
        </div>
        
        <div class="profile-details">
          <div class="info-section">
            <h3>个人信息</h3>
            <div class="info-item">
              <div class="info-label">昵称:</div>
              <div class="info-value">{{ user.nickname || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">生日:</div>
              <div class="info-value">{{ user.birthday || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">性别:</div>
              <div class="info-value">{{ user.gender || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">个人简介:</div>
              <div class="info-value bio-display">{{ user.bio || '-' }}</div>
            </div>
          </div>
          
          <div class="security-section">
            <h3>账户安全</h3>
            <div class="info-item">
              <div class="info-label">注册邮箱:</div>
              <div class="info-value">{{ user.email || '未设置邮箱' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">手机号:</div>
              <div class="info-value">{{ user.phone || '未设置手机号' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">密码:</div>
              <div class="info-value">••••••••</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import request from '@/utils/request';

export default {
  name: 'ProfilePage',
  data() {
    return {
      user: {
        username: '',
        nickname: '',
        avatar: '',
        email: '',
        phone: '',
        bio: '',
        birthday: '',
        gender: '',
        registerDate: '',
      },
    };
  },
  methods: {
    async fetchUserInfo() {
      try {
        const res = await request.get('/api/auth/jwt/me/');
        console.log('用户信息接口返回：', res);
        const userInfo = res.data && res.data.user ? res.data.user : {};
        
        // 更新用户信息
        this.user = {
          username: userInfo.username || '未设置用户名',
          nickname: userInfo.nickname || userInfo.username || '-',
          avatar: userInfo.avatar || 'https://i.pravatar.cc/100?img=3',
          email: userInfo.email || '-',
          phone: userInfo.phone || '-',
          bio: userInfo.bio || '暂无个人简介',
          birthday: userInfo.birthday || '-',
          gender: userInfo.gender || '-',
          registerDate: userInfo.register_date || userInfo.created_at || '-',
        };
      } catch (e) {
        console.error('获取用户信息失败:', e);
        // 检查是否有token，如果没有则重定向到登录页面
        const token = localStorage.getItem('token') || 
                     localStorage.getItem('access_token') || 
                     localStorage.getItem('jwt_token');
        if(!token) {
          this.$router.push('/login');
        }
        // 设置默认值
        this.user = {
          username: '未登录',
          nickname: '-',
          avatar: 'https://i.pravatar.cc/100?img=3',
          email: '-',
          phone: '-',
          bio: '暂无个人简介',
          birthday: '-',
          gender: '-',
          registerDate: '-',
        };
      }
    },
    
    goBack() {
      this.$router.push('/main');
    },
  },
  mounted() {
    // 页面加载时获取用户信息
    this.fetchUserInfo();
  },
};
</script>

<style scoped>
/* 继承 MainPage.vue 的样式 */
.profile-page {
  min-height: 100vh;
  min-width: 100vw;
  width: 100vw;
  height: 100vh;
  background: #fff; /* 设置为白色背景 */
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
.navbar-right {
  position: relative;
  display: flex;
  align-items: center;
}
/* 新增返回按钮样式 */
.back-button {
  background-color: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  transition: color 0.2s;
}
.back-button:hover {
  color: #409eff;
}
.main-content {
  flex: 1 1 auto;
  width: 100vw;
  padding: 32px;
  box-sizing: border-box;
  background: #fff;
  overflow: auto;
}

.profile-container {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}

.profile-header {
  display: flex;
  align-items: center;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
  margin-bottom: 24px;
}

.avatar-section {
  margin-right: 24px;
}

.avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ddd;
}

.user-info h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.user-info p {
  margin: 4px 0;
  color: #606266;
  line-height: 1.6;
}

.profile-details {
  display: flex;
  gap: 40px;
}

.info-section, .security-section {
  flex: 1;
}

.info-section h3, .security-section h3 {
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
  color: #303133;
  font-size: 18px;
}

.info-item {
  display: flex;
  margin-bottom: 16px;
  padding: 8px 0;
}

.info-label {
  width: 100px;
  color: #909399;
  font-size: 14px;
  font-weight: 500;
}

.info-value {
  flex: 1;
  color: #303133;
  font-size: 14px;
  word-break: break-word;
}

.bio-display {
  min-height: 60px;
  line-height: 1.6;
}
</style>