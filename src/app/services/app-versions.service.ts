import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

// Interfaz para las versiones de la app
export interface AppVersion {
  id: number;
  version_name: string;
  description: string | null;
  apk_url: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AppVersionsService {
  private supabase: SupabaseClient;

  constructor(private supabaseService: SupabaseService) {
    // Usar el cliente compartido de Supabase que incluye headers de autenticación
    this.supabase = this.supabaseService.getClient();
  }

  /**
   * Obtener todas las versiones de la aplicación
   */
  getAppVersions(): Observable<AppVersion[]> {
    return from(
      this.supabase
        .from('app_versions')
        .select('id, version_name, description, apk_url')
        .order('id', { ascending: false })
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [APP_VERSIONS] Error al obtener versiones:', response.error);
          throw new Error(response.error.message);
        }
        console.log('✅ [APP_VERSIONS] Versiones obtenidas:', response.data?.length);
        return response.data as AppVersion[];
      }),
      catchError((error) => {
        console.error('❌ [APP_VERSIONS] Error en petición:', error);
        throw error;
      })
    );
  }
}

