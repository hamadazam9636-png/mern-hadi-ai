import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Apne Express server ka port rakhein
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
