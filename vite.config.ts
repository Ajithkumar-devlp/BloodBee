import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react'
    ]
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
  server: {
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/pages/Welcome.tsx',
        './src/pages/Login.tsx',
        './src/pages/Register.tsx',
        './src/pages/Dashboard.tsx',
      ]
    }
  }
})
