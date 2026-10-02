import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Enable HMR for React components
    hmr: true,
    // Serve static files from the `public` directory
    static: {
      dir: 'public',
    },
  },
  build: {
    // Enable sourcemaps for debugging
    rollupOptions: {
      output: {
        sourcemap: true,
      },
    },
  },
});