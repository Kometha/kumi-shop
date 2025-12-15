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
    // Crear cliente de Supabase con configuración inicial
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          headers: {
            'X-Client-Info': 'kumi-shop@1.0.0'
          }
        }
      }
    );

    // Intentar cargar token del localStorage al inicializar
    this.loadTokenFromStorage();
  }

  /**
   * Obtener el cliente de Supabase
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Actualizar el header de Authorization con el token
   * @param token Token de autenticación (sin 'Bearer')
   */
  updateAuthToken(token: string | null): void {
    this.currentToken = token;

    try {
      if (token) {
        // Agregar header Authorization con Bearer token
        // Usar rest.headers que es un objeto mutable en Supabase JS
        if (this.supabase.rest && this.supabase.rest.headers) {
          this.supabase.rest.headers['Authorization'] = `Bearer ${token}`;
        }
      } else {
        // Remover header Authorization si no hay token
        if (this.supabase.rest && this.supabase.rest.headers) {
          delete this.supabase.rest.headers['Authorization'];
        }
      }
    } catch (error) {
      console.error('Error actualizando header Authorization:', error);
    }
  }

  /**
   * Cargar token del localStorage y actualizar headers
   */
  private loadTokenFromStorage(): void {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        this.updateAuthToken(token);
      }
    } catch (error) {
      console.error('Error al cargar token del localStorage:', error);
    }
  }

  /**
   * Limpiar el header de Authorization
   */
  clearAuthToken(): void {
    this.currentToken = null;
    try {
      if (this.supabase.rest && this.supabase.rest.headers) {
        delete this.supabase.rest.headers['Authorization'];
      }
    } catch (error) {
      console.error('Error limpiando header Authorization:', error);
    }
  }

  /**
   * Obtener el token actual
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }
}

