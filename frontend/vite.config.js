import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3001' } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            'lucide-react',
          ],
          'charts-vendor': ['recharts'],
        },
      },
    },
  },
})
