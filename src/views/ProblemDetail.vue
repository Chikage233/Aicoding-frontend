<template>
  <div class="problem-detail-container">
    <!-- 题目头部信息 -->
    <div class="problem-header">
      <h1 class="problem-title">{{ problem.title }}</h1>
      <div class="problem-meta">
        <span>编号: {{ problem.problem_id }}</span>
        <span>难度: {{ getDifficultyText(problem.difficulty) }}</span>
        <span>通过率: {{ problem.acceptance_rate }}%</span>
      </div>
      <div class="problem-slug">
        <span>Slug: {{ problem.slug }}</span>
      </div>
    </div>

    <!-- 标签区域 -->
    <div class="problem-tags-inline">
      <span v-for="tag in problem.tags" :key="tag">{{ tag }}</span>
    </div>

    <!-- 题目描述 -->
    <div class="problem-description" style="max-height: calc(100vh - 200px); overflow-y: auto;">
      <p>{{ problem.description }}</p>
    </div>

    <!-- 代码编辑器区域 -->
    <div class="code-editor-container" style="height: 100%; overflow-y: auto;">
      <pre><code>{{ codeSnippet }}</code></pre>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProblemDetail',
  data() {
    return {
      problem: {
        title: '',
        problem_id: '',
        difficulty: '',
        acceptance_rate: 0,
        tags: [],
        description: '',
        slug: '' // 新增slug属性
      },
      codeSnippet: ''
    }
  },
  methods: {
    getDifficultyText(difficulty) {
      const map = {
        'easy': '简单',
        'medium': '中等',
        'hard': '困难'
      }
      return map[difficulty] || difficulty
    }
  },
  mounted() {
    // 模拟获取问题数据
    this.problem = {
      title: '示例题目',
      problem_id: '12345',
      difficulty: 'medium',
      acceptance_rate: 50,
      tags: ['数组', '排序'],
      description: '这是一个示例题目描述，用于展示如何正确显示问题详情。',
      slug: 'example-problem' // 示例slug值
    }
    this.codeSnippet = `function solution() {\n  // 您的代码\n}`
  }
}
</script>

<style scoped>
.problem-detail-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #fff;
}

.problem-header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.problem-title {
  font-size: 2em; /* 加大字体 */
  font-weight: bold; /* 加粗字体 */
  text-align: left; /* 左对齐 */
}

.problem-meta {
  margin-top: 10px;
  color: #666;
}

.problem-slug {
  margin-top: 10px;
  color: #666;
}

.problem-tags-inline {
  display: inline-flex;
  gap: 8px;
  margin: 10px 0;
}

.problem-tags-inline span {
  background-color: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.problem-description {
  padding: 20px;
  flex: 1;
  min-height: 0;
  border-bottom: 1px solid #ddd;
}

.code-editor-container {
  padding: 20px;
  flex: 1;
  min-height: 0;
  background-color: #f8f9fa;
}

.code-editor-container pre {
  margin: 0;
  background-color: #fff;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .problem-detail-container {
    padding: 10px;
  }

  .problem-header {
    padding: 10px;
  }

  .problem-meta {
    font-size: 12px;
  }

  .problem-tags-inline {
    flex-wrap: wrap;
  }

  .problem-description {
    padding: 10px;
  }

  .code-editor-container {
    padding: 10px;
  }
}
</style>