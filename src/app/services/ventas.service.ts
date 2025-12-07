import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

// Interfaz para Canal
export interface Canal {
  id: number;
  nombre: string;
  url_icono: string | null;
}

// Interfaz para EstadoPedido
export interface EstadoPedido {
  id: number;
  nombre: string;
}

// Interfaz para MetodoPago
export interface MetodoPago {
  id: number;
  nombre: string;
  tipo: string;
  comision_porcentaje: number | null;
  comision_fija: number | null;
  meses_plazo: number | null;
  comision_pos_porcentaje: number | null;
  activo: boolean;
}

// Interfaz para TipoEnvio
export interface TipoEnvio {
  id: number;
  nombre: string;
  tipo: string;
  costo_base: number | null;
  es_costo_fijo: boolean;
  activo: boolean;
  descripcion: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  /**
   * Obtener todos los canales activos del schema ventas
   */
  getCanales(): Observable<Canal[]> {
    return from(
      this.supabase
        .schema('ventas')
        .from('canales')
        .select('id, nombre, url_icono')
        .eq('activo', true)
        .order('nombre', { ascending: true })
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [VENTAS] Error al obtener canales:', response.error);
          throw new Error(response.error.message);
        }
        console.log('✅ [VENTAS] Canales obtenidos:', response.data?.length);
        return response.data as Canal[];
      }),
      catchError((error) => {
        console.error('❌ [VENTAS] Error en petición de canales:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener todos los estados de pedido activos del schema ventas
   */
  getEstadosPedido(): Observable<EstadoPedido[]> {
    return from(
      this.supabase
        .schema('ventas')
        .from('estados_pedido')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre', { ascending: true })
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [VENTAS] Error al obtener estados de pedido:', response.error);
          throw new Error(response.error.message);
        }
        console.log('✅ [VENTAS] Estados de pedido obtenidos:', response.data?.length);
        return response.data as EstadoPedido[];
      }),
      catchError((error) => {
        console.error('❌ [VENTAS] Error en petición de estados de pedido:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener todos los métodos de pago activos del schema ventas
   */
  getMetodosPago(): Observable<MetodoPago[]> {
    return from(
      this.supabase
        .schema('ventas')
        .from('metodos_pago')
        .select('id, nombre, tipo, comision_porcentaje, comision_fija, meses_plazo, comision_pos_porcentaje, activo')
        .eq('activo', true)
        .order('nombre', { ascending: true })
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [VENTAS] Error al obtener métodos de pago:', response.error);
          throw new Error(response.error.message);
        }
        console.log('✅ [VENTAS] Métodos de pago obtenidos:', response.data?.length);
        return response.data as MetodoPago[];
      }),
      catchError((error) => {
        console.error('❌ [VENTAS] Error en petición de métodos de pago:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener todos los tipos de envío activos del schema ventas
   */
  getTiposEnvio(): Observable<TipoEnvio[]> {
    return from(
      this.supabase
        .schema('ventas')
        .from('tipos_envio')
        .select('id, nombre, tipo, costo_base, es_costo_fijo, activo, descripcion')
        .eq('activo', true)
        .order('nombre', { ascending: true })
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [VENTAS] Error al obtener tipos de envío:', response.error);
          throw new Error(response.error.message);
        }
        console.log('✅ [VENTAS] Tipos de envío obtenidos:', response.data?.length);
        return response.data as TipoEnvio[];
      }),
      catchError((error) => {
        console.error('❌ [VENTAS] Error en petición de tipos de envío:', error);
        throw error;
      })
    );
  }
}

