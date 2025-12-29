import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: [
      '@supabase/supabase-js',
      'bcryptjs',
      'crypto-js',
      'file-saver',
      'jspdf',
      'jspdf-autotable',
      'xlsx',
    ],
    // Esperar hasta que termine el crawl para evitar problemas de sincronización
    holdUntilCrawlEnd: true,
    // Opciones de esbuild para mejor compatibilidad
    esbuildOptions: {
      target: 'esnext',
    },
  },
  // Configuración del servidor de desarrollo
  server: {
    // Mejorar el manejo de archivos
    fs: {
      strict: false,
    },
  },
  // Configuración de build
  build: {
    // Incrementar el límite de tamaño de chunks para evitar problemas
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Mejorar el manejo de chunks
        manualChunks: undefined,
      },
    },
  },
});

