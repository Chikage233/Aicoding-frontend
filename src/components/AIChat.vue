<template>
  <div class="ai-chat-page">
    <header class="chat-header">
      <div class="header-left">
        <button type="button" class="back-button" @click="goBackToMain">返回主页</button>
        <div class="header-title">
          <p>学习陪练</p>
          <h2>AI 助手</h2>
        </div>
      </div>

      <div class="header-right">
        <span class="session-badge">实时辅导</span>
        <div class="tabs">
          <button :class="{ active: currentTab === 'chat' }" @click="switchTab('chat')">聊天</button>
          <button :class="{ active: currentTab === 'code' }" @click="switchTab('code')">代码助手</button>
        </div>
      </div>
    </header>

    <main class="chat-main" :class="{ 'code-mode': currentTab === 'code' }">
      <aside v-if="currentTab === 'chat'" class="helper-panel">
        <div class="helper-hero">
          <h3>先从这些问题开始</h3>
          <p>点击模板可快速提问，也可以直接输入你正在卡住的点。</p>
        </div>

        <div class="prompt-list">
          <button
            v-for="prompt in promptSuggestions"
            :key="prompt.label"
            type="button"
            class="prompt-btn"
            :disabled="isSending"
            @click="applyPrompt(prompt.text)"
          >
            {{ prompt.label }}
          </button>
        </div>

        <p class="helper-tip">快捷键：`Enter` 发送，`Shift + Enter` 换行</p>
        <button type="button" class="clear-chat-btn" :disabled="isSending" @click="resetConversation">
          清空对话
        </button>
      </aside>

      <section class="content-panel" :class="currentTab === 'chat' ? 'chat-panel' : 'code-panel'">
        <template v-if="currentTab === 'chat'">
          <div ref="messagesContainer" class="messages-container">
            <div v-for="(msg, index) in messages" :key="index" class="message-row" :class="msg.sender">
              <div class="message-avatar">{{ msg.sender === 'user' ? '你' : 'AI' }}</div>
              <div class="message-bubble">
                <p class="message-role">{{ msg.sender === 'user' ? '你' : 'AI 助手' }}</p>
                <div class="message-content">{{ msg.content }}</div>
              </div>
            </div>
          </div>

          <div class="input-area">
            <textarea
              ref="messageInput"
              v-model="inputMessage"
              class="message-input"
              placeholder="输入你的问题，例如：这道题我该如何拆解？"
              @keydown="onMessageKeydown"
            />
            <div class="input-footer">
              <span class="input-tip">支持多轮提问和连续追问</span>
              <button type="button" class="send-btn" :disabled="!canSendMessage" @click="sendMessage">
                {{ isSending ? '发送中...' : '发送' }}
              </button>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="code-tabs">
            <button :class="{ active: codeAction === 'explain' }" @click="setCodeAction('explain')">
              解释代码
            </button>
            <button :class="{ active: codeAction === 'generate' }" @click="setCodeAction('generate')">
              生成代码
            </button>
            <button :class="{ active: codeAction === 'debug' }" @click="setCodeAction('debug')">
              调试代码
            </button>
          </div>

          <div class="code-layout">
            <div class="code-form">
              <label>编程语言</label>
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

              <template v-if="codeAction !== 'generate'">
                <label>代码</label>
                <textarea
                  v-model="codeInput"
                  :placeholder="codeAction === 'explain' ? '粘贴你需要解释的代码...' : '粘贴出现错误的代码...'"
                ></textarea>
              </template>

              <template v-if="codeAction === 'generate'">
                <label>需求描述</label>
                <textarea
                  v-model="problemDescription"
                  placeholder="描述你希望生成的功能、输入输出和约束..."
                ></textarea>
              </template>

              <template v-if="codeAction === 'debug'">
                <label>错误信息</label>
                <input v-model="errorMessage" type="text" placeholder="请输入报错日志或异常信息..." />
              </template>

              <button
                type="button"
                class="submit-btn"
                :disabled="!canSendCodeRequest || isSending"
                @click="sendCodeRequest"
              >
                {{ isSending ? '处理中...' : codeActionButtonText }}
              </button>
            </div>

            <div class="code-result">
              <div class="result-header">结果</div>
              <pre v-if="codeResult">{{ codeResult }}</pre>
              <div v-else class="result-empty">提交后将在这里显示 AI 返回结果。</div>
            </div>
          </div>
        </template>
      </section>
    </main>

    <div v-if="isSending" class="floating-loading">AI 正在思考中...</div>
  </div>
