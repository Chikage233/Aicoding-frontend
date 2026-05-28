<template>
  <div class="problem-detail">
    <div class="left-side">
      <!-- 导航栏 -->
      <div class="problem-navigation">
        <div class="problem-navigation-left">
          <button class="nav-button back-button" @click="goBackToMain">
            返回题库
          </button>
          <div class="nav-meta">
            <span class="nav-progress">进度 {{ problemProgressText }}</span>
            <span class="nav-status" :class="currentProblemDone ? 'is-done' : 'is-todo'">
              {{ currentProblemDone ? '已完成' : '进行中' }}
            </span>
            <span class="nav-shortcut">Alt + ← / → 切题</span>
          </div>
        </div>
        <div class="nav-buttons">
          <button 
            class="nav-button prev-button" 
            @click="goToPreviousProblem"
            :disabled="isFirstProblem"
          >
            上一题
          </button>
          <button 
            class="nav-button next-button" 
            @click="goToNextProblem"
            :disabled="isLastProblem"
          >
            下一题
          </button>
        </div>
      </div>
      
      <!-- 题目内容区域 -->
      <div class="problem-content-wrapper">
        <div v-if="isProblemLoading" class="problem-loading-card">
          <h3>正在加载题目...</h3>
          <p>请稍候，题目内容马上就好。</p>
        </div>
        <div v-else-if="problemLoadError" class="problem-error-card">
          <h3>题目加载失败</h3>
          <p>{{ problemLoadError }}</p>
          <button class="retry-btn" @click="retryLoadProblem">重新加载</button>
        </div>
        <div v-else class="problem-content-card">
          <div class="problem-title-row">
            <h1 class="problem-title">{{ problem.problem_id ? problem.problem_id + '. ' : '' }}{{ problem.title }}</h1>
            <button class="inline-ai-btn" @click="openAIPanelTo('chat')">问 AI</button>
          </div>
          <div class="problem-info">
            <span :class="'difficulty-' + getDifficultyText(problem.difficulty)">{{ getDifficultyText(problem.difficulty) || '未知' }}</span>
            <span v-if="problem.title_slug" class="problem-slug">Slug: {{ problem.title_slug }}</span>
            <div v-if="problem.tags && problem.tags.length" class="problem-tags-inline">
              <span
                v-for="tag in problem.tags"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          <div class="problem-content" v-html="problem.content"></div>
        </div>
      </div>
    </div>
    <div class="right-side">
      <!-- 代码编辑器 -->
      <CodeEditor :problem-id="problemId" ref="codeEditorRef" />
    </div>
    
    <!-- AI助手可折叠面板 -->
    <div class="ai-panel-container">
      <div class="ai-panel" :style="{width: aiPanelOpen ? '400px' : '0px', transition: '0.3s'}">
        <div v-if="aiPanelOpen" class="ai-panel-content">
          <div class="ai-panel-header">
            <h3>AI 助手</h3>
            <button class="close-btn" @click="toggleAIPanel">×</button>
          </div>
          
          <div class="ai-tabs">
            <button 
              :class="{ active: aiCurrentTab === 'chat' }" 
              @click="switchAITab('chat')"
            >
              聊天
            </button>
            <button 
              :class="{ active: aiCurrentTab === 'code' }" 
              @click="switchAITab('code')"
            >
              代码助手
            </button>
            <button 
              :class="{ active: aiCurrentTab === 'judge' }" 
              @click="switchAITab('judge')"
            >
              AI判题
            </button>
          </div>

          <!-- 聊天模式 -->
          <div v-if="aiCurrentTab === 'chat'" class="ai-chat-mode">
            <div class="ai-messages-container">
              <div 
                v-for="(msg, index) in aiMessages" 
                :key="index" 
                :class="['ai-message', msg.sender]"
              >
                <div class="ai-message-content">{{ msg.content }}</div>
              </div>
            </div>
            
            <div class="ai-input-area">
              <textarea
                v-model="aiInputMessage"
                placeholder="输入您的消息..."
                @keydown.enter.exact.prevent="sendAIMessage"
              />
              <button @click="sendAIMessage" :disabled="aiIsSending">发送</button>
            </div>
          </div>

          <!-- 代码助手模式 -->
          <div v-if="aiCurrentTab === 'code'" class="ai-code-mode">
            <div class="ai-code-tabs">
              <button 
                :class="{ active: aiCodeAction === 'explain' }" 
                @click="setAICodeAction('explain')"
              >
                解释代码
              </button>
              <button 
                :class="{ active: aiCodeAction === 'generate' }" 
                @click="setAICodeAction('generate')"
              >
                生成代码
              </button>
              <button 
                :class="{ active: aiCodeAction === 'debug' }" 
                @click="setAICodeAction('debug')"
              >
                调试代码
              </button>
            </div>

            <!-- 代码解释 -->
            <div v-if="aiCodeAction === 'explain'" class="ai-code-action-section">
              <label>编程语言:</label>
              <select v-model="aiLanguage">
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
                v-model="aiCodeInput" 
                placeholder="粘贴您需要解释的代码..."
              ></textarea>
              
              <button @click="sendAICodeRequest" :disabled="aiIsSending">解释代码</button>
            </div>

            <!-- 代码生成 -->
            <div v-if="aiCodeAction === 'generate'" class="ai-code-action-section">
              <label>编程语言:</label>
              <select v-model="aiLanguage">
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
                v-model="aiProblemDescription" 
                placeholder="描述您想要生成的代码功能..."
              ></textarea>
              
              <button @click="sendAICodeRequest" :disabled="aiIsSending">生成代码</button>
            </div>

            <!-- 代码调试 -->
            <div v-if="aiCodeAction === 'debug'" class="ai-code-action-section">
              <label>出错的代码:</label>
              <textarea 
                v-model="aiCodeInput" 
                placeholder="粘贴出现错误的代码..."
              ></textarea>
              
              <label>错误信息:</label>
              <input 
                v-model="aiErrorMessage" 
                type="text" 
                placeholder="请输入错误信息..."
              />
              
              <button @click="sendAICodeRequest" :disabled="aiIsSending">调试代码</button>
            </div>

            <div class="ai-code-result" v-if="aiCodeResult">
              <label>结果:</label>
              <pre>{{ aiCodeResult }}</pre>
            </div>
          </div>

          <!-- AI判题模式 -->
          <div v-if="aiCurrentTab === 'judge'" class="ai-judge-mode">
            <div class="ai-judge-section">
              <label>编程语言:</label>
              <select v-model="aiJudgeLanguage">
                <option value="python3">Python 3</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="typescript">TypeScript</option>
              </select>
              
              <label>源代码:</label>
              <div class="judge-toolbar">
                <button type="button" class="judge-secondary-btn" @click="syncJudgeDraftFromEditor" :disabled="aiIsSending">
                  使用编辑器代码
                </button>
              </div>
              <textarea 
                v-model="aiJudgeCode" 
                :placeholder="aiJudgeDefaultCode"
                class="ai-judge-code-textarea"
              ></textarea>
              
              <label>解题思路/笔记 (可选):</label>
              <textarea 
                v-model="aiJudgeNotes" 
                placeholder="记录您的解题思路或备注..."
                rows="2"
              ></textarea>
              
              <button @click="submitAIJudge" :disabled="aiIsSending">提交判题</button>
            </div>

            <!-- 判题结果 -->
            <div v-if="aiJudgeResult" class="ai-judge-result">
              <h4>判题结果:</h4>
              <div class="result-content">
                <div v-if="aiJudgeResult.success || aiJudgeResult.correct" class="result-success">
                  <span class="success-icon">✓</span>
                  <span>恭喜！题目通过了所有测试用例</span>
                </div>
                <div v-else class="result-failure">
                  <span class="failure-icon">✗</span>
                  <span>很遗憾，代码未能通过所有测试用例</span>
                </div>
                
                <div v-if="aiJudgeResult.message" class="result-message">
                  <strong>AI反馈:</strong>
                  <p>{{ aiJudgeResult.message }}</p>
                </div>
                
                <div v-if="aiJudgeResult.execution_time" class="execution-info">
                  <strong>执行时间:</strong> {{ aiJudgeResult.execution_time }}ms
                </div>
                
                <div v-if="aiJudgeResult.memory_used" class="execution-info">
                  <strong>内存使用:</strong> {{ aiJudgeResult.memory_used }}KB
                </div>
              </div>
              
              <!-- 通过后的操作按钮 -->
              <div v-if="aiJudgeResult.success || aiJudgeResult.correct" class="ai-judge-actions">
                <button @click="showNextProblemDialog" class="next-problem-btn">
                  继续操作
                </button>
              </div>
            </div>

            <!-- 详细调试信息 -->
            <div v-if="aiJudgeResult" class="ai-judge-debug-section">
              <details class="ai-judge-debug-details">
                <summary>📋 查看完整响应数据 (点击展开)</summary>
                <pre class="ai-judge-debug-json">{{ JSON.stringify(aiJudgeResult, null, 2) }}</pre>
              </details>
            </div>

            <div v-if="aiJudgeError" class="ai-judge-error">
              {{ aiJudgeError }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- AI助手切换按钮 -->
      <div class="ai-toggle-btn" @click="toggleAIPanel" :title="aiPanelOpen ? '收起AI助手' : '展开AI助手'">
        <span>🤖</span>
      </div>
    </div>
    
    <!-- 下一道题选择弹窗 -->
    <div v-if="showNextProblemDialogVisible" class="next-problem-dialog-overlay">
      <div class="next-problem-dialog">
        <div class="dialog-header">
          <h3>题目已完成！</h3>
          <button class="dialog-close" @click="closeNextProblemDialog">×</button>
        </div>
        <div class="dialog-content">
          <p>恭喜您成功完成本题！请选择下一步操作：</p>
          <div class="dialog-actions">
            <button @click="goToNextProblemFromDialog" class="action-btn next-btn" :disabled="isLastProblem">
              下一道题
            </button>
            <button @click="stayOnCurrentProblem" class="action-btn stay-btn">
              留在本页面
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import request from '@/utils/request';
import CodeEditor from '@/components/CodeEditor.vue';

export default {
  name: 'ProblemDetail',
  components: {
    CodeEditor
  },
  props: {
    problemId: {
      type: Number,
      required: true
    }
  },
  data() {
    const defaultJudgeCode = '// 在这里编写您的代码...';

    return {
      problem: {
        problem_id: null,
        title: '',
        content: '',
        difficulty: '',
        title_slug: '',
        tags: []
      },
      problemList: [], // 存储题目列表
      currentIndex: -1, // 当前题目在列表中的索引
      isProblemLoading: false,
      problemLoadError: '',
      
      // AI助手相关数据
      aiPanelOpen: false,
      aiCurrentTab: 'chat',
      aiCodeAction: 'explain',
      aiMessages: [
        { sender: 'ai', content: '您好！我是AI助手，可以帮您解答问题或处理代码相关任务。' }
      ],
      aiInputMessage: '',
      aiIsSending: false,
      aiCodeInput: '',
      aiProblemDescription: '',
      aiErrorMessage: '',
      aiLanguage: 'Python',
      aiCodeResult: '',
      
      // AI判题相关数据
      aiJudgeDefaultCode: defaultJudgeCode,
      aiJudgeLanguage: 'python3',
      aiJudgeCode: defaultJudgeCode,
      aiJudgeNotes: '',
      aiJudgeResult: null,
      aiJudgeError: '',
      
      // 弹窗相关数据
      showNextProblemDialogVisible: false
    };
  },
  computed: {
    isFirstProblem() {
      return this.currentIndex <= 0;
    },
    isLastProblem() {
      return this.currentIndex >= this.problemList.length - 1;
    },
    problemProgressText() {
      if (!this.problemList.length || this.currentIndex < 0) return '-- / --';
      return `${this.currentIndex + 1} / ${this.problemList.length}`;
    },
    currentProblemDone() {
      const currentProblem = this.problemList[this.currentIndex];
      if (currentProblem) return this.isDoneFlag(currentProblem.is_done);
      return this.isDoneFlag(this.problem.is_done);
    }
  },
  async mounted() {
    if (!this.checkAuth()) {
      sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
      this.$router.push('/login');
      return;
    }
    await Promise.all([this.fetchProblemDetail(), this.fetchProblemList()]);
    window.addEventListener('keydown', this.handlePageHotkeys);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handlePageHotkeys);
  },
  methods: {
    checkAuth() {
      const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
      return !!token;
    },

    isDoneFlag(value) {
      return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
    },

    updateCurrentIndexByProblemId(problemId = this.problemId) {
      this.currentIndex = this.problemList.findIndex((item) => Number(item.problem_id) === Number(problemId));
    },

    normalizeProblemPayload(payload = {}) {
      return {
        ...payload,
        problem_id: payload.problem_id ?? payload.id ?? this.problemId,
        title: payload.title || '',
        content: payload.content || '',
        difficulty: payload.difficulty ?? '',
        title_slug: payload.title_slug || payload.slug || '',
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        is_done: this.isDoneFlag(payload.is_done)
      };
    },

    parseProblemBatch(responsePayload) {
      const candidates = [responsePayload];
      if (responsePayload && typeof responsePayload === 'object' && responsePayload.data) {
        candidates.push(responsePayload.data);
      }

      for (const item of candidates) {
        if (Array.isArray(item)) {
          return { list: item, hasNext: item.length > 0, hasNextFromApi: false };
        }
        if (!item || typeof item !== 'object') continue;

        if (Array.isArray(item.results)) {
          const hasNextFromApi = Object.prototype.hasOwnProperty.call(item, 'next');
          return { list: item.results, hasNext: Boolean(item.next), hasNextFromApi };
        }
        if (Array.isArray(item.problems)) {
          const hasNextFromApi = Object.prototype.hasOwnProperty.call(item, 'next');
          const hasNext = hasNextFromApi ? Boolean(item.next) : item.problems.length > 0;
          return { list: item.problems, hasNext, hasNextFromApi };
        }
        if (Array.isArray(item.items)) {
          return { list: item.items, hasNext: item.items.length > 0, hasNextFromApi: false };
        }
        if (Array.isArray(item.list)) {
          return { list: item.list, hasNext: item.list.length > 0, hasNextFromApi: false };
        }
        if (item.problem_id || item.id) {
          return { list: [item], hasNext: false, hasNextFromApi: true };
        }
      }

      return { list: [], hasNext: false, hasNextFromApi: true };
    },

    extractProblemDetailPayload(responsePayload) {
      if (!responsePayload || typeof responsePayload !== 'object') return {};

      const root = responsePayload.data && typeof responsePayload.data === 'object'
        ? responsePayload.data
        : responsePayload;

      if (root.problem && typeof root.problem === 'object') return root.problem;
      return root;
    },

    retryLoadProblem() {
      this.fetchProblemDetail();
      this.fetchProblemList();
    },

    handlePageHotkeys(event) {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === 'ArrowLeft' && !this.isFirstProblem) {
        event.preventDefault();
        this.goToPreviousProblem();
      }
      if (event.key === 'ArrowRight' && !this.isLastProblem) {
        event.preventDefault();
        this.goToNextProblem();
      }
    },

    openAIPanelTo(tab = 'chat') {
      if (!this.checkAuth()) {
        sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
        this.$router.push('/login');
        return;
      }

      this.aiPanelOpen = true;
      this.aiCurrentTab = tab;
      if (tab === 'judge') this.syncJudgeDraftFromEditor();
    },

    normalizeJudgeLanguage(languageText) {
      const text = String(languageText || '').toLowerCase();
      if (!text) return this.aiJudgeLanguage;
      if (text.includes('python')) return 'python3';
      if (text.includes('javascript') || text.includes('node')) return 'javascript';
      if (text.includes('typescript')) return 'typescript';
      if (text.includes('c++') || text.includes('cpp')) return 'cpp';
      if (text.includes('c#') || text.includes('csharp')) return 'csharp';
      if (text.includes('java')) return 'java';
      if (text === 'go' || text.includes('golang') || text.includes(' go')) return 'go';
      if (text.includes('rust')) return 'rust';
      return this.aiJudgeLanguage;
    },

    syncJudgeDraftFromEditor() {
      const editorCode = this.getCurrentCode();
      const editorLanguage = this.getCurrentLanguage();
      if (editorCode && editorCode.trim()) {
        this.aiJudgeCode = editorCode;
      }
      this.aiJudgeLanguage = this.normalizeJudgeLanguage(editorLanguage);
    },
    
    async fetchProblemDetail() {
      this.isProblemLoading = true;
      this.problemLoadError = '';

      try {
        const response = await request.get(`/api/leetcode/problems/${this.problemId}/`);
        const payload = this.extractProblemDetailPayload(response);
        this.problem = this.normalizeProblemPayload(payload);
      } catch (error) {
        console.error('获取题目详情失败:', error);
        this.problemLoadError = '加载题目失败，请稍后重试';
      } finally {
        this.isProblemLoading = false;
      }
    },
    async fetchProblemList() {
      try {
        const allQuestions = [];
        let page = 1;
        const requestPageSize = 50;
        let hasMore = true;
        let safeGuard = 0;

        while (hasMore) {
          const response = await request.get('/api/leetcode/problems/', {
            params: {
              page,
              page_size: requestPageSize
            }
          });

          const { list, hasNext, hasNextFromApi } = this.parseProblemBatch(response);
          allQuestions.push(...list);

          if (hasNextFromApi) {
            hasMore = hasNext;
          } else {
            hasMore = list.length === requestPageSize;
          }

          page += 1;
          safeGuard += 1;
          if (safeGuard > 40 || allQuestions.length >= 2000) hasMore = false;
        }

        this.problemList = allQuestions.map((item) => ({
          ...item,
          problem_id: item.problem_id ?? item.id,
          is_done: this.isDoneFlag(item.is_done)
        }));
        
        this.updateCurrentIndexByProblemId();

        const currentProblem = this.problemList[this.currentIndex];
        if (currentProblem && this.isDoneFlag(currentProblem.is_done)) {
          this.problem.is_done = true;
        }
      } catch (error) {
        console.error('获取题目列表失败:', error);
        this.problemList = [];
        this.currentIndex = -1;
      }
    },
    goBackToMain() {
      this.$router.push('/main');
    },
    goToPreviousProblem() {
      if (this.currentIndex > 0) {
        const prevProblem = this.problemList[this.currentIndex - 1];
        if (prevProblem && prevProblem.problem_id) {
          try {
            this.$router.push({
              name: 'ProblemDetail',
              params: { problemId: prevProblem.problem_id }
            }).catch(err => {
              console.warn('路由跳转被阻止:', err);
            });
          } catch (error) {
            console.error('跳转到上一道题失败:', error);
          }
        }
      }
    },
    goToNextProblem() {
      if (this.currentIndex < this.problemList.length - 1) {
        const nextProblem = this.problemList[this.currentIndex + 1];
        if (nextProblem && nextProblem.problem_id) {
          try {
            this.$router.push({
              name: 'ProblemDetail', 
              params: { problemId: nextProblem.problem_id }
            }).catch(err => {
              console.warn('路由跳转被阻止:', err);
            });
          } catch (error) {
            console.error('跳转到下一道题失败:', error);
          }
        }
      }
    },
    getDifficultyText(difficulty) {
      if (typeof difficulty === 'number') {
        if (difficulty === 1) return '简单';
        if (difficulty === 2) return '中等';
        if (difficulty === 3) return '困难';
      }
      if (typeof difficulty === 'string') {
        if (difficulty === 'easy') return '简单';
        if (difficulty === 'medium') return '中等';
        if (difficulty === 'hard') return '困难';
      }
      return difficulty || '';
    },
    
    // AI助手相关方法
    toggleAIPanel() {
      this.aiPanelOpen = !this.aiPanelOpen;
    },
    
    switchAITab(tab) {
      if (!this.checkAuth()) {
        sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
        this.$router.push('/login');
        return;
      }
      this.aiCurrentTab = tab;
      if (tab === 'judge') {
        this.syncJudgeDraftFromEditor();
      }
    },
    
    setAICodeAction(action) {
      if (!this.checkAuth()) {
        sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
        this.$router.push('/login');
        return;
      }
      this.aiCodeAction = action;
    },
    
    async sendAIMessage() {
      if (!this.checkAuth()) {
        sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
        this.$router.push('/login');
        return;
      }
      
      if (!this.aiInputMessage.trim()) return;

      this.aiMessages.push({
        sender: 'user',
        content: this.aiInputMessage
      });

      const userMessage = this.aiInputMessage;
      this.aiInputMessage = '';
      this.aiIsSending = true;

      try {
        const response = await request.post('/api/ai/chat/', {
          message: userMessage,
          temperature: 0.7,
          max_tokens: 2000
        });

        this.aiMessages.push({
          sender: 'ai',
          content: response.data.response || response.data.message || '抱歉，我没有理解您的问题。'
        });
      } catch (error) {
        console.error('Error sending AI message:', error);
        this.aiMessages.push({
          sender: 'ai',
          content: '抱歉，发生了一个错误，无法获取AI回复。'
        });
      } finally {
        this.aiIsSending = false;
      }
    },

    async sendAICodeRequest() {
      if (!this.checkAuth()) {
        sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
        this.$router.push('/login');
        return;
      }
      
      if ((this.aiCodeAction !== 'generate' && !this.aiCodeInput.trim()) ||
          (this.aiCodeAction === 'generate' && !this.aiProblemDescription.trim()) ||
          (this.aiCodeAction === 'debug' && !this.aiErrorMessage.trim())) {
        return;
      }

      this.aiIsSending = true;
      this.aiCodeResult = '';

      try {
        let requestBody = {};

        if (this.aiCodeAction === 'explain') {
          requestBody = {
            action: 'explain',
            code: this.aiCodeInput,
            language: this.aiLanguage
          };
        } else if (this.aiCodeAction === 'generate') {
          requestBody = {
            action: 'generate',
            problem_description: this.aiProblemDescription,
            language: this.aiLanguage
          };
        } else if (this.aiCodeAction === 'debug') {
          requestBody = {
            action: 'debug',
            code: this.aiCodeInput,
            error_message: this.aiErrorMessage
          };
        }

        const response = await request.post('/api/ai/code-help/', requestBody);

        this.aiCodeResult = response.data.result || response.data.response || '没有返回结果';
      } catch (error) {
        console.error('Error sending AI code request:', error);
        this.aiCodeResult = '抱歉，发生了一个错误，无法处理您的请求。';
      } finally {
        this.aiIsSending = false;
      }
    },
    
    // 获取当前代码编辑器中的代码
    getCurrentCode() {
      if (this.$refs.codeEditorRef && this.$refs.codeEditorRef.sourceCode) {
        return this.$refs.codeEditorRef.sourceCode;
      }
      return this.aiJudgeDefaultCode;
    },
    
    // 获取当前选择的编程语言
    getCurrentLanguage() {
      if (this.$refs.codeEditorRef && this.$refs.codeEditorRef.selectedLanguage) {
        return this.$refs.codeEditorRef.selectedLanguage;
      }
      return 'python3';
    },
    
    async submitAIJudge() {
      if (!this.checkAuth()) {
        sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
        this.$router.push('/login');
        return;
      }
      
      // 如果用户没有在AI判题区域输入代码，尝试从CodeEditor获取
      const codeToSubmit = this.aiJudgeCode.trim() !== this.aiJudgeDefaultCode && this.aiJudgeCode.trim() 
        ? this.aiJudgeCode 
        : this.getCurrentCode();
      
      if (!codeToSubmit.trim()) {
        this.aiJudgeError = '请先编写代码';
        return;
      }

      this.aiIsSending = true;
      this.aiJudgeResult = null;
      this.aiJudgeError = '';

      try {
        // 如果用户没有选择语言，尝试从CodeEditor获取
        const languageToSubmit = this.aiJudgeCode.trim() !== this.aiJudgeDefaultCode && this.aiJudgeCode.trim()
          ? this.aiJudgeLanguage
          : this.normalizeJudgeLanguage(this.getCurrentLanguage());

        const requestBody = {
          problem_id: parseInt(this.problemId, 10),
          source_code: codeToSubmit,
          language: languageToSubmit,
          notes: this.aiJudgeNotes.trim() || undefined
        };

        const response = await request.post('/api/ai/judge/submit-and-complete/', requestBody);
        
        // 在控制台打印完整响应，方便调试
        console.log('=== AI判题完整响应数据 ===')
        console.log('响应数据:', response.data)
        
        this.aiJudgeResult = response.data;
        this.aiJudgeError = '';
        
        // 检查判题是否通过，如果通过则立即更新主页面的已做题数
        const isCorrect = response.data?.correct === true || response.data?.success === true;
        if (isCorrect) {
          // 立即更新题目完成状态，不需要等待用户点击"留在本页面"
          this.updateProblemCompletionStatus();
        }
      } catch (error) {
        console.error('提交AI判题失败:', error);
        if (error.response?.data?.detail) {
          this.aiJudgeError = error.response.data.detail;
        } else if (error.response?.status === 401) {
          // Token过期，重定向到登录页
          localStorage.removeItem('token');
          localStorage.removeItem('jwt_token');
          sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
          this.$router.push('/login');
        } else {
          this.aiJudgeError = '提交判题失败，请稍后重试';
        }
      } finally {
        this.aiIsSending = false;
      }
    },
    
    // 显示下一道题选择弹窗
    showNextProblemDialog() {
      this.showNextProblemDialogVisible = true;
    },
    
    // 关闭弹窗
    closeNextProblemDialog() {
      this.showNextProblemDialogVisible = false;
    },
    
    // 跳转到下一道题
    goToNextProblemFromDialog() {
      this.closeNextProblemDialog();
      this.resetAIJudgeState(); // 重置AI判题状态
      this.goToNextProblem();
    },
    
    // 留在当前页面
    stayOnCurrentProblem() {
      this.closeNextProblemDialog();
      // 不再需要在这里调用 updateProblemCompletionStatus，因为已经在 submitAIJudge 中处理了
      // 只保留关闭弹窗的逻辑
    },
    
    // 重置AI判题状态
    resetAIJudgeState() {
      this.aiJudgeLanguage = 'python3';
      this.aiJudgeCode = this.aiJudgeDefaultCode;
      this.aiJudgeNotes = '';
      this.aiJudgeResult = null;
      this.aiJudgeError = '';
      this.showNextProblemDialogVisible = false;
    },
    
    // 更新题目完成状态（直接刷新题目列表）
    async updateProblemCompletionStatus() {
      try {
        console.log('准备更新题目完成状态，problemId:', this.problemId);
        
        // 直接刷新题目列表，因为 /api/auth/jwt/me/ 会返回最新统计
        // 这样可以确保本地数据与后端保持一致
        
        // 更新本地 problemList 中的状态（用于当前页面显示）
        if (this.problemList && this.problemList.length > 0 && this.currentIndex >= 0) {
          const currentProblem = this.problemList[this.currentIndex];
          if (currentProblem) {
            // 标记为已完成
            currentProblem.is_done = true;
            currentProblem.status = '已完成';
            this.problem.is_done = true;
            
            console.log('本地题目列表状态已更新:', currentProblem);
          }
        }
        
        // 触发全局事件通知主页面刷新
        if (window.problemCompletedCallback) {
          window.problemCompletedCallback({
            problem_id: this.problemId,
            is_done: true
          });
        }
        
      } catch (error) {
        console.error('更新题目完成状态失败:', error);
        
        // 即使出现错误，也尝试更新本地显示
        if (this.problemList && this.problemList.length > 0 && this.currentIndex >= 0) {
          const currentProblem = this.problemList[this.currentIndex];
          if (currentProblem) {
            currentProblem.is_done = true;
            this.problem.is_done = true;
          }
        }
      }
    }
  },
  // 监听路由参数变化，当problemId改变时重新获取数据
  watch: {
    problemId: {
      async handler(newId) {
        console.log('problemId changed to:', newId);
        await this.fetchProblemDetail();
        // 如果题目列表已经加载，重新确定当前索引
        if (this.problemList && this.problemList.length > 0) {
          this.updateCurrentIndexByProblemId(newId);
          console.log('Updated current index:', this.currentIndex);
        } else {
          await this.fetchProblemList();
        }
        // 重置AI判题状态
        this.resetAIJudgeState();
      },
      immediate: false
    }
  }
};
</script>

