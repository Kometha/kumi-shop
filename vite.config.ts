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
  },
});

