<template>
  <div class="problem-detail">
    <div class="problem-header">
      <div class="header-top">
        <!-- 确保按钮始终可见 -->
        <button class="back-button" @click="$router.push('/main')">
          ← 返回主页面
        </button>
      </div>
      <h1 class="problem-title">{{ problem.title }}</h1>
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


<style scoped>
.header-top {
  margin-bottom: 15px;
  display: flex; /* 使用flex布局 */
  justify-content: space-between; /* 按钮与标题等元素左右对齐 */
}

.back-button {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  opacity: 1; /* 确保按钮不透明 */
  min-width: 120px; /* 增加按钮最小宽度 */
}

/* 防止其他元素遮挡按钮 */
.header-top {
  position: relative;
  z-index: 10; /* 提高层级 */
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
    min-width: 100px; /* 小屏幕时调整按钮最小宽度 */
  }
}
</style>