<style scoped>
.problem-detail {
  --pd-bg-base: #f4f1ea;
  --pd-bg-soft: #f8f5ef;
  --pd-card: #fffdf9;
  --pd-card-soft: #f7f3ec;
  --pd-line: #e4ddd2;
  --pd-line-soft: #ece6dd;
  --pd-text-strong: #2f3a32;
  --pd-text-main: #4d584d;
  --pd-text-muted: #788276;
  --pd-primary: #6f8b6f;
  --pd-primary-strong: #5a755a;
  --pd-primary-soft: #edf4ec;
  --pd-warn: #9a7440;
  --pd-warn-bg: #f5ebd6;
  --pd-danger: #9b4338;
  --pd-danger-bg: #fae9e7;

  display: flex;
  min-height: 100vh;
  height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 8% 0%, #e8f0e7 0, transparent 35%),
    radial-gradient(circle at 90% 10%, #f5ebe0 0, transparent 28%),
    var(--pd-bg-base);
  color: var(--pd-text-main);
  font-family: 'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei UI', sans-serif;
}

.left-side,
.right-side {
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
}

.left-side {
  width: 54%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--pd-line-soft);
}

.right-side {
  width: 46%;
  padding: 12px 12px 12px 8px;
}

.right-side :deep(.code-editor-container) {
  height: 100%;
  border-radius: 18px;
  border: 1px solid var(--pd-line-soft);
  background: var(--pd-card);
  box-shadow: 0 10px 24px rgba(64, 55, 42, 0.08);
  overflow: hidden;
}

