// Configuración de Supabase usando variables de entorno
import { environment } from '../../environments/environment';

export const supabaseConfig = {
  // Credenciales desde environment
  url: environment.supabase.url,
  anonKey: environment.supabase.anonKey,

  // Configuraciones optimizadas para evitar NavigatorLock conflicts
  options: {
    auth: {
      // Configuración optimizada para evitar conflictos
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,

      // Forzar uso de localStorage para evitar conflictos entre tabs
      storage: {
        getItem: (key: string) => {
          try {
            return localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
          } catch {
            // Silently fail if storage is not available
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key);
          } catch {
            // Silently fail if storage is not available
          }
        }
      },

      // Configuración de redirección
      redirectTo: `${window.location.origin}/dashboard`,

      // Reducir tiempo de timeout para evitar locks prolongados
      debug: false
    },

    // Configuración global mínima
    global: {
      headers: {
        'X-Client-Info': 'kumi-shop@1.0.0',
      },
    },

    // Configuración de realtime para evitar conflictos
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  },
};

// NOTAS DE OPTIMIZACIÓN:
// 1. Se configuró storage custom para usar exclusivamente localStorage
// 2. Se eliminaron configuraciones que pueden causar NavigatorLock
// 3. Se agregó manejo de errores silencioso en storage operations
// 4. Se configuró eventsPerSecond para realtime para reducir carga
// 5. Las credenciales ahora vienen del archivo environment para mejor seguridad
