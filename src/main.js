import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// 1. 引入 Element Plus 核心库和全局样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 2. 引入 Element Plus 所有图标（全局可用，不用单独导入）
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
// 3. 全局注册 Element Plus 组件
app.use(ElementPlus)
// 4. 全局注册所有图标（比如 <el-icon><User /></el-icon> 直接用）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
// 5. 使用路由
app.use(router)

app.mount('#app')