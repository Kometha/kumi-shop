import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

// Interfaz para los datos que vienen de Supabase
export interface ProductoFromDB {
  id: number;
  imagen: string | null;
  nombreProducto: string;
  stock: number | null;
  stockMinimo: number | null;
  costo: number | null;
  precioVenta: number | null;
  margenPorcentaje: number | null;
  margenAbsoluto: number | null;
  estado: boolean;
}

// Interfaz para el producto transformado que usa el componente
export interface Product {
  id: number;
  imagen: string;
  producto: string;
  codigo: string;
  categoria: string;
  stock: number;
  stockMinimo: number;
  costo: number;
  precio: number;
  margen: number;
  estado: 'disponible' | 'stock-bajo' | 'agotado';
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  /**
   * Obtener todos los productos activos con sus relaciones
   */
  getProductos(): Observable<Product[]> {
    return from(
      this.supabase
        .from('productos')
        .select(`
          id,
          imagen_url,
          nombre,
          codigo_producto,
          categoria_id,
          inventario(stock_actual, stock_minimo),
          precios(costo, precio_venta, margen_porcentaje, margen_absoluto, activo),
          activo
        `)
        .eq('activo', true)
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [PRODUCTOS] Error al obtener productos:', response.error);
          throw new Error(response.error.message);
        }

        console.log('✅ [PRODUCTOS] Productos obtenidos:', response.data?.length);
        console.log('🔍 [PRODUCTOS] Estructura de datos:', JSON.stringify(response.data?.[0], null, 2));
        
        // Transformar los datos de Supabase al formato que usa el componente
        // Filtrar precios activos durante la transformación
        const productos = this.transformProductos(response.data as any[]);
        console.log('✅ [PRODUCTOS] Productos transformados:', JSON.stringify(productos[0], null, 2));
        return productos;
      }),
      catchError((error) => {
        console.error('❌ [PRODUCTOS] Error en petición:', error);
        throw error;
      })
    );
  }

  /**
   * Transformar productos de Supabase al formato del componente
   */
  private transformProductos(data: any[]): Product[] {
    return data
      .map((item) => {
        // Extraer valores de inventario (puede venir como array o objeto único)
        let stock = 0;
        let stockMinimo = 0;
        
        if (Array.isArray(item.inventario)) {
          // Si viene como array, tomar el primer elemento
          if (item.inventario.length > 0) {
            const inventario = item.inventario[0];
            stock = inventario?.stock_actual ?? 0;
            stockMinimo = inventario?.stock_minimo ?? 0;
          }
        } else if (item.inventario && typeof item.inventario === 'object') {
          // Si viene como objeto único
          stock = item.inventario.stock_actual ?? 0;
          stockMinimo = item.inventario.stock_minimo ?? 0;
        }

        // Extraer valores de precios (puede venir como array o objeto único)
        // Filtrar solo los activos
        let costo = 0;
        let precioVenta = 0;
        let margenPorcentaje = 0;
        let margenAbsoluto = 0;

        if (Array.isArray(item.precios)) {
          // Si viene como array, buscar el precio activo, si no hay, tomar el primero
          if (item.precios.length > 0) {
            const precioActivo = item.precios.find((p: any) => p.activo === true) || item.precios[0];
            if (precioActivo) {
              costo = precioActivo.costo ?? 0;
              precioVenta = precioActivo.precio_venta ?? 0;
              margenPorcentaje = precioActivo.margen_porcentaje ?? 0;
              margenAbsoluto = precioActivo.margen_absoluto ?? 0;
            }
          }
        } else if (item.precios && typeof item.precios === 'object') {
          // Si viene como objeto único y está activo
          if (item.precios.activo === true) {
            costo = item.precios.costo ?? 0;
            precioVenta = item.precios.precio_venta ?? 0;
            margenPorcentaje = item.precios.margen_porcentaje ?? 0;
            margenAbsoluto = item.precios.margen_absoluto ?? 0;
          }
        }

        // Calcular estado basado en stock
        let estado: 'disponible' | 'stock-bajo' | 'agotado' = 'disponible';
        if (stock === 0) {
          estado = 'agotado';
        } else if (stockMinimo > 0 && stock <= stockMinimo) {
          estado = 'stock-bajo';
        }

        return {
          id: item.id,
          imagen: item.imagen_url || '#f0f0f0',
          producto: item.nombre || 'Sin nombre',
          codigo: item.codigo_producto || `PROD-${item.id}`,
          categoria: item.categoria_id ? `Categoría ${item.categoria_id}` : 'Sin categoría',
          stock: Number(stock) || 0,
          stockMinimo: Number(stockMinimo) || 0,
          costo: Number(costo) || 0,
          precio: Number(precioVenta) || 0,
          margen: Number(margenPorcentaje) || 0,
          estado: estado
        };
      });
  }

  /**
   * Obtener un producto por ID
   */
  getProductoById(id: number): Observable<Product | null> {
    return from(
      this.supabase
        .from('productos')
        .select(`
          id,
          imagen_url,
          nombre,
          codigo_producto,
          categoria_id,
          inventario(stock_actual, stock_minimo),
          precios(costo, precio_venta, margen_porcentaje, margen_absoluto, activo),
          activo
        `)
        .eq('id', id)
        .eq('activo', true)
        .single()
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [PRODUCTOS] Error al obtener producto:', response.error);
          return null;
        }

        const productos = this.transformProductos([response.data]);
        return productos.length > 0 ? productos[0] : null;
      })
    );
  }

  /**
   * Crear un nuevo producto
   */
  crearProducto(producto: Partial<Product>): Observable<Product> {
    // Implementar según la estructura de tu BD
    throw new Error('Método no implementado aún');
  }

  /**
   * Actualizar un producto
   */
  actualizarProducto(id: number, producto: Partial<Product>): Observable<Product> {
    // Implementar según la estructura de tu BD
    throw new Error('Método no implementado aún');
  }

  /**
   * Eliminar un producto (marcar como inactivo)
   */
  eliminarProducto(id: number): Observable<boolean> {
    return from(
      this.supabase
        .from('productos')
        .update({ activo: false })
        .eq('id', id)
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [PRODUCTOS] Error al eliminar producto:', response.error);
          return false;
        }
        return true;
      })
    );
  }
}

