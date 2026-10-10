import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

import { whatsappApiPlugin } from './server/whatsappPlugin'

const DEFAULT_API_TARGET = 'https://mediplan-api.appsline.com.mx'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '')
  const apiTarget = env.VITE_API_PROXY_TARGET?.trim() || DEFAULT_API_TARGET

  // `/api` se reenvía al backend de MediPlan (sin CORS en el navegador).
  // Las rutas locales de WhatsApp (`/api/whatsapp/*`) se sirven en este servidor.
  const apiProxy: Record<string, ProxyOptions> = {
    '/api': {
      target: apiTarget,
      changeOrigin: true,
      secure: true,
      bypass(req) {
        if (req.url?.startsWith('/api/whatsapp')) return req.url
        return undefined
      },
    },
  }

  return {
    plugins: [react(), tailwindcss(), whatsappApiPlugin(env)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
      proxy: apiProxy,
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      allowedHosts: true,
      proxy: apiProxy,
    },
  }
})
