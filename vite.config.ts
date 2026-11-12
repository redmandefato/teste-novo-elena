import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' => o build funciona tanto em localhost quanto em subpasta (GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173, host: 'localhost' },
});
