<template>
  <div class="ai-chat-container">
    <div class="chat-header">
      <div class="header-left">
        <button class="back-button" @click="goBackToMain">
          ← 返回主页面
        </button>
        <h2>AI 助手</h2>
      </div>
      <div class="tabs">
        <button 
          :class="{ active: currentTab === 'chat' }" 
          @click="switchTab('chat')"
        >
          聊天
        </button>
        <button 
          :class="{ active: currentTab === 'code' }" 
          @click="switchTab('code')"
        >
          代码助手
        </button>
      </div>
    </div>

    <!-- 聊天模式 -->
    <div v-if="currentTab === 'chat'" class="chat-mode">
      <div class="messages-container">
        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          :class="['message', msg.sender]"
        >
          <div class="message-content">{{ msg.content }}</div>
        </div>
      </div>
      
      <div class="input-area">
        <textarea
          v-model="inputMessage"
          placeholder="输入您的消息..."
          @keydown.enter.exact.prevent="sendMessage"
        />
        <button @click="sendMessage" :disabled="isSending">发送</button>
      </div>
    </div>

    <!-- 代码助手模式 -->
    <div v-if="currentTab === 'code'" class="code-mode">
      <div class="code-tabs">
        <button 
          :class="{ active: codeAction === 'explain' }" 
          @click="setCodeAction('explain')"
        >
          解释代码
        </button>
        <button 
          :class="{ active: codeAction === 'generate' }" 
          @click="setCodeAction('generate')"
        >
          生成代码
        </button>
        <button 
          :class="{ active: codeAction === 'debug' }" 
          @click="setCodeAction('debug')"
        >
          调试代码
        </button>
      </div>

      <!-- 代码解释 -->
      <div v-if="codeAction === 'explain'" class="code-action-section">
        <label>编程语言:</label>
        <select v-model="language">
          <option value="JavaScript">JavaScript</option>
          <option value="Python">Python</option>
          <option value="Java">Java</option>
          <option value="C++">C++</option>
          <option value="C#">C#</option>
          <option value="Go">Go</option>
          <option value="Rust">Rust</option>
          <option value="TypeScript">TypeScript</option>
        </select>
        
        <label>代码:</label>
        <textarea 
          v-model="codeInput" 
          placeholder="粘贴您需要解释的代码..."
        ></textarea>
        
        <button @click="sendCodeRequest" :disabled="isSending">解释代码</button>
      </div>

      <!-- 代码生成 -->
      <div v-if="codeAction === 'generate'" class="code-action-section">
        <label>编程语言:</label>
        <select v-model="language">
          <option value="JavaScript">JavaScript</option>
          <option value="Python">Python</option>
          <option value="Java">Java</option>
          <option value="C++">C++</option>
          <option value="C#">C#</option>
          <option value="Go">Go</option>
          <option value="Rust">Rust</option>
          <option value="TypeScript">TypeScript</option>
        </select>
        
        <label>问题描述:</label>
        <textarea 
          v-model="problemDescription" 
          placeholder="描述您想要生成的代码功能..."
        ></textarea>
        
        <button @click="sendCodeRequest" :disabled="isSending">生成代码</button>
      </div>

      <!-- 代码调试 -->
      <div v-if="codeAction === 'debug'" class="code-action-section">
        <label>出错的代码:</label>
        <textarea 
          v-model="codeInput" 
          placeholder="粘贴出现错误的代码..."
        ></textarea>
        
        <label>错误信息:</label>
        <input 
          v-model="errorMessage" 
          type="text" 
          placeholder="请输入错误信息..."
        />
        
        <button @click="sendCodeRequest" :disabled="isSending">调试代码</button>
      </div>

      <div class="code-result" v-if="codeResult">
        <label>结果:</label>
        <pre>{{ codeResult }}</pre>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isSending" class="loading">
      AI 正在思考中...
    </div>
  </div>
</template>

<script>
import request from '@/utils/request';

