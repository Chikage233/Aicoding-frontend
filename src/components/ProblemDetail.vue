<template>
  <div class="problem-detail">
    <div class="problem-header">
      <div class="header-top">
        <div class="header-flex">
          <button class="back-button" @click="$router.push('/main')">
            ← 返回主页面
          </button>
          <h1 class="problem-title">{{ problem.title }}</h1>
        </div>
      </div>
      <div class="problem-info">
        <span :class="'difficulty-' + problem.difficulty">{{ problem.difficulty }}</span>
        <span class="acceptance-rate">通过率: {{ problem.acceptance_rate }}%</span>
        <span class="problem-id">ID: {{ problem.problem_id }}</span>
        <span class="problem-slug">Slug: {{ problem.title_slug }}</span>
      </div>
    </div>

    <div class="problem-content">
      <div class="problem-description" v-html="problem.content"></div>
      
      <div class="problem-tags" v-if="problem.tags && problem.tags.length">
        <h3>标签:</h3>
        <el-tag 
          v-for="tag in problem.tags" 
          :key="tag" 
          class="tag"
          type="info"
          size="small"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script>
import request from '@/utils/request';
import { ElTag } from 'element-plus';

export default {
  name: 'ProblemDetail',
  props: {
    problemId: {
      type: Number,
      required: true
    }
  },
  components: {
    ElTag
  },
  data() {
    return {
      problem: {
        problem_id: null,
        title: '',
        title_slug: '',
        difficulty: '',
        is_premium: false,
        content: '',
        acceptance_rate: 0,
        tags: [],
        url: ''
      }
    };
  },
  async mounted() {
    await this.fetchProblemDetail();
  },
  methods: {
    async fetchProblemDetail() {
      try {
        const response = await request.get(`/leetcode/problems/${this.problemId}/`);
        this.problem = response.data.problem || response.data;
        
        // 确保难度字段格式正确
        if (this.problem.difficulty === 'easy' || this.problem.difficulty === 1) {
          this.problem.difficulty = '简单';
        } else if (this.problem.difficulty === 'medium' || this.problem.difficulty === 2) {
          this.problem.difficulty = '中等';
        } else if (this.problem.difficulty === 'hard' || this.problem.difficulty === 3) {
          this.problem.difficulty = '困难';
        }
      } catch (error) {
        console.error('获取题目详情失败:', error);
        // 可以在这里添加错误处理，比如显示错误信息或者重定向回主页面
      }
    }
  },
  watch: {
    // 如果problemId发生变化，则重新获取题目详情
    problemId: {
      async handler(newId) {
        await this.fetchProblemDetail();
      },
      immediate: true
    }
  }
};
</script>

<style scoped>
.problem-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  background: #fff;
  min-height: 100vh;
}

.problem-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.header-top {
  margin-bottom: 15px;
}

.header-flex {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-button {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0; /* 防止按钮在空间不足时被压缩 */
  z-index: 10; /* 确保按钮层级足够高 */
}

.back-button:hover {
  background-color: #2a6bd1;
}

.problem-title {
  font-size: 24px;
  margin: 0;
  color: #333;
  flex: 1; /* 标题占据剩余空间 */
}

.problem-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
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

.acceptance-rate {
  background-color: #f0f0f0;
  color: #666;
}

.problem-id {
  background-color: #e6f7ff;
  color: #1890ff;
}

.problem-slug {
  background-color: #f9f0ff;
  color: #722ed1;
}

.problem-content {
  margin-bottom: 30px;
}

.problem-description {
  line-height: 1.6;
  font-size: 16px;
  margin-bottom: 30px;
}

.problem-description :deep(p) {
  margin-bottom: 1em;
  line-height: 1.7;
}

.problem-description :deep(h2), 
.problem-description :deep(h3) {
  margin-top: 1.5em;
  margin-bottom: 1em;
}

.problem-description :deep(pre) {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
}

.problem-description :deep(code) {
  font-family: monospace;
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
}

.problem-description :deep(blockquote) {
  border-left: 4px solid #ddd;
  padding-left: 16px;
  color: #666;
  margin: 1em 0;
}

.problem-tags {
  margin: 25px 0;
}

.problem-tags h3 {
  margin-bottom: 10px;
  color: #333;
}

.tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .problem-detail {
    padding: 15px;
  }
  
  .problem-header {
    padding-bottom: 15px;
  }
  
  .problem-title {
    font-size: 20px;
  }
  
  .problem-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .back-button {
    font-size: 13px;
    padding: 6px 12px;
  }
  
  .header-flex {
    flex-direction: row;
    align-items: flex-start;
  }
}
</style>