</template>

<script>
import request from '@/utils/request'

const createWelcomeMessage = () => ({
  sender: 'ai',
  content: '您好！我是 AI 助手，可以帮您学习算法、分析代码与调试问题。'
})

export default {
  name: 'AIChat',
  data() {
    return {
      currentTab: 'chat',
      codeAction: 'explain',
      messages: [createWelcomeMessage()],
      inputMessage: '',
      isSending: false,
      codeInput: '',
      problemDescription: '',
      errorMessage: '',
      language: 'Python',
      codeResult: '',
      promptSuggestions: [
        { label: '题目思路怎么拆？', text: '请帮我把这道题的解题思路拆成步骤。' },
        { label: '复杂度分析', text: '请分析这段解法的时间复杂度和空间复杂度。' },
        { label: '给我测试用例', text: '请给我 5 个关键测试用例并解释覆盖点。' },
        { label: '优化建议', text: '请帮我找出这段代码的优化方向。' }
      ]
    }
  },
  computed: {
    canSendMessage() {
      return !this.isSending && String(this.inputMessage || '').trim().length > 0
    },
    canSendCodeRequest() {
      if (this.isSending) return false
      if (this.codeAction === 'generate') return String(this.problemDescription || '').trim().length > 0
      if (this.codeAction === 'debug') {
        return (
          String(this.codeInput || '').trim().length > 0 &&
          String(this.errorMessage || '').trim().length > 0
        )
      }
      return String(this.codeInput || '').trim().length > 0
    },
    codeActionButtonText() {
      if (this.codeAction === 'explain') return '解释代码'
      if (this.codeAction === 'generate') return '生成代码'
      return '调试代码'
    }
  },
  mounted() {
    if (!this.ensureAuthOrRedirect()) return
    this.scrollMessagesToBottom()
  },
  methods: {
    checkAuth() {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('jwt_token')
      return !!token
    },

    ensureAuthOrRedirect() {
      if (this.checkAuth()) return true
      sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath)
      this.$router.push('/login')
      return false
    },

    goBackToMain() {
      this.$router.push('/main')
    },

    switchTab(tab) {
      if (!this.ensureAuthOrRedirect()) return
      this.currentTab = tab
      if (tab === 'chat') this.scrollMessagesToBottom()
    },

    setCodeAction(action) {
      if (!this.ensureAuthOrRedirect()) return
      this.codeAction = action
    },

    applyPrompt(text) {
      if (!this.ensureAuthOrRedirect()) return
      this.inputMessage = String(text || '')
      this.focusMessageInput()
    },

    focusMessageInput() {
      this.$nextTick(() => {
        if (this.$refs.messageInput) this.$refs.messageInput.focus()
      })
    },

    onMessageKeydown(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        this.sendMessage()
      }
    },

    scrollMessagesToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer
        if (!container) return
        container.scrollTop = container.scrollHeight
      })
    },

    unwrapData(payload, depth = 0) {
      if (depth > 6 || payload == null) return payload
      if (Array.isArray(payload)) return payload
      if (typeof payload !== 'object') return payload
      if (Object.prototype.hasOwnProperty.call(payload, 'data')) {
        const next = payload.data
        if (next !== undefined) return this.unwrapData(next, depth + 1)
      }
      return payload
    },

    pickText(candidates = [], fallback = '') {
      for (const candidate of candidates) {
        if (candidate === undefined || candidate === null) continue
        if (typeof candidate === 'string') {
          const text = candidate.trim()
          if (text) return text
          continue
        }
        if (typeof candidate === 'number' || typeof candidate === 'boolean') {
          return String(candidate)
        }
      }
      return fallback
    },

    extractChatResponseText(response) {
      const root = response || {}
      const unwrapped = this.unwrapData(root)
      return this.pickText(
        [
          unwrapped?.response,
          unwrapped?.message,
          unwrapped?.result,
          root?.response,
          root?.message,
          root?.result
        ],
        '抱歉，我暂时无法回答该问题。'
      )
    },

    extractCodeResult(response) {
      const root = response || {}
      const unwrapped = this.unwrapData(root)
      return this.pickText(
        [unwrapped?.result, unwrapped?.response, unwrapped?.message, root?.result, root?.response],
        '没有返回结果'
      )
    },

    resetConversation() {
      this.messages = [createWelcomeMessage()]
      this.inputMessage = ''
      this.scrollMessagesToBottom()
    },

    async sendMessage() {
      if (!this.ensureAuthOrRedirect()) return
      if (!this.canSendMessage) return

      const userMessage = String(this.inputMessage || '').trim()
      this.messages.push({ sender: 'user', content: userMessage })
      this.inputMessage = ''
      this.isSending = true
      this.scrollMessagesToBottom()

      try {
        const response = await request.post('/api/ai/chat/', {
          message: userMessage,
          temperature: 0.7,
          max_tokens: 2000
        })

        this.messages.push({
          sender: 'ai',
          content: this.extractChatResponseText(response)
        })
      } catch (error) {
        console.error('Error sending message:', error)
        this.messages.push({
          sender: 'ai',
          content: '抱歉，发生了一个错误，暂时无法获取 AI 回复。'
        })
      } finally {
        this.isSending = false
        this.scrollMessagesToBottom()
      }
    },

    buildCodeRequestBody() {
      if (this.codeAction === 'explain') {
        return {
          action: 'explain',
          code: this.codeInput,
          language: this.language
        }
      }
      if (this.codeAction === 'generate') {
        return {
          action: 'generate',
          problem_description: this.problemDescription,
          language: this.language
        }
      }
      return {
        action: 'debug',
        code: this.codeInput,
        error_message: this.errorMessage
      }
    },

    async sendCodeRequest() {
      if (!this.ensureAuthOrRedirect()) return
      if (!this.canSendCodeRequest) return

      this.isSending = true
      this.codeResult = ''

      try {
        const response = await request.post('/api/ai/code-help/', this.buildCodeRequestBody())
        this.codeResult = this.extractCodeResult(response)
      } catch (error) {
        console.error('Error sending code request:', error)
        this.codeResult = '抱歉，发生了一个错误，无法处理当前请求。'
      } finally {
        this.isSending = false
      }
    }
  }
}
</script>

