import { defineConfig } from 'vite';

export default defineConfig({
  root: 'frontend',
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: '../dist/frontend',
    emptyOutDir: true
  }
});
