import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite Configuration for React Analytics Dashboard
 * 
 * Features:
 * - React plugin integration for JSX/TSX support
 * - CSS Modules configuration with camelCase naming convention
 * - Path aliasing for cleaner imports
 * - Optimized build settings for production deployment
 */
export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    modules: {
      // Enables the use of camelCase in JavaScript while keeping kebab-case in CSS
      localsConvention: 'camelCaseOnly',
      // Generates unique class names to prevent global scope pollution
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
    devSourcemap: true,
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
});