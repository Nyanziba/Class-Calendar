import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, copyFileSync } from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // SPA fallback plugin for Cloudflare Pages
    {
      name: 'spa-fallback',
      closeBundle() {
        // Copy index.html to 404.html for SPA routing
        const distDir = resolve(__dirname, 'dist')
        try {
          copyFileSync(resolve(distDir, 'index.html'), resolve(distDir, '404.html'))
          console.log('Created 404.html for SPA routing')
        } catch (error) {
          console.warn('Could not create 404.html:', error.message)
        }
      }
    }
  ],
  base: '/', // Cloudflare Pages uses root path
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['html2canvas']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})
