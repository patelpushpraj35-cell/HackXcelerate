import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/outputs': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
      '/heatmaps': 'http://localhost:8000',
      '/frames': 'http://localhost:8000',
    }
  }
})
