import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { adminApiPlugin } from './vite-plugins/admin-api.ts'

export default defineConfig({
  plugins: [
    react(),
    adminApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg'],
      manifest: {
        name: '40KSim',
        short_name: '40KSim',
        description: 'Simulador local de combates de Warhammer 40,000.',
        theme_color: '#20291f',
        background_color: '#f3f1e8',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{css,html,ico,js,json,svg}'],
      },
    }),
  ],
})
