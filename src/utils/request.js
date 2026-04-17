import axios from 'axios'
import { ElMessage } from 'element-plus' // 用 Element Plus 提示框

// 创建 Axios 实例
const service = axios.create({
  baseURL: '/api', // 匹配 Vite 代理前缀，转发到 Django
  timeout: 30000, // 请求超时时间（5秒）
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器：添加登录 Token（后续对接 Django 权限用）
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') // 从本地存 Token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    ElMessage.error('请求出错，请稍后重试')
    return Promise.reject(error)
  }
)

// 响应拦截器：统一处理后端返回结果
service.interceptors.response.use(
  (response) => {
    const res = response.data
    // 兼容多种成功返回：
    // 1) { code: 200, data: ... }
    // 2) 直接返回对象/数组（无 code 字段）
    // 3) JWT 登录返回 { access, refresh }
    if (res == null) return res

    if (typeof res === 'object' && !Array.isArray(res)) {
      // 显式业务失败分支
      if (Object.prototype.hasOwnProperty.call(res, 'success') && res.success === false) {
        ElMessage.error(res.msg || res.message || '请求失败')
        return Promise.reject(res)
      }

      // 仅当后端给了 code 且明确不是成功时才拦截
      if (Object.prototype.hasOwnProperty.call(res, 'code')) {
        const codeNum = Number(res.code)
        if (!Number.isNaN(codeNum) && codeNum !== 200) {
          ElMessage.error(res.msg || res.message || '请求失败')
          return Promise.reject(res)
        }
      }
    }

    return res
  },
  (error) => {
    ElMessage.error(error.message || '服务器错误')
    return Promise.reject(error)
  }
)

export default service
