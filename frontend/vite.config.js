import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    // open: true, # uncomment if not using docker
  },
  build: {
    outDir: 'dist', // Output directory for production build
  },
  css: {
    postcss: './postcss.config.js',
  },
});