import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000', // 프록시 설정을 통해 로컬 백엔드(uvicorn) 우회 연결 
    },                                // 즉 , 브라우저는 5173(페이지)에만 요청하고, vite가 뒤에서 8000으로 대신 보내주니까 CORS 제약 X 
  },
})
