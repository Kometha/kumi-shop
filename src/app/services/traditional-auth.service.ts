import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

// Interfaces para el nuevo sistema
export interface User {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  email: string;
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
  email: string;
  name: string;
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
            console.log('✅ [AUTH] Usuario restaurado desde token:', user.email);
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
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.error('User not found or inactive:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        isActive: data.is_active,
        emailVerified: data.email_verified,
        createdAt: data.created_at,
        lastLoginAt: data.last_login_at
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

      // 1. Buscar usuario por email
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email.toLowerCase())
        .eq('is_active', true)
        .single();

      console.log('🔍 [LOGIN] Resultado consulta usuario:', { userData, userError });

      if (userError || !userData) {
        console.log('❌ [LOGIN] Usuario no encontrado o error:', userError);
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      console.log('✅ [LOGIN] Usuario encontrado:', userData.email);

            // 2. Verificar contraseña (simulado - en producción usar bcrypt en backend)
      console.log('🔍 [LOGIN] Verificando contraseña...');
      console.log('🔍 [LOGIN] Password input:', credentials.password);
      console.log('🔍 [LOGIN] Hash en BD:', userData.password_hash);

      const isPasswordValid = await this.verifyPassword(credentials.password, userData.password_hash);
      console.log('🔍 [LOGIN] Password válida:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('❌ [LOGIN] Contraseña inválida');
        // Incrementar intentos fallidos
        await this.incrementLoginAttempts(userData.id);
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      console.log('✅ [LOGIN] Contraseña correcta');

      // 3. Generar token JWT
      const token = this.generateToken({
        userId: userData.id,
        email: userData.email,
        name: userData.name || userData.email
      });

      // 4. Guardar sesión en BD
      await this.createSession(userData.id, token);

      // 5. Actualizar último login
      await this.updateLastLogin(userData.id);

      // 6. Crear objeto user
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        isActive: userData.is_active,
        emailVerified: userData.email_verified,
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

      // 2. Hash de la contraseña (simulado - en producción usar bcrypt)
      const passwordHash = await this.hashPassword(credentials.password);

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
  private generateToken(payload: { userId: string; email: string; name: string }): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload: TokenPayload = {
      ...payload,
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
   * Hash de contraseña (simplificado - usar bcrypt en producción)
   */
  private async hashPassword(password: string): Promise<string> {
    // En producción, usar bcrypt o similar
    const result = btoa(password + 'salt_kumi_shop_2024');
    console.log('🔍 [HASH] Password:', password, '-> Hash:', result);
    return result;
  }

  /**
   * Verificar contraseña
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedInput = await this.hashPassword(password);
    const isValid = hashedInput === hash;
    console.log('🔍 [VERIFY] Input hash:', hashedInput);
    console.log('🔍 [VERIFY] Expected hash:', hash);
    console.log('🔍 [VERIFY] Match:', isValid);
    return isValid;
  }

  /**
   * Crear sesión en BD
   */
  private async createSession(userId: string, token: string): Promise<void> {
    const tokenHash = btoa(token); // Simplificado
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    await this.supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        ip_address: '0.0.0.0', // En producción obtener IP real
        user_agent: navigator.userAgent,
        is_active: true
      });
  }

  /**
   * Invalidar sesión
   */
  private async invalidateSession(token: string): Promise<void> {
    const tokenHash = btoa(token);
    await this.supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('token_hash', tokenHash);
  }

  /**
   * Incrementar intentos de login
   */
  private async incrementLoginAttempts(userId: string): Promise<void> {
    await this.supabase
      .from('users')
      .update({
        login_attempts: this.supabase.from('users').select('login_attempts').eq('id', userId)
      })
      .eq('id', userId);
  }

  /**
   * Actualizar último login
   */
  private async updateLastLogin(userId: string): Promise<void> {
    await this.supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        login_attempts: 0
      })
      .eq('id', userId);
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