<style scoped>
.ai-chat-page {
  --bg-base: #f2eee6;
  --card: #fffdfa;
  --card-soft: #f8f3eb;
  --line: #ddd3c4;
  --line-soft: #e8dfd2;
  --text-strong: #2f3b34;
  --text-main: #4b564b;
  --text-muted: #778278;
  --accent: #648573;
  --accent-deep: #4e6d5c;
  --accent-soft: #e8f1ea;

  min-height: 100vh;
  background:
    radial-gradient(circle at 10% 0%, #e4efe3 0, transparent 35%),
    radial-gradient(circle at 92% 12%, #f1e5d8 0, transparent 30%),
    linear-gradient(180deg, #f8f4ee 0%, var(--bg-base) 56%);
  color: var(--text-main);
  font-family: 'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei UI', sans-serif;
}

.chat-header {
  position: sticky;
  top: 0;
  z-index: 10;
  min-height: 78px;
  padding: 12px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: rgba(255, 253, 249, 0.9);
  border-bottom: 1px solid var(--line-soft);
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-button {
  border: 1px solid #cfdccc;
  background: var(--accent-soft);
  color: var(--accent-deep);
  height: 38px;
  border-radius: 999px;
  padding: 0 14px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #dfece1;
  border-color: #bccdbb;
}

.header-title p {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.header-title h2 {
  margin: 2px 0 0;
  font-size: 24px;
  color: var(--text-strong);
}

.session-badge {
  height: 28px;
  border-radius: 999px;
  border: 1px solid #d8c5ad;
  background: #f7ead9;
  color: #8f6a44;
  font-size: 12px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.tabs {
  display: inline-flex;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid var(--line-soft);
  background: var(--card-soft);
  gap: 4px;
}

.tabs button {
  border: none;
  border-radius: 999px;
  height: 34px;
  padding: 0 14px;
  font-size: 13px;
  background: transparent;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tabs button.active {
  background: linear-gradient(120deg, var(--accent-deep), var(--accent));
  color: #fff;
  box-shadow: 0 8px 18px rgba(74, 93, 74, 0.2);
}

.chat-main {
  max-width: 1360px;
  margin: 0 auto;
  min-height: calc(100vh - 78px);
  padding: 16px;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
}

.chat-main.code-mode {
  grid-template-columns: minmax(0, 1fr);
}

.helper-panel {
  background: var(--card);
  border: 1px solid var(--line-soft);
  border-radius: 20px;
  box-shadow: 0 12px 26px rgba(64, 55, 42, 0.08);
  padding: 14px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.helper-hero {
  border: 1px solid #dbe7db;
  background: linear-gradient(140deg, #f2f8f1, #f7efe4);
  border-radius: 14px;
  padding: 12px;
}

.helper-hero h3 {
  margin: 0;
  color: var(--text-strong);
  font-size: 16px;
}

.helper-hero p {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-main);
}

.prompt-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prompt-btn {
  position: relative;
  border: 1px solid var(--line);
  background: #fffcf8;
  color: var(--text-main);
  border-radius: 12px;
  padding: 10px 12px 10px 24px;
  font-size: 13px;
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;
}

.prompt-btn::before {
  content: '';
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  left: 10px;
  top: 16px;
  background: #c9b08b;
}

.prompt-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #f4efe6;
  border-color: #d6c8b4;
}

.prompt-btn:disabled {
  opacity: 0.68;
  cursor: not-allowed;
}

.helper-tip {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.clear-chat-btn {
  margin-top: auto;
  border: 1px solid var(--line);
  background: #f2ede4;
  color: #596858;
  height: 36px;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-chat-btn:hover:not(:disabled) {
  background: #ebe4d8;
}

.clear-chat-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.content-panel {
  background: var(--card);
  border: 1px solid var(--line-soft);
  border-radius: 20px;
  box-shadow: 0 12px 26px rgba(64, 55, 42, 0.08);
  min-height: 0;
  overflow: hidden;
}

.chat-panel {
  display: flex;
  flex-direction: column;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 8px;
  background:
    radial-gradient(circle at 8% 4%, rgba(154, 177, 153, 0.15), transparent 34%),
    linear-gradient(180deg, #fffdfa, #fbf8f3);
}

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}

.message-row.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e7ded0;
  color: #856642;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d9c8b1;
}

.message-row.user .message-avatar {
  background: #e4f0e5;
  border-color: #c6d8c8;
  color: #4e6d5c;
}

.message-bubble {
  max-width: min(78%, 760px);
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid var(--line-soft);
  background: var(--card-soft);
}

.message-row.user .message-bubble {
  background: #edf4ec;
  border-color: #d4e0d1;
}

.message-role {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}

.message-content {
  font-size: 14px;
  line-height: 1.62;
  word-break: break-word;
  white-space: pre-wrap;
}

.input-area {
  border-top: 1px solid var(--line-soft);
  padding: 12px;
  background: linear-gradient(180deg, #fdfbf7, #f8f2e9);
}

.message-input {
  width: 100%;
  box-sizing: border-box;
  min-height: 76px;
  max-height: 220px;
  resize: vertical;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--text-main);
  background: #fffcf8;
  outline: none;
}

.message-input:focus {
  border-color: #9aad98;
  box-shadow: 0 0 0 3px rgba(143, 163, 140, 0.22);
}

.input-footer {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.input-tip {
  font-size: 12px;
  color: var(--text-muted);
}

.send-btn,
.submit-btn {
  border: none;
  min-height: 36px;
  border-radius: 999px;
  padding: 0 16px;
  font-size: 13px;
  cursor: pointer;
  background: linear-gradient(120deg, var(--accent-deep), var(--accent));
  color: #fff;
  box-shadow: 0 8px 18px rgba(74, 93, 74, 0.2);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.send-btn:hover:not(:disabled),
.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.send-btn:disabled,
.submit-btn:disabled {
  opacity: 0.72;
  cursor: not-allowed;
  box-shadow: none;
}

.code-panel {
  padding: 14px;
  overflow: auto;
}

.code-tabs {
  display: inline-flex;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid var(--line-soft);
  background: var(--card-soft);
  gap: 4px;
  margin-bottom: 14px;
}

.code-tabs button {
  border: none;
  border-radius: 999px;
  height: 32px;
  padding: 0 14px;
  font-size: 13px;
  background: transparent;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s ease;
}

.code-tabs button.active {
  background: linear-gradient(120deg, var(--accent-deep), var(--accent));
  color: #fff;
  box-shadow: 0 8px 18px rgba(74, 93, 74, 0.2);
}

.code-layout {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 14px;
}

.code-form,
.code-result {
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  background: #fbf7f1;
}

.code-form {
  padding: 12px;
}

.code-form label {
  display: block;
  margin: 10px 0 6px;
  color: var(--text-main);
  font-size: 13px;
  font-weight: 600;
}

.code-form select,
.code-form textarea,
.code-form input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: #fffcf8;
  color: var(--text-main);
  font-size: 14px;
  outline: none;
}

.code-form textarea {
  min-height: 120px;
  resize: vertical;
}

.code-form select:focus,
.code-form textarea:focus,
.code-form input:focus {
  border-color: #9aad98;
  box-shadow: 0 0 0 3px rgba(143, 163, 140, 0.22);
}

.submit-btn {
  margin-top: 12px;
}

.code-result {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.result-header {
  height: 38px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 13px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--line-soft);
  background: var(--card-soft);
}

.code-result pre {
  margin: 0;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-main);
  max-height: 420px;
  overflow: auto;
}

.result-empty {
  padding: 16px 12px;
  font-size: 13px;
  color: var(--text-muted);
}

.floating-loading {
  position: fixed;
  right: 16px;
  bottom: 16px;
  background: rgba(47, 58, 50, 0.92);
  color: #fff;
  font-size: 13px;
  padding: 9px 13px;
  border-radius: 999px;
  box-shadow: 0 10px 22px rgba(30, 38, 30, 0.26);
}

@media (max-width: 1200px) {
  .code-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .chat-main {
    grid-template-columns: 1fr;
  }

  .helper-panel {
    order: 2;
  }

  .chat-main.code-mode {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .chat-header {
    padding: 12px;
    flex-direction: column;
    align-items: stretch;
  }

  .header-left,
  .header-right {
    justify-content: space-between;
  }

  .header-title h2 {
    font-size: 21px;
  }

  .session-badge {
    display: none;
  }

  .chat-main {
    padding: 10px;
  }

  .message-bubble {
    max-width: 90%;
  }

  .input-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .send-btn,
  .submit-btn,
  .clear-chat-btn {
    width: 100%;
  }
}
</style>
