import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OpenFDA',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@modelcontextprotocol/sdk', 'zod'],
      output: {
        dir: 'dist',
        preserveModules: false,
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});