.right-side :deep(.header) {
  background: var(--pd-card-soft);
  border-bottom: 1px solid var(--pd-line-soft);
}

.right-side :deep(.header h3) {
  color: var(--pd-text-strong);
}

.right-side :deep(.editor-content) {
  background: var(--pd-card);
}

.problem-navigation {
  position: sticky;
  top: 0;
  z-index: 12;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 22px;
  background: rgba(255, 253, 249, 0.9);
  border-bottom: 1px solid var(--pd-line-soft);
  backdrop-filter: blur(8px);
}

.problem-navigation-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.nav-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.nav-progress,
.nav-shortcut {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--pd-line-soft);
  background: #f8f4ec;
  color: var(--pd-text-muted);
  font-size: 12px;
  white-space: nowrap;
}

.nav-status {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.nav-status.is-done {
  color: #4f7b4f;
  background: #eaf2e8;
  border: 1px solid #cbdcc8;
}

.nav-status.is-todo {
  color: #8a6c3e;
  background: #f7edd9;
  border: 1px solid #e7d2a3;
}

.nav-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.nav-button {
  border: 1px solid var(--pd-line);
  background: #f2ede4;
  color: #596858;
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.18s ease;
}

.nav-button:hover:not(:disabled) {
  background: #ebe4d7;
  transform: translateY(-1px);
}

.nav-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.prev-button,
.next-button,
.retry-btn,
.inline-ai-btn,
.ai-input-area button,
.ai-code-action-section button,
.ai-judge-section > button,
.next-problem-btn,
.next-btn,
.action-btn {
  border: none;
  background: linear-gradient(120deg, var(--pd-primary-strong), var(--pd-primary));
  color: #fff;
  box-shadow: 0 8px 18px rgba(74, 93, 74, 0.2);
}

.prev-button:hover:not(:disabled),
.next-button:hover:not(:disabled),
.retry-btn:hover,
.inline-ai-btn:hover,
.ai-input-area button:hover:not(:disabled),
.ai-code-action-section button:hover:not(:disabled),
.ai-judge-section > button:hover:not(:disabled),
.next-problem-btn:hover,
.next-btn:hover:not(:disabled),
.action-btn:hover:not(:disabled) {
  background: linear-gradient(120deg, #537054, #6c8669);
}

.back-button,
.stay-btn {
  border: 1px solid var(--pd-line);
  background: #ece7df;
  color: #5d635f;
  box-shadow: none;
}

.back-button:hover:not(:disabled),
.stay-btn:hover {
  background: #e4ddd2;
}

.problem-content-wrapper {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 22px 24px;
}

.problem-loading-card,
.problem-error-card,
.problem-content-card {
  background: var(--pd-card);
  border: 1px solid var(--pd-line-soft);
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(64, 55, 42, 0.08);
  padding: 18px;
}

.problem-loading-card,
.problem-error-card {
  text-align: center;
}

.problem-loading-card h3,
.problem-error-card h3 {
  margin: 0;
  color: var(--pd-text-strong);
  font-size: 20px;
}

.problem-loading-card p,
.problem-error-card p {
  margin: 10px 0 0;
  color: var(--pd-text-main);
  line-height: 1.6;
}

.retry-btn,
.inline-ai-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.problem-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.problem-title {
  margin: 0;
  font-size: clamp(22px, 2.6vw, 30px);
  line-height: 1.3;
  color: var(--pd-text-strong);
}

.problem-info {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.problem-info span {
  display: inline-flex;
  align-items: center;
  height: 26px;
  border-radius: 999px;
  padding: 0 10px;
  border: 1px solid var(--pd-line);
  font-size: 12px;
  color: var(--pd-text-main);
  background: #f6f2ea;
}

.problem-info span[class^='difficulty-'] {
  border: 1px solid #d7cfbf;
  background: #f2ede4;
  color: #6f614a;
}

.difficulty-简单,
.difficulty-easy {
  color: #4f7b4f !important;
  border-color: #cbdcc8 !important;
  background: #eaf2e8 !important;
}

.difficulty-中等,
.difficulty-medium {
  color: #9a7440 !important;
  border-color: #e7d2a3 !important;
  background: #f5ebd6 !important;
}

.difficulty-困难,
.difficulty-hard {
  color: #9b4338 !important;
  border-color: #e8c0ba !important;
  background: #fae9e7 !important;
}

.problem-slug {
  color: var(--pd-text-muted);
  background: #f0ece4;
}

.problem-tags-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 24px;
  border-radius: 999px;
  padding: 0 10px;
  border: 1px solid #d2dfd0;
  background: #eff6ed;
  color: #5d7560;
  font-size: 12px;
}

.problem-content {
  margin-top: 16px;
  color: var(--pd-text-main);
  line-height: 1.72;
  font-size: 15px;
}

.problem-content :deep(h1),
.problem-content :deep(h2),
.problem-content :deep(h3),
.problem-content :deep(h4) {
  color: var(--pd-text-strong);
  line-height: 1.45;
  margin: 16px 0 10px;
}

.problem-content :deep(p) {
  margin: 0 0 12px;
}

.problem-content :deep(ul),
.problem-content :deep(ol) {
  margin: 0 0 12px;
  padding-left: 22px;
}

.problem-content :deep(li) {
  margin-bottom: 6px;
}

.problem-content :deep(pre) {
  background: #f7f2e9;
  border: 1px solid var(--pd-line-soft);
  border-radius: 10px;
  padding: 12px;
  overflow: auto;
}

.problem-content :deep(code) {
  background: #efe9df;
  border-radius: 6px;
  padding: 2px 6px;
}

.problem-content :deep(blockquote) {
  margin: 0 0 12px;
  border-left: 3px solid #c7d7c4;
  padding: 8px 12px;
  background: #f0f6ef;
  color: #59705b;
  border-radius: 0 8px 8px 0;
}

.problem-content :deep(img) {
  max-width: 100%;
  border-radius: 10px;
}

.ai-panel-container {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  z-index: 40;
  pointer-events: none;
}

.ai-panel {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  background: var(--pd-card);
  border-left: 1px solid var(--pd-line-soft);
  box-shadow: -12px 0 26px rgba(64, 55, 42, 0.12);
  overflow: hidden;
  pointer-events: auto;
}

.ai-panel-content {
  height: 100%;
  padding: 14px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ai-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--pd-line-soft);
  padding-bottom: 10px;
}

.ai-panel-header h3 {
  margin: 0;
  color: var(--pd-text-strong);
}

.close-btn {
  border: 1px solid var(--pd-line);
  background: #f2ede4;
  color: #596858;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  transition: all 0.18s ease;
}

.close-btn:hover {
  background: #ebe4d8;
}

.ai-tabs,
.ai-code-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid var(--pd-line-soft);
  background: var(--pd-card-soft);
  margin-bottom: 12px;
}

