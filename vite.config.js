import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

/**
 * `base` differs between the two ways this project runs.
 *
 * In development Vite serves the app at the root of localhost:5173 and proxies
 * /api to Apache, so the base is '/'. A production build is served by Apache
 * from htdocs/pawsandfound/ alongside the API, so every asset and API path has
 * to be prefixed with that folder — otherwise the built page asks for
 * /assets/... and /api/... at the domain root, where nothing answers.
 *
 * https://vite.dev/config/
 */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/pawsandfound/' : '/',

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
}))
