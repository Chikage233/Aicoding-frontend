import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // 必须和Django启动地址一致（不要写localhost）
        changeOrigin: true,              // 必须为true（解决跨域）
        rewrite: (path) => path.replace(/^\/api/, ''), // 去掉/api前缀
        followRedirects: true            // 新增：跟随Django的路径重定向
      }
    }
  }
})