.ai-tabs button,
.ai-code-tabs button {
  border: none;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: transparent;
  color: var(--pd-text-main);
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}

.ai-tabs button.active,
.ai-code-tabs button.active {
  background: linear-gradient(120deg, var(--pd-primary-strong), var(--pd-primary));
  color: #fff;
  box-shadow: 0 8px 18px rgba(74, 93, 74, 0.2);
}

.ai-chat-mode,
.ai-code-mode,
.ai-judge-mode {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.ai-messages-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid var(--pd-line-soft);
  border-radius: 12px;
  background: #f8f4ee;
  padding: 10px;
}

.ai-message {
  margin-bottom: 8px;
  max-width: 92%;
}

.ai-message-content {
  border-radius: 12px;
  padding: 8px 10px;
  line-height: 1.55;
  word-break: break-word;
  font-size: 13px;
  border: 1px solid var(--pd-line-soft);
}

.ai-message.user {
  margin-left: auto;
}

.ai-message.user .ai-message-content {
  background: #eaf2e8;
  border-color: #cbdcc8;
}

.ai-message.ai .ai-message-content {
  background: #f2ede4;
  border-color: #ded6c8;
}

.ai-input-area {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.ai-input-area textarea,
.ai-code-action-section select,
.ai-code-action-section textarea,
.ai-code-action-section input,
.ai-judge-section select,
.ai-judge-section textarea,
.ai-judge-section input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--pd-line);
  border-radius: 12px;
  background: #fffcf8;
  color: var(--pd-text-main);
  padding: 9px 10px;
  font-size: 13px;
  outline: none;
}

