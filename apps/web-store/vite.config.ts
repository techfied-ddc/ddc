import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType:   'prompt',
      strategies:     'injectManifest',
      srcDir:         'src',
      filename:       'sw.ts',
      manifest: {
        name:             'Desire DC — Store',
        short_name:       'DDC Store',
        description:      'Store & rider operations for Desire Premium Dry Cleaning.',
        theme_color:      '#0B0B0C',
        background_color: '#0B0B0C',
        display:          'standalone',
        orientation:      'portrait',
        start_url:        '/',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],

  resolve: {
    alias: [
      { find: '@ddc/ui/styles', replacement: path.resolve(__dirname, '../../packages/ui/src/styles/globals.css') },
      { find: '@ddc/shared',    replacement: path.resolve(__dirname, '../../packages/shared/src/index.ts') },
      { find: '@ddc/ui',        replacement: path.resolve(__dirname, '../../packages/ui/src/index.ts') },
      { find: '@',              replacement: path.resolve(__dirname, 'src') },
    ],
  },

  server: {
    port: 3002,
    proxy: {
      '/api':       { target: 'http://localhost:4000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:4000', ws: true },
    },
  },
});
