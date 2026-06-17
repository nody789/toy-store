import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 開發時把 /api/* 轉發到後端，避免 CORS 問題
      '/api': 'http://localhost:3001',
    },
  },
})
