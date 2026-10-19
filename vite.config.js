import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      // The "@/..." import alias previously injected by the Base44 vite plugin.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});