.ai-input-area textarea:focus,
.ai-code-action-section select:focus,
.ai-code-action-section textarea:focus,
.ai-code-action-section input:focus,
.ai-judge-section select:focus,
.ai-judge-section textarea:focus,
.ai-judge-section input:focus {
  border-color: #9aad98;
  box-shadow: 0 0 0 3px rgba(143, 163, 140, 0.2);
}

.ai-input-area textarea {
  min-height: 60px;
  resize: vertical;
}

.ai-input-area button,
.ai-code-action-section button,
.ai-judge-section > button,
.next-problem-btn,
.action-btn {
  height: 34px;
  border-radius: 999px;
  padding: 0 12px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.18s ease;
}

.ai-input-area button:disabled,
.ai-code-action-section button:disabled,
.ai-judge-section > button:disabled,
.next-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.ai-code-action-section {
  margin-bottom: 12px;
}

.ai-code-action-section label,
.ai-judge-section label,
.ai-code-result label {
  display: block;
  margin: 0 0 6px;
  color: var(--pd-text-main);
  font-size: 12px;
  font-weight: 600;
}

.ai-code-action-section textarea {
  min-height: 96px;
  resize: vertical;
}

.ai-code-result {
  margin-top: 12px;
  border: 1px solid var(--pd-line-soft);
  border-radius: 12px;
  overflow: hidden;
  background: #faf7f2;
}

