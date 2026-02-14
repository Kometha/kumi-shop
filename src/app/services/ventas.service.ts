import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseClient } from '@supabase/supabase-js';
import { Pedido } from './interfaces/ventas.interfaces';
import { SupabaseService } from './supabase.service';

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

// Interfaz para el resumen del dashboard
export interface DashboardResumen {
  totalVentas: {
    mesActual: number;
    mesAnterior: number;
    porcentaje: number;
    esPositivo: boolean;
  };
  pedidos: {
    mesActual: number;
    mesAnterior: number;
    porcentaje: number;
    esPositivo: boolean;
  };
}

// Interfaz para la respuesta de crear_venta_completa
export interface CrearVentaResponse {
  pedido_id: number | null;
  mensaje: string;
  exito: boolean;
}

// Interfaz para DetallePedidoCompleto
export interface DetallePedidoCompleto {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  pedido_id: number;
  descuento: number;
  producto?: {
    id: number;
    producto: string;
    imagen_url: string | null;
    numero_codigo_barra: string | null;
  };
}

// Interfaz para PedidoCompleto
export interface PedidoCompleto {
  id: number;
  isv: number | null;
  notas: string | null;
  total: number;
  canal_id: number;
  estado_id: number;
  cliente_id: number | null;
  created_at: string;
  updated_at: string;
  costo_envio: number | null;
  ignorar_isv: boolean;
  fecha_pedido: string;
  codigo_pedido: number;
  total_factura: number | null;
  necesita_envio: boolean;
  nombre_cliente: string;
  telefono_cliente: string;
  direccion_cliente: string | null;
  subtotal_productos: number | null;
  monto_neto_recibido: number | null;
  total_comisiones_metodos: number | null;
  total_comisiones_financiamiento: number | null;
  tipo_envio_id: number | null;
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
   * Obtener resumen del dashboard (ventas y pedidos)
   */
  getDashboardResumen(): Observable<DashboardResumen | null> {
    return from(
      (async () => {
        const { data, error } = await this.supabase
          .schema('ventas')
          .rpc('dashboard_resumen');

        if (error) {
          console.error('❌ [VENTAS] Error al obtener dashboard resumen:', error);
          throw error;
        }

        if (!data) return null;
        const resumen = Array.isArray(data) && data.length > 0 ? data[0] : data;
        return resumen as DashboardResumen;
      })()
    ).pipe(
      catchError((error) => {
        console.error('❌ [VENTAS] Error en getDashboardResumen:', error);
        return of(null);
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

  /**
   * Obtener los detalles de un pedido con información del producto
   */
  getDetallesPedido(pedidoId: number): Observable<DetallePedidoCompleto[]> {
    return from(
      (async () => {
        // Primero obtener los detalles del pedido
        const { data: detalles, error: detallesError } = await this.supabase
          .schema('ventas')
          .from('pedidos_detalle')
          .select('id, producto_id, cantidad, precio_unitario, subtotal, pedido_id, descuento')
          .eq('pedido_id', pedidoId);

        if (detallesError) {
          console.error('❌ [VENTAS] Error al obtener detalles del pedido:', detallesError);
          throw new Error(detallesError.message);
        }

        if (!detalles || detalles.length === 0) {
          return [];
        }

        // Obtener los IDs de productos únicos
        const productoIds = [...new Set(detalles.map((d: any) => d.producto_id))];

        // Obtener información de los productos desde el schema public
        const { data: productos, error: productosError } = await this.supabase
          .schema('public')
          .from('productos')
          .select('id, nombre, descripcion, imagen_url, numero_codigo_barra')
          .in('id', productoIds);

        if (productosError) {
          console.error('❌ [VENTAS] Error al obtener productos:', productosError);
          throw new Error(productosError.message);
        }

        // Crear un mapa de productos por ID para acceso rápido
        const productosMap = new Map(
          (productos || []).map((p: any) => [p.id, p])
        );

        // Combinar detalles con información de productos
        const detallesCompletos = detalles.map((detalle: any) => {
          const producto = productosMap.get(detalle.producto_id);
          return {
            id: detalle.id,
            producto_id: detalle.producto_id,
            cantidad: detalle.cantidad,
            precio_unitario: detalle.precio_unitario,
            subtotal: detalle.subtotal,
            pedido_id: detalle.pedido_id,
            descuento: detalle.descuento || 0,
            producto: producto
              ? {
                  id: producto.id,
                  producto: producto.nombre,
                  imagen_url: producto.imagen_url,
                  numero_codigo_barra: producto.numero_codigo_barra,
                }
              : undefined,
          } as DetallePedidoCompleto;
        });

        console.log('✅ [VENTAS] Detalles del pedido obtenidos:', detallesCompletos.length);
        return detallesCompletos;
      })()
    ).pipe(
      catchError((error) => {
        console.error('❌ [VENTAS] Error en petición de detalles del pedido:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener la información completa de un pedido
   */
  getPedidoCompleto(pedidoId: number): Observable<PedidoCompleto | null> {
    return from(
      this.supabase
        .schema('ventas')
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single()
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [VENTAS] Error al obtener pedido completo:', response.error);
          throw new Error(response.error.message);
        }
        console.log('✅ [VENTAS] Pedido completo obtenido:', response.data);
        return response.data as PedidoCompleto;
      }),
      catchError((error) => {
        console.error('❌ [VENTAS] Error en petición de pedido completo:', error);
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

  /**
   * Obtener los métodos de pago de un pedido
   */
  getMetodosPagoPedido(pedidoId: number): Observable<Array<{ metodo_pago_id: number; monto_aplicado: number }>> {
    return from(
      this.supabase
        .schema('ventas')
        .from('pedidos_pagos')
        .select('metodo_pago_id, monto_aplicado')
        .eq('pedido_id', pedidoId)
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [VENTAS] Error al obtener métodos de pago del pedido:', response.error);
          throw new Error(response.error.message);
        }
        console.log('✅ [VENTAS] Métodos de pago obtenidos:', response.data?.length);
        return (response.data || []) as Array<{ metodo_pago_id: number; monto_aplicado: number }>;
      }),
      catchError((error) => {
        console.error('❌ [VENTAS] Error en petición de métodos de pago:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener el envío de un pedido
   */
  getEnvioPedido(pedidoId: number): Observable<{ tipo_envio_id: number | null } | null> {
    console.log('🔍 [VENTAS] Buscando envío para pedido_id:', pedidoId);
    return from(
      this.supabase
        .schema('ventas')
        .from('envios')
        .select('tipo_envio_id')
        .eq('pedido_id', pedidoId)
        .maybeSingle()
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [VENTAS] Error al obtener envío del pedido:', response.error);
          // Si no hay envío, retornar null en lugar de lanzar error
          if (response.error.code === 'PGRST116') {
            // Código cuando no se encuentra ningún registro
            console.log('ℹ️ [VENTAS] No se encontró registro de envío para este pedido (PGRST116)');
            return null;
          }
          throw new Error(response.error.message);
        }
        console.log('✅ [VENTAS] Envío del pedido obtenido:', response.data);
        if (response.data) {
          console.log('   tipo_envio_id:', response.data.tipo_envio_id);
        }
        return response.data as { tipo_envio_id: number | null } | null;
      }),
      catchError((error) => {
        console.error('❌ [VENTAS] Error en petición de envío del pedido:', error);
        // Si es un error de "no encontrado", retornar null en lugar de lanzar error
        if (error.message && error.message.includes('PGRST116')) {
          return of(null);
        }
        throw error;
      })
    );
  }

  /**
   * Actualizar una venta completa
   * NOTA: Necesitarás crear una función SQL en el backend llamada 'actualizar_venta_completa'
   * que reciba el pedido_id y el JSON de la venta actualizada
   */
  actualizarVentaCompleta(pedidoId: number, ventaJSON: any): Observable<{ exito: boolean; mensaje: string }> {
    return from(
      this.supabase
        .schema('ventas')
        .rpc('actualizar_venta_completa', { 
          p_pedido_id: pedidoId,
          p_venta_json: ventaJSON 
        })
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [VENTAS] Error al actualizar venta:', response.error);
          throw new Error(response.error.message);
        }
        
        // La función retorna un array con un objeto
        const resultado = response.data && response.data.length > 0 
          ? response.data[0] 
          : null;
        
        if (!resultado) {
          throw new Error('No se recibió respuesta de la función actualizar_venta_completa');
        }

        console.log('✅ [VENTAS] Venta actualizada:', resultado);
        return resultado as { exito: boolean; mensaje: string };
      }),
      catchError((error) => {
        console.error('❌ [VENTAS] Error en petición de actualizar venta:', error);
        throw error;
      })
    );
  }
}

