import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Single source of truth for the version the server reports over MCP. Injected
// at build time so package.json and serverInfo cannot drift apart again.
const pkgVersion = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf8')
).version;

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkgVersion),
  },
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