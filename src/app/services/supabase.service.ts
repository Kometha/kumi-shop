import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Servicio centralizado de Supabase
 * Proporciona un cliente único y compartido con gestión de headers de autenticación
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentToken: string | null = null;

  constructor() {
    // Intentar cargar token del localStorage al inicializar
    const token = this.loadTokenFromStorage();
    
    // Crear cliente de Supabase con configuración inicial
    this.supabase = this.createClient(token);
  }

  /**
   * Crear cliente de Supabase con headers de autenticación
   * @param token Token de autenticación opcional
   */
  private createClient(token: string | null = null): SupabaseClient {
    const headers: Record<string, string> = {
      'X-Client-Info': 'kumi-shop@1.0.0'
    };

    // Agregar header x-app-token si hay token (para RLS policies)
    if (token) {
      headers['x-app-token'] = token;
    }

    return createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          headers
        }
      }
    );
  }

  /**
   * Obtener el cliente de Supabase
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Actualizar el header x-app-token con el token
   * Recrea el cliente para aplicar los nuevos headers
   * @param token Token de autenticación
   */
  updateAuthToken(token: string | null): void {
    // Solo recrear si el token cambió
    if (this.currentToken !== token) {
      this.currentToken = token;
      // Recrear el cliente con el nuevo token
      this.supabase = this.createClient(token);
    }
  }

  /**
   * Cargar token del localStorage
   */
  private loadTokenFromStorage(): string | null {
    try {
      return localStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error al cargar token del localStorage:', error);
      return null;
    }
  }

  /**
   * Limpiar el header x-app-token
   * Recrea el cliente sin el header x-app-token
   */
  clearAuthToken(): void {
    this.currentToken = null;
    // Recrear el cliente sin el token
    this.supabase = this.createClient(null);
  }

  /**
   * Obtener el token actual
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Obtener headers de autenticación para usar en queries
   * Devuelve un objeto con el header x-app-token si hay token disponible
   */
  getAuthHeaders(): Record<string, string> {
    const token = this.getCurrentToken();
    if (token) {
      return { 'x-app-token': token };
    }
    return {};
  }
}

