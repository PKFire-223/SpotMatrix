import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@Main': path.resolve(__dirname, './Main'),
      '@Ai': path.resolve(__dirname, './Ai'),
      '@Error': path.resolve(__dirname, './Error'),
      '@Shared': path.resolve(__dirname, './Shared'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
