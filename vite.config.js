import { defineConfig, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const transformJsxInJs = () => ({
  name: 'transform-jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    if (!id.match(/src\/.*\.js$/)) return null;
    return await transformWithOxc(code, id, { lang: 'jsx' });
  },
});

const stripCharsetPlugin = () => ({
  name: 'strip-charset',
  enforce: 'post',
  transform(code, id) {
    if (id.endsWith('.css')) {
      return code.replace(/@charset\s+['"]UTF-8['"];?/gi, '');
    }
  }
});

export default defineConfig({
  css: {
    transformer: 'lightningcss',
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 1000,
    cssMinify: 'lightningcss',
  },
  plugins: [
    stripCharsetPlugin(),
    transformJsxInJs(), 
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'NeuroDeck',
        short_name: 'NeuroDeck',
        description: 'AI-powered Flashcards with semantic grading',
        theme_color: '#0f172a',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/favicon.ico',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toLocaleString()),
  },
});