.ai-code-result pre {
  margin: 0;
  padding: 10px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 220px;
  overflow-y: auto;
}

.ai-judge-code-textarea {
  min-height: 130px;
  resize: vertical;
  font-family: Consolas, 'Courier New', monospace;
}

.judge-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.judge-secondary-btn {
  border: 1px solid #d2decf;
  background: #edf4ec;
  color: #587059;
  height: 32px;
  border-radius: 999px;
  padding: 0 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.judge-secondary-btn:hover:not(:disabled) {
  background: #e0ece0;
}

.judge-secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-judge-result {
  margin-top: 12px;
  border: 1px solid var(--pd-line-soft);
  border-radius: 12px;
  background: #fbf8f3;
  padding: 12px;
}

.ai-judge-result h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--pd-text-strong);
}

.result-content {
  display: grid;
  gap: 8px;
}

.result-success,
.result-failure {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  padding: 9px 10px;
  border: 1px solid transparent;
  font-size: 13px;
}

.result-success {
  background: #eaf2e8;
  border-color: #cbdcc8;
  color: #4f7b4f;
}

.result-failure {
  background: #fae9e7;
  border-color: #e8c0ba;
  color: #9b4338;
}

.success-icon,
.failure-icon {
  font-weight: 700;
}

.result-message,
.execution-info {
  border-radius: 10px;
  background: #f3eee6;
  border: 1px solid #e4ddd2;
  padding: 8px 10px;
  font-size: 12px;
  color: var(--pd-text-main);
}

