import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

const TOKEN_BYPASS_PATTERNS = [
  /\/api\/auth\/captcha\/?$/i,
  /\/api\/auth\/jwt\/login\/?$/i,
  /\/api\/auth\/send-verification-code\/?$/i,
  /\/api\/auth\/verify-code\/?$/i,
  /\/api\/auth\/register-with-code\/?$/i
]

function shouldSkipTokenInjection(config = {}) {
  if (config.skipAuthTokenInjection) return true
  const url = String(config.url || '').split('?')[0]
  return TOKEN_BYPASS_PATTERNS.some((pattern) => pattern.test(url))
}

function removeAuthorizationHeader(headers) {
  if (!headers) return

  if (typeof headers.delete === 'function') {
    headers.delete('Authorization')
    headers.delete('authorization')
    return
  }

  delete headers.Authorization
  delete headers.authorization
}

service.interceptors.request.use(
  (config) => {
    if (shouldSkipTokenInjection(config)) {
      removeAuthorizationHeader(config.headers)
      return config
    }

    const token = localStorage.getItem('token')
    if (token) {
      if (!config.headers) config.headers = {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    ElMessage.error('请求出错，请稍后重试')
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    const res = response.data
    const skipGlobalErrorHandler = Boolean(response?.config?.skipGlobalErrorHandler)

    if (res == null) return res

    if (typeof res === 'object' && !Array.isArray(res)) {
      if (Object.prototype.hasOwnProperty.call(res, 'success') && res.success === false) {
        if (!skipGlobalErrorHandler) {
          ElMessage.error(res.msg || res.message || '请求失败')
        }
        return Promise.reject(res)
      }

      if (Object.prototype.hasOwnProperty.call(res, 'code')) {
        const codeNum = Number(res.code)
        if (!Number.isNaN(codeNum) && codeNum !== 200) {
          if (!skipGlobalErrorHandler) {
            ElMessage.error(res.msg || res.message || '请求失败')
          }
          return Promise.reject(res)
        }
      }
    }

    return res
  },
  (error) => {
    if (!error?.config?.skipGlobalErrorHandler) {
      ElMessage.error(error.message || '服务器错误')
    }
    return Promise.reject(error)
  }
)

export default service
