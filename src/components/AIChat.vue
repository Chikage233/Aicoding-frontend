<template>
  <div class="ai-chat-container">
    <div class="chat-header">
      <h2>AI 助手</h2>
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
        const response = await fetch('http://127.0.0.1:8000/api/ai/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('jwt_token')}`
          },
          body: JSON.stringify({
            message: userMessage,
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          if(response.status === 401) {
            // Token无效或过期，重定向到登录页面
            localStorage.removeItem('token');
            localStorage.removeItem('jwt_token');
            // 将当前路径保存到sessionStorage，以便登录后重定向回来
            sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
            this.$router.push('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // 添加AI回复到对话
        this.messages.push({
          sender: 'ai',
          content: data.response || data.message || '抱歉，我没有理解您的问题。'
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

        const response = await fetch('http://127.0.0.1:8000/api/ai/code-help/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('jwt_token')}`
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          if(response.status === 401) {
            // Token无效或过期，重定向到登录页面
            localStorage.removeItem('token');
            localStorage.removeItem('jwt_token');
            // 将当前路径保存到sessionStorage，以便登录后重定向回来
            sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
            this.$router.push('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.codeResult = data.result || data.response || '没有返回结果';
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
  height: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  padding: 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.chat-header h2 {
  margin: 0 0 16px 0;
  font-size: 1.5rem;
}

.tabs {
  display: flex;
  gap: 8px;
}

.tabs button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background-color: #fff;
  cursor: pointer;
  border-radius: 4px;
}

.tabs button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.chat-mode, .code-mode {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 18px;
  line-height: 1.4;
}

.message.user {
  align-self: flex-end;
  background-color: #007bff;
  color: white;
}

.message.ai {
  align-self: flex-start;
  background-color: #e9ecef;
  color: #333;
}

.input-area {
  display: flex;
  padding: 16px;
  border-top: 1px solid #ddd;
  background-color: #f9f9f9;
}

.input-area textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: none;
  height: 60px;
  margin-right: 10px;
}

.input-area button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.input-area button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.code-tabs {
  display: flex;
  padding: 0 16px;
  border-bottom: 1px solid #ddd;
}

.code-tabs button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background-color: #fff;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  margin-bottom: -1px;
}

.code-tabs button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.code-action-section {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.code-action-section label {
  font-weight: bold;
}

.code-action-section textarea,
.code-action-section select,
.code-action-section input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.code-action-section textarea {
  min-height: 120px;
  resize: vertical;
}

.code-action-section input {
  height: 40px;
}

.code-action-section button {
  align-self: flex-start;
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.code-action-section button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.code-result {
  padding: 16px;
  margin: 16px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  overflow-x: auto;
}

.code-result label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
}

.loading {
  padding: 16px;
  text-align: center;
  color: #666;
  font-style: italic;
}
</style>