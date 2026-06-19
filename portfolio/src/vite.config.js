import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vite natively supports extending import.meta.env
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toLocaleString())
  }
});
