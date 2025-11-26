// src/supabase/client.js
import { createClient } from '@supabase/supabase-js'
import { environment } from '../environments/environment'

const supabaseUrl = environment.supabase.url
const supabaseAnonKey = environment.supabase.anonKey

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
