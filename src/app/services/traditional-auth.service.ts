import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import * as CryptoJS from 'crypto-js';

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
  email: string;
  password: string;
  name?: string;
  nombres?: string;
  apellidos?: string;
  fechaNacimiento?: string;
  genero?: string;
  numeroCelular?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  message?: string;
}

export interface TokenPayload {
  userId: string;
  username: string;
  nombre?: string;
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class TraditionalAuthService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private initializedSubject = new BehaviorSubject<boolean>(false);
  private tokenKey = 'kumi_auth_token';

  // Observables públicos
  public currentUser$ = this.currentUserSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public initialized$ = this.initializedSubject.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));

  constructor() {
    console.log('🚀 [AUTH] Traditional Auth Service initialized');
    // Solo usar Supabase como cliente de base de datos
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: false, // ¡NO persistir sesiones de Supabase!
          autoRefreshToken: false
        }
      }
    );

    // Verificar token almacenado al inicializar de forma síncrona
    this.initializeAuth();
  }

  /**
   * Inicializar autenticación de forma controlada
   */
  private async initializeAuth(): Promise<void> {
    console.log('🔄 [AUTH] Iniciando verificación de sesión...');

    try {
      await this.checkStoredToken();
    } catch (error) {
      console.error('❌ [AUTH] Error en inicialización:', error);
    } finally {
      this.initializedSubject.next(true);
      console.log('✅ [AUTH] Inicialización completada');
    }
  }

  /**
   * Verificar si hay un token válido almacenado
   */
  private async checkStoredToken(): Promise<void> {
    this.loadingSubject.next(true);
    console.log('🔍 [AUTH] Verificando token almacenado...');

    try {
      const token = this.getStoredToken();
      console.log('🔍 [AUTH] Token encontrado:', !!token);

      if (token) {
        console.log('🔍 [AUTH] Verificando validez del token...');

        if (this.isTokenValid(token)) {
          console.log('✅ [AUTH] Token válido, obteniendo usuario...');

          const user = await this.getUserFromToken(token);
          if (user) {
            console.log('✅ [AUTH] Usuario restaurado desde token:', user.username);
            this.currentUserSubject.next(user);
          } else {
            console.log('❌ [AUTH] Usuario no encontrado en BD, limpiando token');
            this.clearToken();
          }
        } else {
          console.log('❌ [AUTH] Token expirado o inválido, limpiando');
          this.clearToken();
        }
      } else {
        console.log('ℹ️ [AUTH] No hay token almacenado');
        this.clearToken();
      }
    } catch (error) {
      console.error('❌ [AUTH] Error checking stored token:', error);
      this.clearToken();
    } finally {
      this.loadingSubject.next(false);
      console.log('🏁 [AUTH] Verificación de token completada');
    }
  }

  /**
   * Obtener usuario desde el token
   */
  private async getUserFromToken(token: string): Promise<User | null> {
    try {
      const payload = this.decodeToken(token);
      if (!payload) return null;

      // Verificar que el usuario sigue activo en la BD
      const { data, error } = await this.supabase
        .from('usuarios')
        .select('*')
        .eq('id', payload.userId)
        .eq('activo', true)
        .single();

      if (error || !data) {
        console.error('User not found or inactive:', error);
        return null;
      }

      return {
        id: data.id,
        username: data.username,
        nombre: data.nombre,
        apellido: data.apellido,
        isActive: data.activo,
        createdAt: data.created_at,
        lastLoginAt: data.updated_at
      };
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
   * Realizar login (lógica principal)
   */
  private async performLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // 1. Buscar usuario por username
      const { data: userData, error: userError } = await this.supabase
        .from('usuarios')
        .select('*')
        .eq('username', credentials.username)
        .eq('activo', true)
        .single();

      console.log('🔍 [LOGIN] Resultado consulta usuario:', { userData, userError });

      if (userError || !userData) {
        console.log('❌ [LOGIN] Usuario no encontrado o error:', userError);
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      console.log('✅ [LOGIN] Usuario encontrado:', userData.username);

      // 2. Verificar contraseña usando MD5
      console.log('🔍 [LOGIN] Verificando contraseña...');
      console.log('🔍 [LOGIN] Password input:', credentials.password);
      console.log('🔍 [LOGIN] Hash en BD:', userData.password_hash);

      const isPasswordValid = await this.verifyPassword(credentials.password, userData.password_hash);
      console.log('🔍 [LOGIN] Password válida:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('❌ [LOGIN] Contraseña inválida');
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      console.log('✅ [LOGIN] Contraseña correcta');

      // 3. Generar token JWT
      const token = this.generateToken({
        userId: userData.id,
        username: userData.username,
        nombre: userData.nombre || userData.username
      });

      // 4. Guardar sesión en BD (tabla sesiones)
      await this.createSession(userData.id, token);

      // 5. Actualizar último login
      await this.updateLastLogin(userData.id);

      // 6. Crear objeto user
      const user: User = {
        id: userData.id,
        username: userData.username,
        nombre: userData.nombre,
        apellido: userData.apellido,
        isActive: userData.activo,
        createdAt: userData.created_at,
        lastLoginAt: new Date().toISOString()
      };

      // 7. Guardar token y actualizar estado
      this.storeToken(token);
      this.currentUserSubject.next(user);

      return {
        success: true,
        user,
        token,
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
   * Realizar registro
   */
  private async performRegister(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      // 1. Verificar que el email no esté en uso
      const { data: existingUser, error: checkError } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', credentials.email.toLowerCase())
        .single();

      if (existingUser) {
        return {
          success: false,
          error: 'El email ya está registrado'
        };
      }

      // 2. Hash de la contraseña usando MD5
      const passwordHash = this.hashPasswordMD5(credentials.password);

      // 3. Crear usuario
      const { data: newUser, error: insertError } = await this.supabase
        .from('users')
        .insert({
          email: credentials.email.toLowerCase(),
          password_hash: passwordHash,
          name: credentials.name || credentials.email.split('@')[0],
          is_active: true,
          email_verified: false
        })
        .select()
        .single();

      if (insertError || !newUser) {
        console.error('Insert error:', insertError);
        return {
          success: false,
          error: 'Error al crear el usuario'
        };
      }

      // 4. Crear perfil si se proporcionaron datos adicionales
      if (credentials.nombres || credentials.apellidos) {
        await this.supabase
          .from('user_profiles')
          .insert({
            user_id: newUser.id,
            nombres: credentials.nombres,
            apellidos: credentials.apellidos,
            fecha_nacimiento: credentials.fechaNacimiento,
            genero: credentials.genero,
            numero_celular: credentials.numeroCelular
          });
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
   * Realizar logout
   */
  private async performLogout(): Promise<AuthResponse> {
    try {
      const token = this.getStoredToken();
      if (token) {
        // Invalidar sesión en BD
        await this.invalidateSession(token);
      }

      // Limpiar estado local
      this.clearToken();
      this.currentUserSubject.next(null);

      return {
        success: true,
        message: 'Sesión cerrada correctamente'
      };
    } catch (error) {
      console.error('Logout error:', error);
      // Aunque haya error, limpiar estado local
      this.clearToken();
      this.currentUserSubject.next(null);

      return {
        success: true,
        message: 'Sesión cerrada'
      };
    }
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  /**
   * Generar token JWT simple (en producción usar librería JWT)
   */
  private generateToken(payload: { userId: string; username: string; nombre?: string }): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload: TokenPayload = {
      userId: payload.userId,
      username: payload.username,
      nombre: payload.nombre,
      iat: now,
      exp: now + (7 * 24 * 60 * 60) // 7 días
    };
    const payloadStr = btoa(JSON.stringify(tokenPayload));
    const signature = btoa(`${header}.${payloadStr}.signature`); // Simplificado

    return `${header}.${payloadStr}.${signature}`;
  }

  /**
   * Decodificar token
   */
  private decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Verificar si el token es válido
   */
  private isTokenValid(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return false;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  }

  /**
   * Generar hash MD5 de contraseña
   */
  private hashPasswordMD5(password: string): string {
    const hash = CryptoJS.MD5(password).toString();
    console.log('🔍 [HASH] Password:', password, '-> MD5 Hash:', hash);
    return hash;
  }

  /**
   * Verificar contraseña usando MD5
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedInput = this.hashPasswordMD5(password);
    const isValid = hashedInput.toLowerCase() === hash.toLowerCase();
    console.log('🔍 [VERIFY] Input MD5 hash:', hashedInput);
    console.log('🔍 [VERIFY] Expected hash:', hash);
    console.log('🔍 [VERIFY] Match:', isValid);
    return isValid;
  }

  /**
   * Crear sesión en BD (tabla sesiones)
   */
  private async createSession(userId: string, token: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('sesiones')
        .insert({
          usuario_id: userId,
          token: token,
          activa: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [SESSION] Error al crear sesión:', error);
        throw error;
      }

      console.log('✅ [SESSION] Sesión creada correctamente:', data?.id);
    } catch (error) {
      console.error('❌ [SESSION] Error al crear sesión:', error);
      throw error;
    }
  }

  /**
   * Invalidar sesión
   */
  private async invalidateSession(token: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('sesiones')
        .update({ activa: false })
        .eq('token', token);

      if (error) {
        console.error('❌ [SESSION] Error al invalidar sesión:', error);
      } else {
        console.log('✅ [SESSION] Sesión invalidada correctamente');
      }
    } catch (error) {
      console.error('❌ [SESSION] Error al invalidar sesión:', error);
    }
  }

  /**
   * Actualizar último login (updated_at en tabla usuarios)
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('usuarios')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ [LOGIN] Error al actualizar último login:', error);
      } else {
        console.log('✅ [LOGIN] Último login actualizado');
      }
    } catch (error) {
      console.error('❌ [LOGIN] Error al actualizar último login:', error);
    }
  }

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
