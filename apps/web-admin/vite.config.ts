import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@ddc/ui/styles', replacement: path.resolve(__dirname, '../../packages/ui/src/styles/globals.css') },
      { find: '@ddc/shared',    replacement: path.resolve(__dirname, '../../packages/shared/src/index.ts') },
      { find: '@ddc/ui',        replacement: path.resolve(__dirname, '../../packages/ui/src/index.ts') },
      { find: '@',              replacement: path.resolve(__dirname, 'src') },
    ],
  },
  server: {
    port: 3003,
    proxy: {
      '/api':       { target: 'http://localhost:4000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:4000', ws: true },
    },
  },
});
