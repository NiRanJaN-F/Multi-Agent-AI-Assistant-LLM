import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Vite Configuration for Analytics Dashboard
 * 
 * Features:
 * - React plugin integration for Fast Refresh
 * - Path aliasing for cleaner imports (using '@' for src)
 * - Optimized build settings for production
 * - Development server configuration
 */
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh and JSX transform
      include: /\.(mdx|js|jsx|ts|tsx)$/,
    }),
  ],
  resolve: {
    alias: {
      // Allows importing components via '@/components/...'
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Standard port for development
    port: 3000,
    // Automatically open the browser on start
    open: true,
    // Ensure consistent port usage
    strictPort: true,
    // Enable host to allow access from local network (useful for mobile testing)
    host: true,
  },
  build: {
    // Output directory for production build
    outDir: 'dist',
    // Generate sourcemaps for easier debugging in production
    sourcemap: true,
    // Optimization: Chunking strategy for vendor libraries
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['lucide-react'],
        },
      },
    },
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // CSS configuration is handled via postcss.config.js and tailwind.config.js
  // Vite automatically detects these files in the root directory
});