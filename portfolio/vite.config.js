import { defineConfig, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const transformJsxInJs = () => ({
  name: 'transform-jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    if (!id.match(/src\/.*\.js$/)) return null;
    return await transformWithOxc(code, id, { lang: 'jsx' });
  },
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
    transformJsxInJs(), 
    tailwindcss(),
    react(),
  ],
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toLocaleString()),
  },
});
