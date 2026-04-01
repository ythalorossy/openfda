import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OpenFDA',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        '@modelcontextprotocol/sdk',
        '@modelcontextprotocol/sdk/server/mcp.js',
        '@modelcontextprotocol/sdk/server/stdio.js',
        'zod'
      ],
      output: {
        dir: 'dist',
        preserveModules: false,
        preserveModulesRoot: resolve(__dirname, 'src'),
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