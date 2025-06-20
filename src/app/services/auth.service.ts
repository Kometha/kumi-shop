import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { supabaseConfig } from './supabase.config';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  last_sign_in_at?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
  metadata?: {
    nombres?: string;
    apellidos?: string;
    fecha_nacimiento?: string;
    genero?: string;
    numero_celular?: string;
    [key: string]: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  // Observables públicos
  public currentUser$ = this.currentUserSubject.asObservable();
  public session$ = this.sessionSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));

    constructor() {
    // Configuración de Supabase usando el archivo de configuración
    this.supabase = createClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      supabaseConfig.options
    );

    // Escuchar cambios de autenticación
    this.initializeAuthListener();

    // Verificar sesión existente al inicio
    this.checkInitialSession();
  }

  /**
   * Inicializa el listener de cambios de autenticación
   */
  private initializeAuthListener(): void {
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);

      this.sessionSubject.next(session);

      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.['name'] || session.user.user_metadata?.['full_name'],
          avatar_url: session.user.user_metadata?.['avatar_url'],
          created_at: session.user.created_at,
          last_sign_in_at: session.user.last_sign_in_at
        };
        this.currentUserSubject.next(authUser);
      } else {
        this.currentUserSubject.next(null);
      }

      this.loadingSubject.next(false);
    });
  }

  /**
   * Verifica si hay una sesión existente al inicializar
   */
  private async checkInitialSession(): Promise<void> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) {
        console.error('Error checking initial session:', error);
        // Si es un error de NavigatorLock, intentar limpiar y reintento
        if (error.message?.includes('NavigatorLockAcquireTimeoutError') ||
            error.message?.includes('lock')) {
          console.warn('Navigator Lock error detected, attempting to clear storage...');
          this.clearAuthStorage();
          // Reintento después de limpiar
          setTimeout(() => {
            this.retryInitialSession();
          }, 1000);
        }
      }
      // El listener se encargará de actualizar el estado
    } catch (error: any) {
      console.error('Error checking initial session:', error);

      // Manejo específico para errores de NavigatorLock
      if (error.message?.includes('NavigatorLockAcquireTimeoutError') ||
          error.message?.includes('lock')) {
        console.warn('Navigator Lock conflict detected, clearing storage...');
        this.clearAuthStorage();
        this.loadingSubject.next(false);
        return;
      }

      this.loadingSubject.next(false);
    }
  }

  /**
   * Reintento de verificación de sesión después de limpiar storage
   */
  private async retryInitialSession(): Promise<void> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) {
        console.error('Retry - Error checking session:', error);
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Limpia el storage de autenticación para resolver conflictos
   */
  public clearAuthStorage(): void {
    try {
      // Limpiar keys default de Supabase solamente
      const supabaseProjectRef = 'aexegmoklvpwqlkbfrlu'; // Referencia del proyecto
      const defaultKey = `sb-${supabaseProjectRef}-auth-token`;

      // Limpiar de ambos storages
      sessionStorage.removeItem(defaultKey);
      localStorage.removeItem(defaultKey);

      // Limpiar otros posibles keys relacionados con Supabase
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth-token'))) {
          keysToRemove.push(key);
        }
      }

      // También revisar localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth-token'))) {
          keysToRemove.push(key);
        }
      }

      // Eliminar keys encontrados
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      });

      console.log('Auth storage cleared successfully');
    } catch (error) {
      console.error('Error clearing auth storage:', error);
    }
  }

  /**
   * Registra un nuevo usuario
   */
  register(credentials: RegisterCredentials): Observable<AuthResponse> {
    return from(
      this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name || credentials.email.split('@')[0],
            full_name: credentials.name || credentials.email.split('@')[0],
            ...credentials.metadata
          }
        }
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          return {
            success: false,
            error: this.getErrorMessage(error)
          };
        }

        // Si el usuario se registró exitosamente
        if (data.user) {
          // Intentar crear el perfil manualmente si no existe el trigger
          this.createUserProfile(data.user.id, credentials.metadata);

          if (!data.user.email_confirmed_at) {
            return {
              success: true,
              message: 'Usuario registrado exitosamente. Puedes iniciar sesión ahora.'
            };
          }

          return {
            success: true,
            user: {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.['name'],
              avatar_url: data.user.user_metadata?.['avatar_url'],
              created_at: data.user.created_at,
              last_sign_in_at: data.user.last_sign_in_at
            },
            message: 'Usuario registrado exitosamente'
          };
        }

        return {
          success: false,
          error: 'Error inesperado durante el registro'
        };
      })
    );
  }

  /**
   * Crear perfil de usuario manualmente (backup del trigger)
   */
  private async createUserProfile(userId: string, metadata?: any) {
    try {
      if (!metadata) return;

      const { error } = await this.supabase
        .schema('kumi-shop')
        .from('user_profiles')
        .insert({
          id: userId,
          nombres: metadata.nombres || 'Sin nombre',
          apellidos: metadata.apellidos || 'Sin apellido',
          fecha_nacimiento: metadata.fecha_nacimiento || '1990-01-01',
          genero: metadata.genero || 'otro',
          numero_celular: metadata.numero_celular
        });

      if (error) {
        console.error('Error creating user profile:', error);
      } else {
        console.log('User profile created successfully');
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  }

  /**
   * Inicia sesión con email y contraseña
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return from(
      this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          return {
            success: false,
            error: this.getErrorMessage(error)
          };
        }

        return {
          success: true,
          user: data.user ? {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.['name'],
            avatar_url: data.user.user_metadata?.['avatar_url'],
            created_at: data.user.created_at,
            last_sign_in_at: data.user.last_sign_in_at
          } : undefined,
          message: 'Sesión iniciada exitosamente'
        };
      })
    );
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): Observable<AuthResponse> {
    return from(this.supabase.auth.signOut()).pipe(
      map(({ error }) => {
        if (error) {
          return {
            success: false,
            error: this.getErrorMessage(error)
          };
        }

        // Limpiar storage después del logout para evitar conflictos futuros
        this.clearAuthStorage();

        return {
          success: true,
          message: 'Sesión cerrada exitosamente'
        };
      })
    );
  }

  /**
   * Envía email para resetear contraseña
   */
  resetPassword(email: string): Observable<AuthResponse> {
    return from(
      this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
    ).pipe(
      map(({ error }) => {
        if (error) {
          return {
            success: false,
            error: this.getErrorMessage(error)
          };
        }

        return {
          success: true,
          message: 'Te hemos enviado un email para resetear tu contraseña'
        };
      })
    );
  }

  /**
   * Actualiza la contraseña del usuario
   */
  updatePassword(newPassword: string): Observable<AuthResponse> {
    return from(
      this.supabase.auth.updateUser({
        password: newPassword
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          return {
            success: false,
            error: this.getErrorMessage(error)
          };
        }

        return {
          success: true,
          message: 'Contraseña actualizada exitosamente'
        };
      })
    );
  }

  /**
   * Actualiza el perfil del usuario
   */
  updateProfile(updates: { name?: string; avatar_url?: string }): Observable<AuthResponse> {
    return from(
      this.supabase.auth.updateUser({
        data: updates
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          return {
            success: false,
            error: this.getErrorMessage(error)
          };
        }

        return {
          success: true,
          user: data.user ? {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.['name'],
            avatar_url: data.user.user_metadata?.['avatar_url'],
            created_at: data.user.created_at,
            last_sign_in_at: data.user.last_sign_in_at
          } : undefined,
          message: 'Perfil actualizado exitosamente'
        };
      })
    );
  }

  /**
   * Obtiene el usuario actual (método síncrono)
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtiene la sesión actual (método síncrono)
   */
  getCurrentSession(): Session | null {
    return this.sessionSubject.value;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  /**
   * Obtiene el token de acceso actual
   */
  async getAccessToken(): Promise<string | null> {
    const session = this.getCurrentSession();
    return session?.access_token || null;
  }

  /**
   * Refresca la sesión actual
   */
  refreshSession(): Observable<AuthResponse> {
    return from(this.supabase.auth.refreshSession()).pipe(
      map(({ data, error }) => {
        if (error) {
          // Si hay error de lock en refresh, limpiar storage
          if (error.message?.includes('NavigatorLockAcquireTimeoutError') ||
              error.message?.includes('lock')) {
            this.clearAuthStorage();
            return {
              success: false,
              error: 'Conflicto de sesión resuelto. Por favor, inicia sesión nuevamente.'
            };
          }

          return {
            success: false,
            error: this.getErrorMessage(error)
          };
        }

        return {
          success: true,
          message: 'Sesión refrescada exitosamente'
        };
      })
    );
  }

  /**
   * Función pública para limpiar storage y resolver conflictos manualmente
   */
  public resolveNavigatorLockConflict(): void {
    console.log('Manually resolving Navigator Lock conflicts...');
    this.clearAuthStorage();

    // Resetear estado de loading y usuario
    this.currentUserSubject.next(null);
    this.sessionSubject.next(null);
    this.loadingSubject.next(true);

    // Forzar re-verificación de sesión después de limpiar
    setTimeout(() => {
      this.checkInitialSession();
    }, 500);
  }

  /**
   * Limpieza profunda para resolver problemas persistentes
   * Úsala solo cuando hay problemas graves que no se resuelven
   */
  public deepCleanAndReset(): void {
    console.log('Performing deep clean and reset...');

    try {
      // 1. Limpiar todo el storage relacionado con auth
      this.clearAuthStorage();

      // 2. Limpiar todas las cookies relacionadas
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // 3. Forzar sign out de Supabase sin esperar respuesta
      this.supabase.auth.signOut().catch(() => {
        // Ignorar errores en signOut durante limpieza
      });

      // 4. Resetear todos los subjects
      this.currentUserSubject.next(null);
      this.sessionSubject.next(null);
      this.loadingSubject.next(false);

      // 5. Mostrar mensaje de éxito
      console.log('Deep clean completed successfully. Please refresh the page.');

    } catch (error) {
      console.error('Error during deep clean:', error);
    }
  }

  /**
   * Detecta si hay conflictos de NavigatorLock activos
   */
  public hasNavigatorLockConflict(): boolean {
    try {
      // Verificar si existen múltiples instancias de tokens de auth
      const supabaseProjectRef = 'aexegmoklvpwqlkbfrlu';
      const defaultKey = `sb-${supabaseProjectRef}-auth-token`;

      const sessionToken = sessionStorage.getItem(defaultKey);
      const localToken = localStorage.getItem(defaultKey);

      // Si hay tokens en ambos lugares o ninguno, podría indicar conflicto
      if (sessionToken && localToken) {
        console.warn('Detected duplicate auth tokens in both storages');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking Navigator Lock conflicts:', error);
      return false;
    }
  }

  /**
   * Convierte errores de Supabase a mensajes legibles
   */
  private getErrorMessage(error: AuthError): string {
    // Mapeo de errores comunes
    const errorMessages: { [key: string]: string } = {
      'Invalid login credentials': 'Credenciales de acceso inválidas',
      'Email not confirmed': 'Email no confirmado',
      'User already registered': 'El usuario ya está registrado',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
      'Unable to validate email address: invalid format': 'Formato de email inválido',
      'For security purposes, you can only request this once every 60 seconds': 'Por seguridad, solo puedes solicitar esto una vez cada 60 segundos',
      'NavigatorLockAcquireTimeoutError': 'Conflicto de sesión detectado. La página se recargará para resolver el problema.',
      'signup is disabled': 'El registro está deshabilitado',
      'Email rate limit exceeded': 'Límite de emails excedido, intenta más tarde'
    };

    // Buscar mensaje específico
    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.message.includes(key)) {
        return message;
      }
    }

    // Si no hay traducción específica, devolver mensaje genérico
    return `Error: ${error.message}`;
  }
}
