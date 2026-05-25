import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "@svgr/rollup";
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    svgr(),
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'manifest.json',
      includeAssets: ['stathmos.svg', 'maskable_icon.png'],
      devOptions: {
        enabled: true
      },
      manifest: {
        name: "Stathmos - Gestión de Taller",
        short_name: "Stathmos",
        description: "Sistema de gestión para taller mecánico",
        theme_color: "#1a1a1a",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "maskable_icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
})