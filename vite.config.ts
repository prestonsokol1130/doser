import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'doser',
        short_name: 'doser',
        theme_color: '#090a0d',
        background_color: '#090a0d',
        display: 'standalone',
        orientation: 'portrait',
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})