import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/search': 'http://localhost:8000',
      '/recommend': 'http://localhost:8000',
      '/movie': 'http://localhost:8000',
    }
  }
})