// Archivo de ejemplo para configurar las variables de entorno
// Copia este archivo como environment.ts y environment.prod.ts
// y reemplaza los valores con tus credenciales reales de Supabase

export const environment = {
  production: false, // true para production
  supabase: {
    url: 'https://tu-proyecto-ref.supabase.co',
    anonKey: 'tu-anon-key-aqui'
  }
};
