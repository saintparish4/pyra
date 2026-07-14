import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Basic app-shell precaching only. The offline draft queue (background
      // sync against Dexie) is Phase 4 — see README roadmap.
      manifest: {
        name: 'Pyra',
        short_name: 'Pyra',
        description: 'Free, self-hostable records management for fire departments',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
})
