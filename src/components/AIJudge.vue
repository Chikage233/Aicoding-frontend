<template>
  <div class="ai-judge-container">
    <div class="judge-header">
      <div class="header-left">
        <button class="back-button" @click="goBackToMain">
          ← 返回主页面
        </button>
        <h2>AI 判题助手</h2>
      </div>
    </div>

    <div class="judge-content">
      <!-- 题目信息区域 -->
      <div class="problem-info" v-if="problem">
        <h3>题目: {{ problem.title }}</h3>
        <div class="problem-description">{{ problem.description }}</div>
      </div>

      <!-- 编程语言选择 -->
      <div class="language-selector">
        <label>编程语言:</label>
        <select v-model="selectedLanguage">
          <option value="python3">Python 3</option>
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="csharp">C#</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="typescript">TypeScript</option>
        </select>
      </div>

      <!-- 用户笔记输入 -->
      <div class="notes-section">
        <label>解题思路/笔记 (可选):</label>
        <textarea 
          v-model="userNotes" 
          placeholder="记录您的解题思路或备注..."
          rows="3"
        ></textarea>
      </div>

      <!-- 代码编辑器 -->
      <div class="code-editor-section">
        <label>源代码:</label>
        <textarea 
          v-model="sourceCode"
          class="code-textarea"
          placeholder="// 在这里编写您的代码..."
        ></textarea>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-section">
        <button 
          @click="submitCode" 
          :disabled="isSubmitting || !problemId"
          class="submit-button"
        >
          {{ isSubmitting ? '判题中...' : '提交判题' }}
        </button>
      </div>

      <!-- 判题结果 -->
      <div v-if="judgeResult" class="judge-result">
        <h4>判题结果:</h4>
        <div class="result-content">
          <!-- 兼容后端返回的 correct 字段和 success 字段 -->
          <div v-if="judgeResult.success || judgeResult.correct" class="result-success">
            <span class="success-icon">✓</span>
            <span>恭喜！题目通过了所有测试用例</span>
          </div>
          <div v-else class="result-failure">
            <span class="failure-icon">✗</span>
            <span>很遗憾，代码未能通过所有测试用例</span>
          </div>

          <div v-if="!(judgeResult.success || judgeResult.correct)" class="wrong-box">
            <p v-if="judgeResult.error_reason">错误原因：{{ judgeResult.error_reason }}</p>
            <p v-if="judgeResult.error_line">错误位置：{{ judgeResult.error_line }}</p>
            <p v-if="judgeResult.suggestion">修改建议：{{ judgeResult.suggestion }}</p>
            <p v-if="judgeResult.guide_question" class="guide">
              💡 引导思考：{{ judgeResult.guide_question }}
            </p>
          </div>
          
          <div v-if="judgeResult.message" class="result-message">
            <strong>AI反馈:</strong>
            <p>{{ judgeResult.message }}</p>
          </div>
          
          <!-- 详细调试信息 -->
          <div v-if="judgeResult" class="debug-info-section">
            <h5>🔍 详细判题信息</h5>
            <div class="debug-row">
              <span class="debug-label">通过状态:</span>
              <!-- 兼容 correct 和 success 字段 -->
              <span class="debug-value" :class="{'success': judgeResult.success || judgeResult.correct, 'failure': !(judgeResult.success || judgeResult.correct)}">
                {{ (judgeResult.success || judgeResult.correct) ? '✓ 通过' : '✗ 未通过' }}
              </span>
            </div>
            <div v-if="judgeResult.execution_time" class="debug-row">
              <span class="debug-label">执行时间:</span>
              <span class="debug-value">{{ judgeResult.execution_time }}ms</span>
            </div>
            <div v-if="judgeResult.memory_used" class="debug-row">
              <span class="debug-label">内存使用:</span>
              <span class="debug-value">{{ judgeResult.memory_used }}KB</span>
            </div>
            <details class="debug-details">
              <summary>📋 查看完整响应数据 (点击展开)</summary>
              <pre class="debug-json">{{ JSON.stringify(judgeResult, null, 2) }}</pre>
            </details>
          </div>
          
          <div v-if="judgeResult.execution_time" class="execution-info">
            <strong>执行时间:</strong> {{ judgeResult.execution_time }}ms
          </div>
          
          <div v-if="judgeResult.memory_used" class="execution-info">
            <strong>内存使用:</strong> {{ judgeResult.memory_used }}KB
          </div>
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoadingProblem" class="loading">
      正在加载题目...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'

// 获取路由参数和路由器实例
const route = useRoute()
const router = useRouter()

// 响应式数据
const problemId = ref(null)
const problem = ref(null)
const selectedLanguage = ref('python3')
const userNotes = ref('')
const sourceCode = ref('// 在这里编写您的代码...')
const isSubmitting = ref(false)
const judgeResult = ref(null)
const errorMessage = ref('')
const isLoadingProblem = ref(false)

onMounted(async () => {
  // 检查认证状态
  if (!checkAuth()) {
    sessionStorage.setItem('redirectAfterLogin', route.fullPath)
    router.push('/login')
    return
  }

  // 从路由参数获取题目ID
  problemId.value = route.params.problemId || route.query.problemId
  
  if (problemId.value) {
    await loadProblem(problemId.value)
  }
})

// 认证检查
function checkAuth() {
  const token = localStorage.getItem('token') || localStorage.getItem('jwt_token')
  return !!token
}

