<template>
  <div class="problem-detail">
    <div class="left-side">
      <!-- 导航栏 -->
      <div class="problem-navigation">
        <button class="nav-button back-button" @click="goBackToMain">
          ← 返回主页面
        </button>
        <div class="nav-buttons">
          <button 
            class="nav-button prev-button" 
            @click="goToPreviousProblem"
            :disabled="isFirstProblem"
          >
            上一道
          </button>
          <button 
            class="nav-button next-button" 
            @click="goToNextProblem"
            :disabled="isLastProblem"
          >
            下一道
          </button>
        </div>
      </div>
      
      <!-- 题目内容区域 -->
      <div class="problem-content-wrapper">
        <h1 class="problem-title">{{ problem.problem_id ? problem.problem_id + '. ' : '' }}{{ problem.title }}</h1>
        <div class="problem-info">
          <span :class="'difficulty-' + getDifficultyText(problem.difficulty)">{{ getDifficultyText(problem.difficulty) }}</span>
          <span class="problem-slug">Slug: {{ problem.title_slug }}</span>
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
        <div v-html="problem.content"></div>
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
              <textarea 
                v-model="aiJudgeCode" 
                placeholder="// 在这里编写您的代码..."
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
      aiJudgeLanguage: 'python3',
      aiJudgeCode: '// 在这里编写您的代码...',
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
    }
  },
  async mounted() {
    await this.fetchProblemDetail();
    await this.fetchProblemList();
    // 检查认证状态
    if (!this.checkAuth()) {
      sessionStorage.setItem('redirectAfterLogin', this.$route.fullPath);
      this.$router.push('/login');
    }
  },
  methods: {
    checkAuth() {
      const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
      return !!token;
    },
    
    async fetchProblemDetail() {
      try {
        const response = await request.get(`/api/leetcode/problems/${this.problemId}/`);
        this.problem = response.data.problem || response.data;
      } catch (error) {
        console.error('获取题目详情失败:', error);
      }
    },
    async fetchProblemList() {
      try {
        const response = await request.get('/api/leetcode/problems/');
        this.problemList = Array.isArray(response.data) ? response.data : 
                         (response.data.problems || response.data.results || []);
        
        this.currentIndex = this.problemList.findIndex(p => 
          Number(p.problem_id) === Number(this.problemId)
        );
      } catch (error) {
        console.error('获取题目列表失败:', error);
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
      return '// 在这里编写您的代码...';
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
      const codeToSubmit = this.aiJudgeCode.trim() !== '// 在这里编写您的代码...' && this.aiJudgeCode.trim() 
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
        const languageToSubmit = this.aiJudgeCode.trim() !== '// 在这里编写您的代码...' && this.aiJudgeCode.trim()
          ? this.aiJudgeLanguage
          : this.getCurrentLanguage();

        const requestBody = {
          problem_id: parseInt(this.problemId),
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
      this.aiJudgeCode = '// 在这里编写您的代码...';
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
          this.currentIndex = this.problemList.findIndex(p => 
            Number(p.problem_id) === Number(newId)
          );
          console.log('Updated current index:', this.currentIndex);
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
  display: flex;
  min-height: 100vh;
  background: #fff;
  height: 100vh;
  width: 100%;
  position: relative;
}

.left-side {
  background: #fff;
  width: 50%;
  overflow-y: auto;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.right-side {
  background-color: #f8f9fa;
  width: 50%;
  height: 100vh;
  box-sizing: border-box;
}

/* 导航栏样式 */
.problem-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 30px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  z-index: 10;
}

.nav-buttons {
  display: flex;
  gap: 12px;
}

.nav-button {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.nav-button:hover:not(:disabled) {
  background-color: #2a6bd1;
}

.nav-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.back-button {
  background-color: #606266;
}

.back-button:hover:not(:disabled) {
  background-color: #4a4c4f;
}

/* 题目内容区域 */
.problem-content-wrapper {
  padding: 30px;
  max-width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.problem-title {
  font-size: 2em;
  font-weight: bold;
  text-align: left;
  margin-bottom: 16px;
}

.problem-info {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
}

.problem-info span {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.difficulty-简单 {
  background-color: #dbf0df;
  color: green;
}

.difficulty-中等 {
  background-color: #fef8dc;
  color: #d4a70d;
}

.difficulty-困难 {
  background-color: #ffe0e0;
  color: #e30f0f;
}

.problem-slug {
  background-color: #f0f0f0;
  color: #666;
}

.problem-tags-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-height: 26px;
}

.tag {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}

/* AI助手面板样式 */
.ai-panel-container {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  z-index: 1000;
}

.ai-panel {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  background: white;
  box-shadow: -2px 0 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.ai-panel-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.ai-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.ai-panel-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.ai-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.ai-tabs button {
  background-color: #e0e0e0;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.ai-tabs button.active {
  background-color: #409eff;
  color: white;
}

.ai-chat-mode, .ai-code-mode {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.ai-messages-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 12px;
  background: #fafafa;
}

.ai-message {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
}

.ai-message.user {
  background-color: #e3f2fd;
  text-align: right;
}

.ai-message.ai {
  background-color: #f5f5f5;
  text-align: left;
}

.ai-message-content {
  word-break: break-word;
}

.ai-input-area {
  display: flex;
  gap: 8px;
}

.ai-input-area textarea {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  min-height: 40px;
}

.ai-input-area button {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.ai-input-area button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.ai-code-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.ai-code-tabs button {
  background-color: #e0e0e0;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.ai-code-tabs button.active {
  background-color: #409eff;
  color: white;
}

.ai-code-action-section {
  margin-bottom: 16px;
}

.ai-code-action-section label {
  display: block;
  margin-bottom: 4px;
  font-weight: bold;
}

.ai-code-action-section select,
.ai-code-action-section textarea,
.ai-code-action-section input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 12px;
}

.ai-code-action-section textarea {
  min-height: 120px;
  resize: vertical;
}

.ai-code-action-section button {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.ai-code-action-section button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.ai-code-result {
  margin-top: 16px;
}

.ai-code-result label {
  font-weight: bold;
  display: block;
  margin-bottom: 8px;
}

.ai-code-result pre {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
}

/* AI判题模式样式 */
.ai-judge-mode {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.ai-judge-section {
  margin-bottom: 16px;
}

.ai-judge-section label {
  display: block;
  margin-bottom: 4px;
  font-weight: bold;
}

.ai-judge-section select,
.ai-judge-section textarea,
.ai-judge-section input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 12px;
}

.ai-judge-code-textarea {
  min-height: 200px;
  resize: vertical;
  font-family: monospace;
}

.ai-judge-section button {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.ai-judge-section button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.ai-judge-result {
  background: white;
  padding: 12px;
  border-radius: 4px;
  margin-top: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.ai-judge-result h4 {
  margin-top: 0;
  color: #333;
  margin-bottom: 12px;
}

.result-success {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #e6f4ea;
  padding: 8px;
  border-radius: 4px;
  color: #137333;
  font-weight: bold;
}

.result-failure {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fce8e6;
  padding: 8px;
  border-radius: 4px;
  color: #c5221f;
  font-weight: bold;
}

.success-icon, .failure-icon {
  font-size: 16px;
}

.result-message {
  margin-top: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.result-message p {
  margin: 4px 0 0 0;
  line-height: 1.5;
}

.execution-info {
  margin-top: 8px;
  color: #666;
}

.ai-judge-error {
  background: #fce8e6;
  color: #c5221f;
  padding: 8px;
  border-radius: 4px;
  margin-top: 12px;
  border-left: 4px solid #c5221f;
}

/* AI判题调试信息样式 */
.ai-judge-debug-section {
  margin-top: 16px;
}

.ai-judge-debug-details {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.ai-judge-debug-details summary {
  padding: 8px 12px;
  background: #f8f9fa;
  font-weight: bold;
  color: #409eff;
  cursor: pointer;
  outline: none;
}

.ai-judge-debug-details summary:hover {
  background: #e9ecef;
}

.ai-judge-debug-details[open] summary {
  border-bottom: 1px solid #e0e0e0;
}

.ai-judge-debug-json {
  background: #f8f9fa;
  padding: 12px;
  margin: 0;
  font-size: 12px;
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

/* AI判题操作按钮样式 */
.ai-judge-actions {
  margin-top: 16px;
  text-align: center;
}

.next-problem-btn {
  padding: 8px 16px;
  background-color: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background-color 0.2s;
}

.next-problem-btn:hover {
  background-color: #43a00d;
}

/* 下一道题选择弹窗样式 */
.next-problem-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.next-problem-dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 400px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h3 {
  margin: 0;
  color: #333;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-close:hover {
  color: #333;
}

.dialog-content {
  padding: 20px;
}

.dialog-content p {
  margin: 0 0 20px 0;
  color: #555;
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background-color 0.2s;
}

.next-btn {
  background-color: #409eff;
  color: white;
}

.next-btn:hover:not(:disabled) {
  background-color: #2a6bd1;
}

.next-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.stay-btn {
  background-color: #606266;
  color: white;
}

.stay-btn:hover {
  background-color: #4a4c4f;
}

.ai-loading {
  padding: 16px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.ai-toggle-btn {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  background: #409eff;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 20px 0 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: -2px 0 5px rgba(0,0,0,0.2);
  z-index: 1001;
}

.ai-toggle-btn:hover {
  background: #2a6bd1;
}

@media (max-width: 768px) {
  .problem-detail {
    flex-direction: column;
    height: auto;
  }
  
  .left-side, .right-side {
    width: 100%;
    height: auto;
  }
  
  .problem-navigation {
    flex-direction: column;
    gap: 12px;
    padding: 12px 15px;
  }
  
  .nav-buttons {
    width: 100%;
    justify-content: center;
  }
  
  .problem-content-wrapper {
    padding: 15px;
  }
  
  .problem-title {
    font-size: 1.5em;
  }
  
  .problem-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .ai-panel {
    width: 100% !important;
    height: 80vh !important;
    top: auto !important;
    bottom: 0 !important;
    right: 0 !important;
  }
  
  .ai-toggle-btn {
    top: auto !important;
    bottom: 20px !important;
    right: 20px !important;
    transform: none !important;
    border-radius: 20px !important;
  }
}
</style>