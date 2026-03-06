<template>
  <div class="problem-management-page">
    <div class="page-header">
      <h1>题目管理</h1>
      <div class="header-actions">
        <el-button @click="goBack" type="primary">返回控制台</el-button>
        <el-button @click="openAddProblemDialog" type="success" icon="Plus">添加题目</el-button>
        <!-- 批量删除按钮 -->
        <el-button 
          @click="batchDeleteProblems" 
          type="danger" 
          :disabled="selectedProblems.length === 0"
          icon="Delete"
          v-if="selectedProblems.length > 0"
        >
          批量删除 ({{ selectedProblems.length }})
        </el-button>
      </div>
    </div>
    
    <!-- 搜索和筛选区域 -->
    <div class="search-section">
      <el-input 
        v-model="searchQuery" 
        placeholder="搜索题目名称或ID" 
        clearable
        style="width: 300px;"
        @input="handleSearch"
      />
      <el-select 
        v-model="difficultyFilter" 
        placeholder="筛选难度" 
        clearable
        style="width: 120px; margin-left: 10px;"
      >
        <el-option label="简单" value="easy"></el-option>
        <el-option label="中等" value="medium"></el-option>
        <el-option label="困难" value="hard"></el-option>
      </el-select>
    </div>
    
    <!-- 题目统计 -->
    <div class="stats-summary">
      <div class="stat-item">
        <span class="stat-label">总题目数:</span>
        <span class="stat-value">{{ problems.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">简单题目:</span>
        <span class="stat-value">{{ easyCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">中等题目:</span>
        <span class="stat-value">{{ mediumCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">困难题目:</span>
        <span class="stat-value">{{ hardCount }}</span>
      </div>
    </div>
    
    <!-- 题目表格 -->
    <div class="problems-table-container">
      <el-table
        :data="paginatedProblems"
        style="width: 100%"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <!-- 批量选择复选框列 -->
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="problem_id" label="编号" width="80" sortable></el-table-column>
        <el-table-column prop="title" label="题目名称" min-width="200">
          <template #default="scope">
            <span class="problem-title">{{ scope.row.title }}</span>
            <span v-if="scope.row.slug" class="problem-slug">({{ scope.row.slug }})</span>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="100">
          <template #default="scope">
            <el-tag 
              :type="getDifficultyType(scope.row.difficulty)" 
              size="small"
              effect="plain"
            >
              {{ getDifficultyText(scope.row.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="acceptance_rate" label="通过率" width="100">
          <template #default="scope">
            {{ (scope.row.acceptance_rate || 0).toFixed(2) }}%
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ scope.row.created_at ? formatDate(scope.row.created_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="editProblem(scope.row)"
              icon="Edit"
            >
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteProblem(scope.row)"
              icon="Delete"
              style="margin-left: 5px;"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页器 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          layout="total, prev, pager, next"
          :total="filteredProblems.length"
          @current-change="handlePageChange"
        />
      </div>
    </div>
    
    <!-- 添加/编辑题目对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="600px"
      @close="closeDialog"
    >
      <el-form 
        :model="currentProblem" 
        :rules="rules" 
        ref="problemForm" 
        label-width="100px"
      >
        <el-form-item label="题目ID" prop="problem_id">
          <el-input 
            v-model="currentProblem.problem_id" 
            :disabled="isEditing"
            placeholder="系统自动生成或手动指定"
          />
        </el-form-item>
        <el-form-item label="题目名称" prop="title">
          <el-input v-model="currentProblem.title" placeholder="请输入题目名称" />
        </el-form-item>
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="currentProblem.slug" placeholder="请输入题目slug" />
        </el-form-item>
        <el-form-item label="难度" prop="difficulty">
          <el-select v-model="currentProblem.difficulty" placeholder="请选择难度">
            <el-option label="简单" value="easy"></el-option>
            <el-option label="中等" value="medium"></el-option>
            <el-option label="困难" value="hard"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="通过率" prop="acceptance_rate">
          <el-input-number 
            v-model="currentProblem.acceptance_rate" 
            :min="0" 
            :max="100" 
            :precision="2"
            placeholder="请输入通过率"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            type="textarea" 
            v-model="currentProblem.description" 
            :rows="4"
            placeholder="请输入题目描述"
          />
        </el-form-item>
        <el-form-item v-if="isEditing" label="创建时间">
          <el-input 
            v-model="currentProblem.created_at" 
            readonly
            placeholder="创建时间"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveProblem" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/utils/request';

export default {
  name: 'ProblemManagement',
  setup() {
    const router = useRouter();
    
    // 题目数据
    const problems = ref([]);
    const searchQuery = ref('');
    const difficultyFilter = ref('');
    const currentPage = ref(1);
    const pageSize = ref(15);
    
    // 批量选择相关
    const selectedProblems = ref([]);
    
    // 对话框相关
    const dialogVisible = ref(false);
    const isEditing = ref(false);
    const currentProblem = ref({
      problem_id: '',
      title: '',
      slug: '',
      difficulty: 'easy',
      acceptance_rate: 0,
      description: ''
    });
    const saving = ref(false);
    
    // 表单引用
    const problemForm = ref(null);
    
    // 计算属性：过滤后的题目
    const filteredProblems = computed(() => {
      let filtered = problems.value;
      
      // 搜索过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(problem => 
          problem.title.toLowerCase().includes(query) || 
          (problem.problem_id && problem.problem_id.toString().includes(query)) ||
          (problem.slug && problem.slug.toLowerCase().includes(query))
        );
      }
      
      // 难度过滤
      if (difficultyFilter.value) {
        filtered = filtered.filter(problem => 
          problem.difficulty === difficultyFilter.value
        );
      }
      
      return filtered;
    });
    
    // 计算属性：分页后的题目
    const paginatedProblems = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return filteredProblems.value.slice(start, end);
    });
    
    // 难度统计
    const easyCount = computed(() => 
      problems.value.filter(p => p.difficulty === 'easy').length
    );
    const mediumCount = computed(() => 
      problems.value.filter(p => p.difficulty === 'medium').length
    );
    const hardCount = computed(() => 
      problems.value.filter(p => p.difficulty === 'hard').length
    );
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // 获取难度文本
    const getDifficultyText = (difficulty) => {
      if (difficulty === 'easy' || difficulty === 1) return '简单';
      if (difficulty === 'medium' || difficulty === 2) return '中等';
      if (difficulty === 'hard' || difficulty === 3) return '困难';
      return difficulty;
    };
    
    // 获取难度类型（用于Element Plus标签样式）
    const getDifficultyType = (difficulty) => {
      if (difficulty === 'easy' || difficulty === 1) return 'success';
      if (difficulty === 'medium' || difficulty === 2) return 'warning';
      if (difficulty === 'hard' || difficulty === 3) return 'danger';
      return '';
    };
    
    // 返回控制台
    const goBack = () => {
      router.push('/admin');
    };
    
    // 处理搜索
    const handleSearch = () => {
      currentPage.value = 1;
    };
    
    // 处理分页
    const handlePageChange = (page) => {
      currentPage.value = page;
    };
    
    // 处理批量选择变化
    const handleSelectionChange = (selection) => {
      selectedProblems.value = selection;
    };
    
    // 获取题目列表
    const fetchProblems = async () => {
      try {
        const response = await request.get('/leetcode/problems/');
        
        // 更健壮的数据提取逻辑
        let rawData = [];
        if (Array.isArray(response.data)) {
          // 如果直接返回数组
          rawData = response.data;
        } else if (response.data && Array.isArray(response.data.problems)) {
          // 如果在 problems 字段中
          rawData = response.data.problems;
        } else if (response.data && Array.isArray(response.data.results)) {
          // 如果在 results 字段中
          rawData = response.data.results;
        } else if (response.data) {
          // 其他可能的结构
          rawData = [response.data];
        }
        
        problems.value = rawData;
        
        // 转换难度值为标准格式
        problems.value = problems.value.map(problem => {
          let difficulty = problem.difficulty;
          if (difficulty === 1 || difficulty === '1') {
            difficulty = 'easy';
          } else if (difficulty === 2 || difficulty === '2') {
            difficulty = 'medium';
          } else if (difficulty === 3 || difficulty === '3') {
            difficulty = 'hard';
          }
          
          // 处理创建时间字段 - 支持多种可能的字段名
          let createdAt = problem.created_at || problem.create_time || problem.created_time || problem.creation_date || problem.date_created || '';
          
          return {
            ...problem,
            difficulty,
            acceptance_rate: parseFloat(problem.acceptance_rate) || 0,
            created_at: createdAt // 统一使用 created_at 字段名
          };
        });
      } catch (error) {
        console.error('获取题目列表失败:', error);
        problems.value = [];
      }
    };
    
    // 打开添加题目对话框
    const openAddProblemDialog = () => {
      isEditing.value = false;
      currentProblem.value = {
        problem_id: '',
        title: '',
        slug: '',
        difficulty: 'easy',
        acceptance_rate: 0,
        description: ''
      };
      dialogVisible.value = true;
      
      // 清除表单验证
      if (problemForm.value) {
        problemForm.value.clearValidate();
      }
    };
    
    // 编辑题目
    const editProblem = (problem) => {
      isEditing.value = true;
      currentProblem.value = {
        ...problem,
        acceptance_rate: parseFloat(problem.acceptance_rate) || 0
      };
      dialogVisible.value = true;
      
      // 清除表单验证
      if (problemForm.value) {
        problemForm.value.clearValidate();
      }
    };
    
    // 关闭对话框
    const closeDialog = () => {
      dialogVisible.value = false;
      if (problemForm.value) {
        problemForm.value.resetFields();
      }
    };
    
    // 删除题目
    const deleteProblem = async (problem) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除题目 "${problem.title}" 吗？此操作不可恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        // 发送删除请求
        await request.delete(`/leetcode/problems/${problem.problem_id}/`);
        
        // 从本地列表中移除
        problems.value = problems.value.filter(p => p.problem_id !== problem.problem_id);
        
        ElMessage.success('题目删除成功');
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除题目失败:', error);
          ElMessage.error('删除题目失败，请重试');
        }
      }
    };
    
    // 批量删除题目
    const batchDeleteProblems = async () => {
      if (selectedProblems.value.length === 0) return;
      
      try {
        await ElMessageBox.confirm(
          `确定要删除选中的 ${selectedProblems.value.length} 个题目吗？此操作不可恢复。`,
          '确认批量删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        // 获取要删除的题目ID列表
        const problemIdsToDelete = selectedProblems.value.map(p => p.problem_id);
        
        // 并行发送删除请求
        const deletePromises = problemIdsToDelete.map(id => 
          request.delete(`/leetcode/problems/${id}/`)
        );
        
        await Promise.all(deletePromises);
        
        // 从本地列表中移除已删除的题目
        problems.value = problems.value.filter(p => 
          !problemIdsToDelete.includes(p.problem_id)
        );
        
        // 清空选中状态
        selectedProblems.value = [];
        
        ElMessage.success(`成功删除 ${problemIdsToDelete.length} 个题目`);
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量删除题目失败:', error);
          ElMessage.error('批量删除题目失败，请重试');
        }
      }
    };
    
    // 保存题目
    const saveProblem = async () => {
      if (!problemForm.value) return;
      
      try {
        await problemForm.value.validate();
        saving.value = true;
        
        if (isEditing.value) {
          // 更新题目
          await request.put(`/leetcode/problems/${currentProblem.value.problem_id}/`, currentProblem.value);
          ElMessage.success('题目更新成功');
          
          // 更新本地数据
          const index = problems.value.findIndex(p => p.problem_id === currentProblem.value.problem_id);
          if (index !== -1) {
            problems.value[index] = { ...currentProblem.value };
          }
        } else {
          // 创建题目
          const response = await request.post('/leetcode/problems/', currentProblem.value);
          ElMessage.success('题目创建成功');
          
          // 添加到本地数据
          problems.value.push(response.data || currentProblem.value);
        }
        
        dialogVisible.value = false;
        if (problemForm.value) {
          problemForm.value.resetFields();
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('validate')) {
          // 表单验证错误，不显示额外错误消息
          return;
        }
        console.error('保存题目失败:', error);
        ElMessage.error('保存题目失败，请重试');
      } finally {
        saving.value = false;
      }
    };
    
    // 表单验证规则
    const rules = {
      title: [
        { required: true, message: '请输入题目名称', trigger: 'blur' }
      ],
      difficulty: [
        { required: true, message: '请选择难度', trigger: 'change' }
      ]
    };
    
    onMounted(() => {
      // 检查管理员权限
      const isAdmin = localStorage.getItem('is_admin') === 'true';
      const token = localStorage.getItem('token');
      
      if (!token || !isAdmin) {
        router.push('/main');
        return;
      }
      
      fetchProblems();
    });
    
    return {
      // 数据
      problems,
      searchQuery,
      difficultyFilter,
      currentPage,
      pageSize,
      selectedProblems,
      
      // 计算属性
      filteredProblems,
      paginatedProblems,
      easyCount,
      mediumCount,
      hardCount,
      
      // 对话框
      dialogVisible,
      isEditing,
      currentProblem,
      saving,
      problemForm,
      rules,
      
      // 方法
      formatDate,
      getDifficultyText,
      getDifficultyType,
      goBack,
      handleSearch,
      handlePageChange,
      handleSelectionChange,
      openAddProblemDialog,
      editProblem,
      closeDialog,
      deleteProblem,
      batchDeleteProblems,
      saveProblem,
      
      // 计算属性
      dialogTitle: computed(() => isEditing.value ? '编辑题目' : '添加题目')
    };
  }
};
</script>

<style scoped>
.problem-management-page {
  min-height: 100vh;
  background: #fff;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.page-header h1 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stats-summary {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-weight: 600;
  color: #555;
}

.stat-value {
  font-weight: bold;
  color: #333;
}

.problems-table-container {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.problem-title {
  font-weight: 600;
  color: #333;
}

.problem-slug {
  color: #666;
  font-size: 12px;
  margin-left: 5px;
}

.pagination-container {
  padding: 20px;
  text-align: center;
  background: #f8f9fa;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  
  .search-section {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .stats-summary {
    flex-wrap: wrap;
  }
  
  .stat-item {
    min-width: 120px;
  }
}
</style>