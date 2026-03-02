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
      <!-- 右侧留空，用于后续扩展 -->
    </div>
  </div>
</template>

<script>
import request from '@/utils/request';

export default {
  name: 'ProblemDetail',
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
      currentIndex: -1 // 当前题目在列表中的索引
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
  },
  methods: {
    async fetchProblemDetail() {
      try {
        const response = await request.get(`/leetcode/problems/${this.problemId}/`);
        this.problem = response.data.problem || response.data;
      } catch (error) {
        console.error('获取题目详情失败:', error);
      }
    },
    async fetchProblemList() {
      try {
        // 获取题目列表，根据项目规范，API可能直接返回数组
        const response = await request.get('/leetcode/problems/');
        // 处理不同的API响应格式
        this.problemList = Array.isArray(response.data) ? response.data : 
                         (response.data.problems || response.data.results || []);
        
        // 找到当前题目的索引，注意类型转换（problemId可能是数字，API返回的可能是字符串）
        this.currentIndex = this.problemList.findIndex(p => 
          Number(p.problem_id) === Number(this.problemId)
        );
        
        // 调试信息
        console.log('题目列表长度:', this.problemList.length);
        console.log('当前题目ID:', this.problemId, '当前索引:', this.currentIndex);
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
}
</style>