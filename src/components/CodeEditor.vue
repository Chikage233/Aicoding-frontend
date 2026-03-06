<template>
  <div class="code-editor-container">
    <div class="header">
      <h3>代码编辑器</h3>
    </div>
    
    <div class="editor-content">
      <!-- 语言选择 -->
      <div class="language-select">
        <label for="lang-select">语言:</label>
        <select id="lang-select" v-model="selectedLanguage" @change="onLanguageChange">
          <option value="">请选择语言</option>
          <option v-for="lang in availableLanguages" :key="lang.id" :value="lang.name">
            {{ lang.name }}
          </option>
        </select>
      </div>
      
      <!-- 代码编辑区域 -->
      <div class="code-area">
        <textarea 
          v-model="sourceCode" 
          placeholder="请输入您的代码..."
          class="code-input"
        ></textarea>
      </div>
      
      <!-- 输入区域 -->
      <div class="input-area">
        <label>输入:</label>
        <textarea 
          v-model="stdin" 
          placeholder="标准输入 (可选)..."
          class="input-textarea"
        ></textarea>
      </div>
      
      <!-- 运行按钮 -->
      <button @click="runCode" :disabled="isRunning" class="run-btn">
        {{ isRunning ? '运行中...' : '运行代码' }}
      </button>
      
      <!-- 结果区域 -->
      <div class="result-area" v-if="executionResult || isRunning">
        <h4>运行结果</h4>
        <div v-if="isRunning" class="loading">正在执行...</div>
        <div v-else class="result-content">
          <div class="status-line">
            <strong>状态:</strong>
            <span :class="getStatusClass(executionResult.status?.id)">
              {{ executionResult.status?.description || '未知' }}
            </span>
          </div>
          
          <div v-if="executionResult.stdout" class="output-section">
            <strong>输出:</strong>
            <pre>{{ executionResult.stdout }}</pre>
          </div>
          
          <div v-if="executionResult.stderr" class="error-section">
            <strong>错误:</strong>
            <pre>{{ executionResult.stderr }}</pre>
          </div>
          
          <div v-if="executionResult.compile_output" class="error-section">
            <strong>编译错误:</strong>
            <pre>{{ executionResult.compile_output }}</pre>
          </div>
          
          <div v-if="executionResult.time || executionResult.memory" class="stats">
            <span v-if="executionResult.time">时间: {{ executionResult.time }}s</span>
            <span v-if="executionResult.memory">内存: {{ executionResult.memory }}KB</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'CodeEditor',
  props: {
    problemId: {
      type: [Number, String],
      required: false,
      default: null
    }
  },
  data() {
    return {
      selectedLanguage: '',
      sourceCode: '// 请输入您的代码\nconsole.log("Hello World");',
      stdin: '',
      availableLanguages: [],
      executionResult: null,
      isRunning: false
    }
  },
  async mounted() {
    await this.loadLanguages()
    // 如果有题目ID，可以预设一些默认代码
    if (this.problemId) {
      this.setProblemTemplate()
    }
  },
  methods: {
    async loadLanguages() {
      try {
        const response = await request.get('/judge0/languages/')
        if (response.code === 200) {
          this.availableLanguages = response.data.languages || []
          if (this.availableLanguages.length > 0 && !this.selectedLanguage) {
            this.selectedLanguage = this.availableLanguages[0].name
            this.setLanguageTemplate()
          }
        }
      } catch (error) {
        console.error('加载语言失败:', error)
        // 提供基本语言支持
        this.availableLanguages = [
          { id: 71, name: 'Python 3.8.1' },
          { id: 62, name: 'Java 11.0.6' },
          { id: 54, name: 'C++ (GCC 9.2.0)' },
          { id: 50, name: 'C (GCC 9.2.0)' },
          { id: 63, name: 'JavaScript (Node.js 12.14.0)' }
        ]
        this.selectedLanguage = 'Python 3.8.1'
        this.setLanguageTemplate()
      }
    },
    
    onLanguageChange() {
      this.setLanguageTemplate()
    },
    
    setLanguageTemplate() {
      const language = this.availableLanguages.find(lang => lang.name === this.selectedLanguage)
      if (!language) return
      
      if (language.name.includes('Python')) {
        this.sourceCode = "print('Hello World')"
      } else if (language.name.includes('Java')) {
        this.sourceCode = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`
      } else if (language.name.includes('C++')) {
        this.sourceCode = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World" << endl;
    return 0;
}`
      } else if (language.name.includes('C')) {
        this.sourceCode = `#include <stdio.h>

int main() {
    printf("Hello World\\n");
    return 0;
}`
      } else if (language.name.includes('JavaScript')) {
        this.sourceCode = 'console.log("Hello World");'
      } else {
        this.sourceCode = '// 请输入您的代码\nconsole.log("Hello World");'
      }
    },
    
    setProblemTemplate() {
      // 可以根据题目ID设置特定的模板代码
      // 这里暂时使用通用模板
      this.setLanguageTemplate()
    },
    
    async runCode() {
      if (!this.selectedLanguage || !this.sourceCode.trim()) {
        this.$message?.error('请选择语言并输入代码')
        return
      }
      
      const selectedLang = this.availableLanguages.find(lang => lang.name === this.selectedLanguage)
      if (!selectedLang) {
        this.$message?.error('无效的语言')
        return
      }
      
      this.isRunning = true
      this.executionResult = null
      
      try {
        const requestData = {
          source_code: this.sourceCode,
          language_id: selectedLang.id,
          stdin: this.stdin || ''
        }
        
        const response = await request.post('/judge0/submit/', requestData)
        if (response.code === 200) {
          this.executionResult = response.data
        }
      } catch (error) {
        console.error('执行失败:', error)
        this.$message?.error('代码执行失败')
      } finally {
        this.isRunning = false
      }
    },
    
    getStatusClass(statusId) {
      switch (statusId) {
        case 3: return 'status-accepted'
        case 4: return 'status-wrong'
        case 5: return 'status-timeout'
        case 6: return 'status-compile-error'
        case 7: return 'status-runtime-error'
        default: return 'status-unknown'
      }
    }
  }
}
</script>

<style scoped>
.code-editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.header {
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
}

.header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
}

.language-select {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.language-select label {
  font-weight: bold;
  color: #333;
  min-width: 60px;
}

.language-select select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;
}

.code-area, .input-area {
  margin-bottom: 15px;
}

.code-area label, .input-area label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.code-input, .input-textarea {
  width: 100%;
  min-height: 120px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  resize: vertical;
}

.input-textarea {
  min-height: 60px;
}

.run-btn {
  padding: 10px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  align-self: flex-start;
  margin-bottom: 20px;
}

.run-btn:hover:not(:disabled) {
  background-color: #337ecc;
}

.run-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.result-area {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  background: #fff;
}

.result-area h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.loading {
  text-align: center;
  color: #666;
  font-style: italic;
}

.status-line {
  margin-bottom: 10px;
}

.status-line span {
  font-weight: bold;
}

.status-accepted {
  color: #67c23a;
}

.status-wrong,
.status-compile-error,
.status-runtime-error,
.status-timeout {
  color: #f56c6c;
}

.output-section, .error-section {
  margin: 10px 0;
}

.output-section pre, .error-section pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
  margin: 5px 0 0 0;
}

.error-section pre {
  background: #ffebee;
  color: #c62828;
}

.stats {
  display: flex;
  gap: 15px;
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}
</style>