.result-message p {
  margin: 6px 0 0;
  line-height: 1.6;
}

.ai-judge-actions {
  margin-top: 10px;
}

.ai-judge-debug-section {
  margin-top: 10px;
}

.ai-judge-debug-details {
  border: 1px solid var(--pd-line-soft);
  border-radius: 10px;
  background: #f9f5ef;
  padding: 8px 10px;
}

.ai-judge-debug-details summary {
  cursor: pointer;
  color: var(--pd-text-main);
  font-size: 12px;
}

.ai-judge-debug-json {
  margin: 8px 0 0;
  padding: 10px;
  border-radius: 8px;
  background: #efe9df;
  border: 1px solid #ded5c7;
  font-size: 11px;
  line-height: 1.5;
  max-height: 200px;
  overflow: auto;
}

.ai-judge-error {
  margin-top: 10px;
  border: 1px solid #e8c0ba;
  background: #fae9e7;
  color: #9b4338;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
}

.ai-toggle-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(120deg, var(--pd-primary-strong), var(--pd-primary));
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(74, 93, 74, 0.28);
  pointer-events: auto;
  transition: transform 0.18s ease;
}

.ai-toggle-btn:hover {
  transform: translateY(-50%) scale(1.04);
}

.ai-toggle-btn span {
  font-size: 18px;
  line-height: 1;
}

