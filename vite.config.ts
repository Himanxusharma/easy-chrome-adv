import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.tsx')
      },
      output: {
        format: 'iife',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
}); 