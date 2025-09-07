import { defineConfig } from 'vite';
import { resolve } from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  // Project root
  root: '.',

  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          three: ['three'],
          vendor: ['cannon-es']
        }
      }
    },
    // Optimize for WebGL
    target: 'es2020',
    cssCodeSplit: false
  },

  // Development server
  server: {
    host: true,
    port: 3000,
    open: true,
    https: true, // Required for some Web Audio API features
    cors: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },

  // Plugins
  plugins: [
    basicSsl()
  ],

  // Asset handling
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.wav', '**/*.mp3', '**/*.ogg'],

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@audio': resolve(__dirname, 'src/audio'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'assets')
    }
  },

  // CSS preprocessing
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/styles/variables.scss";'
      }
    }
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['three', 'cannon-es']
  },

  // Preview server (for production builds)
  preview: {
    port: 8080,
    host: true,
    https: true
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __DEBUG_MODE__: process.env.NODE_ENV === 'development'
  }
});