.next-problem-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(41, 34, 24, 0.42);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 80;
  padding: 16px;
}

.next-problem-dialog {
  width: min(480px, 100%);
  background: var(--pd-card);
  border: 1px solid var(--pd-line-soft);
  border-radius: 18px;
  box-shadow: 0 18px 38px rgba(44, 36, 28, 0.2);
  overflow: hidden;
}

.dialog-header {
  padding: 12px 14px;
  border-bottom: 1px solid var(--pd-line-soft);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--pd-card-soft);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--pd-text-strong);
}

.dialog-close {
  border: 1px solid var(--pd-line);
  background: #f2ede4;
  color: #596858;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
}

.dialog-content {
  padding: 14px;
}

.dialog-content p {
  margin: 0;
  line-height: 1.65;
  color: var(--pd-text-main);
}

.dialog-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

.action-btn {
  flex: 1;
}

.next-btn:disabled {
  background: #bfc4bc;
}

@media (max-width: 1280px) {
  .left-side {
    width: 52%;
  }

  .right-side {
    width: 48%;
  }

  .problem-navigation {
    padding: 12px 16px;
  }

  .problem-content-wrapper {
    padding: 14px 16px 20px;
  }
}

@media (max-width: 1024px) {
  .problem-detail {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
    overflow: auto;
  }

  .left-side,
  .right-side {
    width: 100%;
    height: auto;
  }

  .left-side {
    min-height: 58vh;
    border-right: none;
  }

  .right-side {
    min-height: 46vh;
    padding: 0 14px 14px;
  }

  .right-side :deep(.code-editor-container) {
    min-height: 46vh;
  }

  .problem-navigation {
    position: sticky;
    top: 0;
  }

  .ai-panel {
    border-left: none;
    border-top: 1px solid var(--pd-line-soft);
    box-shadow: 0 -10px 24px rgba(64, 55, 42, 0.14);
  }
}

@media (max-width: 768px) {
  .problem-navigation {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .problem-navigation-left {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .nav-meta {
    width: 100%;
  }

  .nav-buttons {
    width: 100%;
    justify-content: stretch;
  }

  .nav-button {
    flex: 1;
  }

  .problem-loading-card,
  .problem-error-card,
  .problem-content-card {
    padding: 14px;
    border-radius: 16px;
  }

  .problem-title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .inline-ai-btn,
  .retry-btn {
    width: 100%;
  }

  .ai-panel {
    width: 100vw !important;
  }

  .ai-panel-content {
    padding: 12px;
  }

  .ai-tabs,
  .ai-code-tabs {
    width: 100%;
    overflow-x: auto;
  }

  .ai-input-area {
    flex-direction: column;
  }

  .ai-input-area button,
  .ai-code-action-section button,
  .ai-judge-section > button,
  .next-problem-btn,
  .action-btn {
    width: 100%;
  }

  .dialog-actions {
    flex-direction: column;
  }

  .ai-toggle-btn {
    right: 8px;
    width: 40px;
    height: 40px;
  }
}
</style>