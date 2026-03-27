<template>
  <div class="ai-page-container">
    <div class="header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <h1>AI 编程助手</h1>
    </div>
    
    <div v-if="!isAuthenticated" class="auth-required">
      <p>请先登录以使用AI助手功能。</p>
      <button @click="goToLogin">去登录</button>
    </div>
    
    <div v-else class="ai-content">
      <div class="tabs">
        <button 
          :class="{ active: activeTab === 'chat' }"
          @click="activeTab = 'chat'"
        >聊天</button>
        <button 
          :class="{ active: activeTab === 'code' }"
          @click="activeTab = 'code'"
        >代码助手</button>
      </div>
      
      <div v-if="activeTab === 'chat'" class="chat-section">
        <div class="messages">
          <div 
            v-for="(msg, index) in messages" 
            :key="index" 
            :class="['message', msg.role]"
          >
            {{ msg.content }}
          </div>
        </div>
        <div class="input-area">
          <input 
            v-model="userMessage" 
            @keyup.enter="sendMessage"
            placeholder="输入您的消息..."
            :disabled="isLoading"
          />
          <button @click="sendMessage" :disabled="isLoading">
            {{ isLoading ? '发送中...' : '发送' }}
          </button>
        </div>
      </div>
      
      <div v-else class="code-section">
        <select v-model="codeAction">
          <option value="explain">解释代码</option>
          <option value="generate">生成代码</option>
          <option value="debug">调试代码</option>
        </select>
        
        <div v-if="codeAction === 'explain' || codeAction === 'debug'">
          <textarea v-model="codeInput" placeholder="粘贴代码..."></textarea>
          <input v-if="codeAction === 'debug'" v-model="errorInput" placeholder="错误信息..." />
          <button @click="handleCodeAction" :disabled="isLoading">
            {{ isLoading ? '处理中...' : (codeAction === 'explain' ? '解释代码' : '调试代码') }}
          </button>
        </div>
        
        <div v-else>
          <select v-model="selectedLanguage">
            <option value="Python">Python</option>
            <option value="JavaScript">JavaScript</option>
            <option value="Java">Java</option>
            <option value="C++">C++</option>
            <option value="TypeScript">TypeScript</option>
          </select>
          <textarea v-model="descriptionInput" placeholder="描述您想要的功能..."></textarea>
          <button @click="handleCodeAction" :disabled="isLoading">
            {{ isLoading ? '生成中...' : '生成代码' }}
          </button>
        </div>
        
        <div v-if="codeResult" class="result">
          <h3>结果:</h3>
          <pre>{{ codeResult }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()
const activeTab = ref('chat')
const isAuthenticated = ref(false)
const isLoading = ref(false)

// 聊天相关
const messages = ref([
  { role: 'assistant', content: '您好！我是AI编程助手，请问有什么可以帮助您的？' }
])
const userMessage = ref('')

// 代码助手相关
const codeAction = ref('explain')
const codeInput = ref('')
const errorInput = ref('')
const descriptionInput = ref('')
const selectedLanguage = ref('Python')
const codeResult = ref('')

// 认证检查
const checkAuth = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('jwt_token')
  isAuthenticated.value = !!token
  return isAuthenticated.value
}

// 页面加载
onMounted(() => {
  checkAuth()
})

// 导航方法
const goBack = () => router.push('/main')
const goToLogin = () => {
  sessionStorage.setItem('redirectAfterLogin', router.currentRoute.value.fullPath)
  router.push('/login')
}

// 发送消息
const sendMessage = async () => {
  if (!userMessage.value.trim() || isLoading.value) return
  
  // 添加用户消息
  messages.value.push({ role: 'user', content: userMessage.value })
  const currentMessage = userMessage.value
  userMessage.value = ''
  isLoading.value = true
  
  try {
    const response = await request.post('/api/ai/chat/', {
      message: currentMessage,
      temperature: 0.7,
      max_tokens: 2000
    })
    
    messages.value.push({
      role: 'assistant',
      content: response.data.response || response.data.message || '抱歉，我没有理解您的问题。'
    })
  } catch (error) {
    console.error('Error:', error)
    messages.value.push({
      role: 'assistant',
      content: '抱歉，发生错误无法获取回复。'
    })
  } finally {
    isLoading.value = false
  }
}

// 处理代码助手请求
const handleCodeAction = async () => {
  if (isLoading.value) return
  
  let requestBody = {}
  
  if (codeAction.value === 'explain') {
    if (!codeInput.value.trim()) return
    requestBody = {
      action: 'explain',
      code: codeInput.value,
      language: selectedLanguage.value
    }
  } else if (codeAction.value === 'generate') {
    if (!descriptionInput.value.trim()) return
    requestBody = {
      action: 'generate',
      problem_description: descriptionInput.value,
      language: selectedLanguage.value
    }
  } else if (codeAction.value === 'debug') {
    if (!codeInput.value.trim() || !errorInput.value.trim()) return
    requestBody = {
      action: 'debug',
      code: codeInput.value,
      error_message: errorInput.value
    }
  }
  
  isLoading.value = true
  codeResult.value = ''
  
  try {
    const response = await request.post('/api/ai/code-help/', requestBody)
    codeResult.value = response.data.result || response.data.response || '没有返回结果'
  } catch (error) {
    console.error('Error:', error)
    codeResult.value = '处理请求时发生错误。'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.ai-page-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  background: #606266;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.back-btn:hover {
  background: #4a4c4f;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tabs button {
  padding: 8px 16px;
  background: #e0e0e0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.tabs button.active {
  background: #409eff;
  color: white;
}

.chat-section, .code-section {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
}

.messages {
  height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
  padding: 8px;
  background: #f9f9f9;
}

.message {
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  max-width: 80%;
}

.message.user {
  background: #e3f2fd;
  margin-left: auto;
  text-align: right;
}

.message.assistant {
  background: #f5f5f5;
  margin-right: auto;
}

.input-area {
  display: flex;
  gap: 8px;
}

.input-area input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.input-area button {
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.input-area button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.code-section select, 
.code-section textarea, 
.code-section input {
  width: 100%;
  margin-bottom: 12px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.code-section textarea {
  min-height: 100px;
  resize: vertical;
}

.result {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.result pre {
  white-space: pre-wrap;
  overflow-x: auto;
}

.auth-required {
  text-align: center;
  padding: 40px 20px;
}

.auth-required button {
  margin-top: 16px;
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>