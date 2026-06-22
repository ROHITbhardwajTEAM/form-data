import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ccare-api': {
        target: 'https://mobileapp.c-care.mu:14443',
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/ccare-api/, '/API/API/APIdigitalregistration'),
      }
    }
  }
})