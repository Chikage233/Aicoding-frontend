<template>
  <div class="code-runner-container">
    <div class="header">
      <h2>代码运行器</h2>
      <div class="quick-run-options">
        <button @click="switchToQuickRun" :class="{ active: runMode === 'quick' }">快速运行</button>
        <button @click="switchToAdvancedRun" :class="{ active: runMode === 'advanced' }">高级选项</button>
      </div>
    </div>
    
    <div class="main-content">
      <!-- 左侧：代码编辑和输入区域 -->
      <div class="left-panel">
        <div class="panel-section">
          <label for="language-select">编程语言:</label>
          <select id="language-select" v-model="selectedLanguage" @change="onLanguageChange">
            <option value="">请选择语言</option>
            <option v-for="lang in availableLanguages" :key="lang.id" :value="lang.name">
              {{ lang.name }}
            </option>
          </select>
        </div>
        
        <div class="panel-section">
          <label>源代码:</label>
          <textarea 
            v-model="sourceCode" 
            placeholder="请输入您的代码..."
            class="code-editor"
          ></textarea>
        </div>
        
        <div class="panel-section">
          <label>标准输入 (stdin):</label>
          <textarea 
            v-model="stdin" 
            placeholder="可选：输入测试数据..."
            class="input-editor"
          ></textarea>
        </div>
        
        <div v-if="runMode === 'advanced'" class="panel-section">
          <label>期望输出 (可选):</label>
          <textarea 
            v-model="expectedOutput" 
            placeholder="可选：用于验证答案正确性..."
            class="input-editor"
          ></textarea>
        </div>
        
        <div v-if="runMode === 'advanced'" class="advanced-options">
          <div class="option-row">
            <label>CPU时间限制 (秒):</label>
            <input type="number" v-model.number="cpuTimeLimit" min="0.1" max="30" step="0.1">
          </div>
          <div class="option-row">
            <label>内存限制 (KB):</label>
            <input type="number" v-model.number="memoryLimit" min="1000" max="512000" step="1000">
          </div>
        </div>
        
        <button @click="runCode" :disabled="isRunning" class="run-button">
          {{ isRunning ? '运行中...' : '运行代码' }}
        </button>
      </div>
      
      <!-- 右侧：运行结果区域 -->
      <div class="right-panel">
        <div class="result-section">
          <h3>运行结果</h3>
          <div v-if="executionResult" class="result-content">
            <div class="result-item">
              <strong>状态:</strong> 
              <span :class="getStatusClass(executionResult.status?.id)">
                {{ executionResult.status?.description || '未知状态' }}
              </span>
            </div>
            
            <div class="result-item" v-if="executionResult.stdout">
              <strong>标准输出:</strong>
              <pre class="output">{{ executionResult.stdout }}</pre>
            </div>
            
            <div class="result-item" v-if="executionResult.stderr">
              <strong>标准错误:</strong>
              <pre class="error">{{ executionResult.stderr }}</pre>
            </div>
            
            <div class="result-item" v-if="executionResult.compile_output">
              <strong>编译输出:</strong>
              <pre class="error">{{ executionResult.compile_output }}</pre>
            </div>
            
            <div class="result-item" v-if="executionResult.time">
              <strong>执行时间:</strong> {{ executionResult.time }} 秒
            </div>
            
            <div class="result-item" v-if="executionResult.memory">
              <strong>内存使用:</strong> {{ executionResult.memory }} KB
            </div>
            
            <div class="result-item" v-if="executionResult.message">
              <strong>消息:</strong> {{ executionResult.message }}
            </div>
          </div>
          
          <div v-else-if="isRunning" class="loading">
            正在执行代码...
          </div>
          
          <div v-else class="no-result">
            点击"运行代码"按钮开始执行
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-runner-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  color: #333;
  font-size: 24px;
  margin: 0;
}

.quick-run-options {
  display: flex;
  gap: 10px;
}

.quick-run-options button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background-color: #f5f5f5;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.quick-run-options button.active {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.main-content {
  display: flex;
  gap: 20px;
  min-height: 600px;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.panel-section label {
  font-weight: bold;
  color: #333;
}

.panel-section select,
.panel-section textarea,
.option-row input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.option-row label {
  min-width: 120px;
}

.code-editor,
.input-editor {
  min-height: 120px;
  resize: vertical;
}

.advanced-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.run-button {
  padding: 12px 24px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.run-button:hover:not(:disabled) {
  background-color: #337ecc;
}

.run-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.result-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  background-color: #f9f9f9;
}

.result-section h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.result-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.result-item strong {
  color: #333;
}

.output,
.error {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
}

.error {
  background-color: #ffebee;
  color: #c62828;
}

.loading,
.no-result {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-style: italic;
}

/* 状态颜色 */
.status-accepted {
  color: #67c23a;
  font-weight: bold;
}

.status-wrong,
.status-compile-error,
.status-runtime-error,
.status-timeout {
  color: #f56c6c;
  font-weight: bold;
}

.status-queued,
.status-processing {
  color: #e6a23c;
  font-weight: bold;
}

.status-unknown {
  color: #909399;
}
</style>