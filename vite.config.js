import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    // The React dev server and the PHP API are different origins during
    // development, which browsers block. Vite forwards anything starting with
    // /api to Apache, so the app can call '/api/reports' as though it were the
    // same server — which it will be once the built site is served by Apache.
    proxy: {
      '/api': {
        target: 'http://localhost/pawsandfound',
        changeOrigin: false, // keep the Origin header so PHP's CORS check sees it
      },
    },
  },
})