// 返回主页面
function goBackToMain() {
  router.push('/main')
}

// 加载题目信息
async function loadProblem(id) {
  try {
    isLoadingProblem.value = true
    const response = await request.get(`/api/leetcode/problems/${id}/`)
    problem.value = response.data
  } catch (error) {
    console.error('加载题目失败:', error)
    errorMessage.value = '无法加载题目信息，请稍后重试'
  } finally {
    isLoadingProblem.value = false
  }
}

// 提交代码进行判题
async function submitCode() {
  // 再次检查认证状态
  if (!checkAuth()) {
    sessionStorage.setItem('redirectAfterLogin', route.fullPath)
    router.push('/login')
    return
  }

  if (!problemId.value) {
    errorMessage.value = '请先选择一个题目'
    return
  }

  if (!sourceCode.value.trim()) {
    errorMessage.value = '请先编写代码'
    return
  }

  isSubmitting.value = true
  judgeResult.value = null
  errorMessage.value = ''

  try {
    const requestBody = {
      problem_id: parseInt(problemId.value),
      source_code: sourceCode.value,
      language: selectedLanguage.value,
      notes: userNotes.value.trim() || undefined
    }

    const response = await request.post('/api/ai/judge/submit-and-complete/', requestBody)
    const resultData = response.data || response
    
    // 在控制台打印完整响应，方便调试
    console.log('=== 判题完整响应数据 ===')
    console.log('响应数据:', resultData)
    console.log('所有字段:', Object.keys(resultData))
    
    judgeResult.value = resultData
    errorMessage.value = ''
  } catch (error) {
    console.error('提交判题失败:', error)
    if (error.response?.data?.detail) {
      errorMessage.value = error.response.data.detail
    } else if (error.response?.status === 401) {
      // Token过期，重定向到登录页
      localStorage.removeItem('token')
      localStorage.removeItem('jwt_token')
      sessionStorage.setItem('redirectAfterLogin', route.fullPath)
      router.push('/login')
    } else {
      errorMessage.value = '提交判题失败，请稍后重试'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.ai-judge-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
}

.judge-header {
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

.judge-header h2 {
  margin: 0;
  color: #333;
}

.judge-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #f8f9fa;
}

.problem-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.problem-info h3 {
  margin-top: 0;
  color: #333;
  margin-bottom: 16px;
}

.problem-description {
  line-height: 1.6;
  color: #555;
}

.language-selector {
  margin-bottom: 24px;
}

.language-selector label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.language-selector select {
  width: 200px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.notes-section {
  margin-bottom: 24px;
}

.notes-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.notes-section textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
}

.code-editor-section {
  margin-bottom: 24px;
}

.code-editor-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.code-textarea {
  width: 100%;
  height: 400px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  resize: vertical;
  font-size: 14px;
}

.submit-section {
  text-align: center;
  margin-bottom: 24px;
}

.submit-button {
  padding: 12px 32px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: #337ecc;
}

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.judge-result {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.judge-result h4 {
  margin-top: 0;
  color: #333;
  margin-bottom: 16px;
}

.result-success {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #e6f4ea;
  padding: 12px;
  border-radius: 4px;
  color: #137333;
  font-weight: bold;
}

.result-failure {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fce8e6;
  padding: 12px;
  border-radius: 4px;
  color: #c5221f;
  font-weight: bold;
}

.success-icon, .failure-icon {
  font-size: 18px;
}

.result-message {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.result-message p {
  margin: 8px 0 0 0;
  line-height: 1.5;
}

.wrong-box {
  margin-top: 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  padding: 10px 12px;
  color: #a8071a;
}

.wrong-box p {
  margin: 6px 0;
}

.wrong-box .guide {
  margin-top: 8px;
  color: #ad4e00;
  font-weight: 600;
}

/* 调试信息区域样式 */
.debug-info-section {
  margin-top: 20px;
  padding: 16px;
  background: #f0f8ff;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.debug-info-section h5 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
}

.debug-row {
  display: flex;
  margin-bottom: 8px;
  align-items: center;
}

.debug-label {
  font-weight: bold;
  min-width: 80px;
  color: #555;
}

.debug-value {
  color: #333;
}

.debug-value.success {
  color: #52c41a;
  font-weight: bold;
}

.debug-value.failure {
  color: #f56c6c;
  font-weight: bold;
}

.debug-details {
  margin-top: 12px;
  border-top: 1px solid #e0e0e0;
  padding-top: 12px;
}

.debug-details summary {
  cursor: pointer;
  font-weight: bold;
  color: #409eff;
  padding: 4px 0;
}

.debug-details summary:hover {
  text-decoration: underline;
}

.debug-json {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  max-height: 400px;
  overflow-y: auto;
  margin-top: 8px;
  border: 1px solid #e0e0e0;
}

.execution-info {
  margin-top: 8px;
  color: #666;
}

.error-message {
  background: #fce8e6;
  color: #c5221f;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 24px;
  border-left: 4px solid #c5221f;
}

.loading {
  text-align: center;
  padding: 24px;
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .ai-judge-container {
    padding: 0;
  }
  
  .judge-header {
    padding: 12px 16px;
  }
  
  .judge-content {
    padding: 16px;
  }
  
  .code-textarea {
    height: 300px;
  }
  
  .language-selector select {
    width: 100%;
  }
}
</style>
