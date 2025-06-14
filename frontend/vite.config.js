import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://ai-integration-evmk.vercel.app',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://ai-integration-evmk.vercel.app',
        ws: true,
      },
    },
  },
});
