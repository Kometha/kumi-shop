import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

// Interfaces para el nuevo sistema
export interface User {
  id: string;
  username: string;
  nombre?: string;
  apellido?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  nombre: string;
  apellido: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  message?: string;
}

// Interfaces para respuestas de funciones RPC
export interface LoginRPCResponse {
  success: boolean;
  token?: string;
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
    username: string;
  };
  message?: string;
}

export interface VerificarSesionRPCResponse {
  success: boolean;
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
    username: string;
  };
  message?: string;
}

export interface LogoutRPCResponse {
  success: boolean;
  message?: string;
}

export interface RegistrarUsuarioRPCResponse {
  success: boolean;
  usuario_id?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TraditionalAuthService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private initializedSubject = new BehaviorSubject<boolean>(false);
  private tokenKey = 'auth_token';

  // Observables públicos
  public currentUser$ = this.currentUserSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public initialized$ = this.initializedSubject.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));

  constructor(private supabaseService: SupabaseService) {
    // Usar el cliente compartido de Supabase
    this.supabase = this.supabaseService.getClient();

    // Verificar token almacenado al inicializar de forma síncrona
    this.initializeAuth();
  }

  /**
   * Inicializar autenticación de forma controlada
   */
  private async initializeAuth(): Promise<void> {
    // console.log('🔄 [AUTH] Iniciando verificación de sesión...');

    try {
      await this.checkStoredToken();
    } catch (error) {
      // console.error('❌ [AUTH] Error en inicialización:', error);
    } finally {
      this.initializedSubject.next(true);
      // console.log('✅ [AUTH] Inicialización completada');
    }
  }

  /**
   * Verificar si hay un token válido almacenado usando verificar_sesion RPC
   */
  private async checkStoredToken(): Promise<void> {
    this.loadingSubject.next(true);

    try {
      const token = this.getStoredToken();

      if (token) {
        // Actualizar header Authorization antes de verificar sesión
        this.supabaseService.updateAuthToken(token);

        // Usar función RPC verificar_sesion para validar el token
        const { data, error } = await this.supabase.rpc('verificar_sesion', {
          p_token: token
        });

        if (error) {
          console.error('Error verificando sesión:', error);
          this.clearToken();
          this.supabaseService.clearAuthToken();
          return;
        }

        const response = data as VerificarSesionRPCResponse;

        if (response.success && response.usuario) {
          // Convertir respuesta RPC a objeto User
          const user: User = {
            id: response.usuario.id,
            username: response.usuario.username,
            nombre: response.usuario.nombre,
            apellido: response.usuario.apellido,
            isActive: true,
            createdAt: new Date().toISOString()
          };
          this.currentUserSubject.next(user);
        } else {
          // Token inválido o sesión expirada
          this.clearToken();
          this.supabaseService.clearAuthToken();
        }
      } else {
        // No hay token almacenado
        this.clearToken();
        this.supabaseService.clearAuthToken();
      }
    } catch (error) {
      console.error('Error checking stored token:', error);
      this.clearToken();
      this.supabaseService.clearAuthToken();
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Obtener usuario desde el token usando verificar_sesion RPC
   */
  private async getUserFromToken(token: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase.rpc('verificar_sesion', {
        p_token: token
      });

      if (error) {
        console.error('Error verificando sesión:', error);
        return null;
      }

      const response = data as VerificarSesionRPCResponse;

      if (response.success && response.usuario) {
        return {
          id: response.usuario.id,
          username: response.usuario.username,
          nombre: response.usuario.nombre,
          apellido: response.usuario.apellido,
          isActive: true,
          createdAt: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user from token:', error);
      return null;
    }
  }

  /**
   * Iniciar sesión
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    this.loadingSubject.next(true);

    return from(this.performLogin(credentials)).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Realizar login usando login_usuario RPC
   */
  private async performLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Llamar a la función RPC login_usuario
      // La contraseña se envía en texto plano, el backend la hashea con bcrypt
      const { data, error } = await this.supabase.rpc('login_usuario', {
        p_username: credentials.username,
        p_password: credentials.password
      });

      if (error) {
        console.error('Error en login RPC:', error);
        return {
          success: false,
          error: 'Error al iniciar sesión'
        };
      }

      const response = data as LoginRPCResponse;

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Credenciales inválidas'
        };
      }

      if (!response.token || !response.usuario) {
        return {
          success: false,
          error: 'Error en la respuesta del servidor'
        };
      }

      // Convertir respuesta RPC a objeto User
      const user: User = {
        id: response.usuario.id,
        username: response.usuario.username,
        nombre: response.usuario.nombre,
        apellido: response.usuario.apellido,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      // Guardar token y actualizar estado
      this.storeToken(response.token);
      this.currentUserSubject.next(user);

      // Actualizar header Authorization en todas las peticiones de Supabase
      this.supabaseService.updateAuthToken(response.token);

      return {
        success: true,
        user,
        token: response.token,
        message: 'Sesión iniciada correctamente'
      };

    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  /**
   * Registrar nuevo usuario
   */
  register(credentials: RegisterCredentials): Observable<AuthResponse> {
    this.loadingSubject.next(true);

    return from(this.performRegister(credentials)).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Realizar registro usando registrar_usuario RPC
   */
  private async performRegister(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      // Llamar a la función RPC registrar_usuario
      // La contraseña se envía en texto plano, el backend la hashea con bcrypt
      const { data, error } = await this.supabase.rpc('registrar_usuario', {
        p_nombre: credentials.nombre,
        p_apellido: credentials.apellido,
        p_username: credentials.username,
        p_password: credentials.password
      });

      if (error) {
        console.error('Error en registro RPC:', error);
        return {
          success: false,
          error: 'Error al registrar usuario'
        };
      }

      const response = data as RegistrarUsuarioRPCResponse;

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Error al registrar usuario'
        };
      }

      return {
        success: true,
        message: 'Usuario registrado correctamente. Puedes iniciar sesión ahora.'
      };

    } catch (error: any) {
      console.error('Register error:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  /**
   * Cerrar sesión
   */
  logout(): Observable<AuthResponse> {
    return from(this.performLogout());
  }

  /**
   * Realizar logout usando logout_usuario RPC
   */
  private async performLogout(): Promise<AuthResponse> {
    try {
      const token = this.getStoredToken();
      
      if (token) {
        // Llamar a la función RPC logout_usuario antes de limpiar localStorage
        const { data, error } = await this.supabase.rpc('logout_usuario', {
          p_token: token
        });

        if (error) {
          console.error('Error en logout RPC:', error);
          // Continuar con el logout local aunque haya error en el servidor
        } else {
          const response = data as LogoutRPCResponse;
          if (!response.success) {
            console.warn('Logout RPC retornó success: false');
          }
        }
      }

      // Limpiar estado local
      this.clearToken();
      this.currentUserSubject.next(null);

      // Limpiar header Authorization de todas las peticiones de Supabase
      this.supabaseService.clearAuthToken();

      return {
        success: true,
        message: 'Sesión cerrada correctamente'
      };
    } catch (error) {
      console.error('Logout error:', error);
      // Aunque haya error, limpiar estado local
      this.clearToken();
      this.currentUserSubject.next(null);

      // Limpiar header Authorization de todas las peticiones de Supabase
      this.supabaseService.clearAuthToken();

      return {
        success: true,
        message: 'Sesión cerrada'
      };
    }
  }

  // ============================================
  // MÉTODOS AUXILIARES ELIMINADOS
  // ============================================
  // Los siguientes métodos ya no son necesarios porque:
  // - generateToken: El backend genera el token
  // - decodeToken/isTokenValid: La validación se hace con verificar_sesion RPC
  // - hashPasswordMD5/verifyPassword: El backend hashea y verifica con bcrypt
  // - createSession/invalidateSession: El backend maneja las sesiones
  // - updateLastLogin: El backend actualiza el último login en login_usuario

  // ============================================
  // GESTIÓN DE TOKENS
  // ============================================

  private storeToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  // ============================================
  // MÉTODOS PÚBLICOS
  // ============================================

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.getStoredToken();
  }

  isInitialized(): boolean {
    return this.initializedSubject.value;
  }

  /**
   * Método de debug para verificar el estado completo
   */
  getAuthState(): {
    isAuthenticated: boolean;
    isInitialized: boolean;
    hasToken: boolean;
    currentUser: User | null;
  } {
    return {
      isAuthenticated: this.isAuthenticated(),
      isInitialized: this.isInitialized(),
      hasToken: !!this.getStoredToken(),
      currentUser: this.getCurrentUser()
    };
  }
}
