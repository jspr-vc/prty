import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/** Where the host server listens while developing. In production it is the same origin. */
const HOST_SERVER = `http://127.0.0.1:${process.env.GAMESHOWS_PORT ?? 3001}`

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // The whole point is playing on real phones, so listen on the LAN in dev
    // too — otherwise the QR code resolves to a laptop nobody else can reach.
    host: true,
    proxy: {
      '/api': { target: HOST_SERVER, changeOrigin: true },
      '/ws': { target: HOST_SERVER, ws: true },
    },
  },
  build: {
    // The binary embeds each of these by name, and hashed names are what let
    // them be cached forever.
    assetsDir: 'assets',
    sourcemap: false,
  },
})