export default {
  name: 'AIChat',
  data() {
    return {
      currentTab: 'chat',
      codeAction: 'explain',
      messages: [
        { sender: 'ai', content: '您好！我是AI助手，可以帮您解答问题或处理代码相关任务。' }
      ],
      inputMessage: '',
      isSending: false,
      codeInput: '',
      problemDescription: '',
      errorMessage: '',
      language: 'Python',
      codeResult: ''
    }
  },
  mounted() {
    // 页面加载时检查用户是否已登录
    if (!this.checkAuth()) {
      // 将当前路径保存到sessionStorage，以便登录后重定向回来
      sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
      this.$router.push('/login');
    }
  },
  methods: {
    checkAuth() {
      // 检查localStorage中是否存在token
      const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
      return !!token; // 返回布尔值，如果token存在则返回true，否则返回false
    },
    
    goBackToMain() {
      this.$router.push('/main');
    },
    
    switchTab(tab) {
      // 切换标签页前检查认证状态
      if (!this.checkAuth()) {
        // 将当前路径保存到sessionStorage，以便登录后重定向回来
        sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
        this.$router.push('/login');
        return;
      }
      this.currentTab = tab;
    },
    
    setCodeAction(action) {
      // 设置代码操作前检查认证状态
      if (!this.checkAuth()) {
        // 将当前路径保存到sessionStorage，以便登录后重定向回来
        sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
        this.$router.push('/login');
        return;
      }
      this.codeAction = action;
    },
    
    async sendMessage() {
      // 发送消息前检查认证状态
      if (!this.checkAuth()) {
        // 将当前路径保存到sessionStorage，以便登录后重定向回来
        sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
        this.$router.push('/login');
        return;
      }
      
      if (!this.inputMessage.trim()) return;

      // 添加用户消息到对话
      this.messages.push({
        sender: 'user',
        content: this.inputMessage
      });

      const userMessage = this.inputMessage;
      this.inputMessage = '';
      this.isSending = true;

      try {
        const response = await request.post('/api/ai/chat/', {
          message: userMessage,
          temperature: 0.7,
          max_tokens: 2000
        });

        // 添加AI回复到对话
        this.messages.push({
          sender: 'ai',
          content: response.data.response || response.data.message || '抱歉，我没有理解您的问题。'
        });
      } catch (error) {
        console.error('Error sending message:', error);
        this.messages.push({
          sender: 'ai',
          content: '抱歉，发生了一个错误，无法获取AI回复。'
        });
      } finally {
        this.isSending = false;
      }
    },

    async sendCodeRequest() {
      // 发送代码请求前检查认证状态
      if (!this.checkAuth()) {
        // 将当前路径保存到sessionStorage，以便登录后重定向回来
        sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
        this.$router.push('/login');
        return;
      }
      
      if ((this.codeAction !== 'generate' && !this.codeInput.trim()) ||
          (this.codeAction === 'generate' && !this.problemDescription.trim()) ||
          (this.codeAction === 'debug' && !this.errorMessage.trim())) {
        return;
      }

      this.isSending = true;
      this.codeResult = '';

      try {
        let requestBody = {};

        if (this.codeAction === 'explain') {
          requestBody = {
            action: 'explain',
            code: this.codeInput,
            language: this.language
          };
        } else if (this.codeAction === 'generate') {
          requestBody = {
            action: 'generate',
            problem_description: this.problemDescription,
            language: this.language
          };
        } else if (this.codeAction === 'debug') {
          requestBody = {
            action: 'debug',
            code: this.codeInput,
            error_message: this.errorMessage
          };
        }

        const response = await request.post('/api/ai/code-help/', requestBody);

        this.codeResult = response.data.result || response.data.response || '没有返回结果';
      } catch (error) {
        console.error('Error sending code request:', error);
        this.codeResult = '抱歉，发生了一个错误，无法处理您的请求。';
      } finally {
        this.isSending = false;
      }
    }
  }
}
</script>

<style scoped>
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  background-color: #606266;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.back-button:hover {
  background-color: #4a4c4f;
}

.chat-header h2 {
  margin: 0;
  color: #333;
}

.tabs {
  display: flex;
  gap: 8px;
}

.tabs button {
  background-color: #e0e0e0;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.tabs button.active {
  background-color: #409eff;
  color: white;
}

.chat-mode, .code-mode {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
  background: #fafafa;
}

.message {
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 8px;
  max-width: 80%;
}

.message.user {
  background-color: #e3f2fd;
  margin-left: auto;
  text-align: right;
}

.message.ai {
  background-color: #f5f5f5;
  margin-right: auto;
  text-align: left;
}

.message-content {
  word-break: break-word;
}

.input-area {
  display: flex;
  gap: 12px;
}

.input-area textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  min-height: 48px;
}

.input-area button {
  padding: 12px 24px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.input-area button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.code-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.code-tabs button {
  background-color: #e0e0e0;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.code-tabs button.active {
  background-color: #409eff;
  color: white;
}

.code-action-section {
  margin-bottom: 24px;
}

.code-action-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.code-action-section select,
.code-action-section textarea,
.code-action-section input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
}

.code-action-section textarea {
  min-height: 120px;
  resize: vertical;
}

.code-action-section button {
  padding: 12px 24px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.code-action-section button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.code-result {
  margin-top: 24px;
}

.code-result label {
  font-weight: bold;
  display: block;
  margin-bottom: 12px;
  color: #333;
}

.code-result pre {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  border: 1px solid #e0e0e0;
}

.loading {
  text-align: center;
  padding: 24px;
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .ai-chat-container {
    padding: 0;
  }
  
  .chat-header {
    padding: 12px 16px;
  }
  
  .chat-mode, .code-mode {
    padding: 16px;
  }
  
  .message {
    max-width: 90%;
  }
  
  .input-area {
    flex-direction: column;
  }
  
  .input-area button {
    align-self: flex-end;
    width: 100px;
  }
}
</style>