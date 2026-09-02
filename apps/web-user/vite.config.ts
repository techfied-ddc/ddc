import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType:    'prompt',
      strategies:      'injectManifest',
      srcDir:          'src',
      filename:        'sw.ts',
      includeAssets:   ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name:             'Desire Dry Cleaning',
        short_name:       'Desire DC',
        description:      'Premium dry cleaning, picked up and delivered.',
        theme_color:      '#0B0B0C',
        background_color: '#0B0B0C',
        display:          'standalone',
        orientation:      'portrait',
        start_url:        '/',
        scope:            '/',
        lang:             'en-IN',
        icons: [
          { src: '/icons/pwa-192.png',  sizes: '192x192',  type: 'image/png' },
          { src: '/icons/pwa-512.png',  sizes: '512x512',  type: 'image/png' },
          { src: '/icons/pwa-512.png',  sizes: '512x512',  type: 'image/png', purpose: 'any maskable' },
        ],
        screenshots: [
          { src: '/screenshots/home.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow' },
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
    port: 3001,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:4000', ws: true },
    },
  },

  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:    ['react', 'react-dom', 'react-router-dom'],
          query:     ['@tanstack/react-query'],
          motion:    ['framer-motion'],
          socket:    ['socket.io-client'],
        },
      },
    },
  },
});
