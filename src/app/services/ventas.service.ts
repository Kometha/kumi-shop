import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Pedido } from './interfaces/ventas.interfaces';

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

// Interfaz para la respuesta de crear_venta_completa
export interface CrearVentaResponse {
  pedido_id: number | null;
  mensaje: string;
  exito: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Obtener el cliente de Supabase (siempre actualizado)
   */
  private get supabase(): SupabaseClient {
    return this.supabaseService.getClient();
  }

  /**
   * Obtener headers de autenticación para queries
   */
  private getAuthHeaders(): Record<string, string> {
    return this.supabaseService.getAuthHeaders();
  }

  getVentas(): Observable<Pedido[]> {
    return from(
      this.supabase
        .schema('ventas')
        .from('vw_pedidos')
        .select('*')
        .headers(this.getAuthHeaders())
    ).pipe(
      map((response) => {
        return response.data as Pedido[];
      }),
      catchError((error) => {
        console.error('❌ [VENTAS] Error al obtener ventas:', error);
        throw error;
      })
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
        .headers(this.getAuthHeaders())
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
        .headers(this.getAuthHeaders())
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
        .headers(this.getAuthHeaders())
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
        .headers(this.getAuthHeaders())
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

  /**
   * Crear una venta completa usando la función SQL crear_venta_completa
   */
  crearVentaCompleta(ventaJSON: any): Observable<CrearVentaResponse> {
    return from(
      this.supabase
        .schema('ventas')
        .rpc('crear_venta_completa', { p_venta_json: ventaJSON })
        .headers(this.getAuthHeaders())
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [VENTAS] Error al crear venta:', response.error);
          throw new Error(response.error.message);
        }
        
        // La función retorna un array con un objeto
        const resultado = response.data && response.data.length > 0 
          ? response.data[0] 
          : null;
        
        if (!resultado) {
          throw new Error('No se recibió respuesta de la función crear_venta_completa');
        }

        console.log('✅ [VENTAS] Venta creada:', resultado);
        return resultado as CrearVentaResponse;
      }),
      catchError((error) => {
        console.error('❌ [VENTAS] Error en petición de crear venta:', error);
        throw error;
      })
    );
  }
}

