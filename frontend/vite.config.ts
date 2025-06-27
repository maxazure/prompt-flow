/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom', 
    setupFiles: './src/test/setup.ts',
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Monaco Editor 单独分块
          'monaco-editor': ['@monaco-editor/react', 'monaco-editor'],
          // React 核心库分块
          'react-vendor': ['react', 'react-dom'],
          // 路由库分块
          'router': ['react-router-dom'],
          // UI组件库分块
          'charts': ['recharts'],
          // 工具库分块
          'utils': ['axios']
        }
      }
    },
    // 调整chunk大小警告阈值
    chunkSizeWarningLimit: 600
  }
})
