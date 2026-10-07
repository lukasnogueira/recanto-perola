import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Prefixo de rota — usado no GitHub Pages (ex.: /recanto-perola/). Padrão: raiz.
  base: process.env.VITE_BASE || '/',
  resolve: process.env.VITEST
    ? {
        alias: {
          'virtual:pwa-register': new URL('./src/test/pwaStub.js', import.meta.url).pathname,
        },
      }
    : undefined,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Recanto Pérola — Pedidos e Caixa',
        short_name: 'Recanto Pérola',
        description: 'Sistema de pedidos e controle de caixa do Recanto Pérola',
        lang: 'pt-BR',
        theme_color: '#0E7C66',
        background_color: '#F7F5F0',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
})
