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
  ],
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toLocaleString()),
  },
});
