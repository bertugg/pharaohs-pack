import { defineConfig } from 'vite';

export default defineConfig({
  base: '/pharaohs-pack/',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
});
