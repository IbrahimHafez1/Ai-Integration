import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/slack/save-token': {
        target: 'https://5d0c739d-620b-4833-b270-6da5909ef27a-00-38en1hwbeb1oi.kirk.replit.dev',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/slack\/save-token/, '/api/slack/save-token'), // Rewrites the path
      },
      '/api': {
        target: 'https://5d0c739d-620b-4833-b270-6da5909ef27a-00-38en1hwbeb1oi.kirk.replit.dev',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://5d0c739d-620b-4833-b270-6da5909ef27a-00-38en1hwbeb1oi.kirk.replit.dev',
        ws: true,
      },
    },
  },
});
