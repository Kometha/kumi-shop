import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
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
  categoria_id: number | null;
  descripcion: string | null;
  stock: number;
  stockMinimo: number;
  costo: number;
  precio: number;
  margen: number;
  estado: 'disponible' | 'stock-bajo' | 'agotado';
}

// Interfaz para crear un nuevo producto
export interface NuevoProducto {
  nombre: string;
  codigo?: string | null;
  categoria_id: number;
  descripcion?: string | null;
  stock: number;
  stockMinimo: number;
  costo: number;
  precioVenta: number;
  estado: 'disponible' | 'stock-bajo' | 'agotado';
  imagen?: File; // Archivo de imagen opcional
  imagenUrl?: string; // URL de imagen opcional (si ya está subida)
  eliminarImagen?: boolean; // Flag para indicar que se debe eliminar la imagen
}

// Interfaz para las categorías
export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
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
          descripcion,
          categorias(id, nombre, descripcion),
          inventario(stock_actual, stock_minimo),
          precios(costo, precio_venta_lempiras, margen_porcentaje, margen_absoluto, activo),
          activo
        `)
        .eq('activo', true)
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [PRODUCTOS] Error al obtener productos:', response.error);
          throw new Error(response.error.message);
        }

        // console.log('✅ [PRODUCTOS] Productos obtenidos:', response.data?.length);
        // console.log('🔍 [PRODUCTOS] Estructura de datos:', JSON.stringify(response.data?.[0], null, 2));

        // Transformar los datos de Supabase al formato que usa el componente
        // Filtrar precios activos durante la transformación
        const productos = this.transformProductos(response.data as any[]);
        // console.log('✅ [PRODUCTOS] Productos transformados:', JSON.stringify(productos[0], null, 2));
        return productos;
      }),
      catchError((error) => {
        // console.error('❌ [PRODUCTOS] Error en petición:', error);
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
              precioVenta = precioActivo.precio_venta_lempiras ?? 0;
              margenPorcentaje = precioActivo.margen_porcentaje ?? 0;
              margenAbsoluto = precioActivo.margen_absoluto ?? 0;
            }
          }
        } else if (item.precios && typeof item.precios === 'object') {
          // Si viene como objeto único y está activo
          if (item.precios.activo === true) {
            costo = item.precios.costo ?? 0;
            precioVenta = item.precios.precio_venta_lempiras ?? 0;
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

        // Extraer información de categoría
        let categoriaNombre = 'Sin categoría';
        let categoriaId: number | null = null;

        if (item.categorias) {
          if (Array.isArray(item.categorias) && item.categorias.length > 0) {
            categoriaNombre = item.categorias[0].nombre || 'Sin categoría';
            categoriaId = item.categorias[0].id || null;
          } else if (item.categorias && typeof item.categorias === 'object') {
            categoriaNombre = item.categorias.nombre || 'Sin categoría';
            categoriaId = item.categorias.id || null;
          }
        } else if (item.categoria_id) {
          categoriaId = item.categoria_id;
        }

        return {
          id: item.id,
          imagen: item.imagen_url || '#f0f0f0',
          producto: item.nombre || 'Sin nombre',
          codigo: item.codigo_producto || `PROD-${item.id}`,
          categoria: categoriaNombre,
          categoria_id: categoriaId,
          descripcion: item.descripcion || null,
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
          descripcion,
          categorias(id, nombre, descripcion),
          inventario(stock_actual, stock_minimo),
          precios(costo, precio_venta_lempiras, margen_porcentaje, margen_absoluto, activo),
          activo
        `)
        .eq('id', id)
        .eq('activo', true)
        .single()
    ).pipe(
      map((response) => {
        if (response.error) {
          // console.error('❌ [PRODUCTOS] Error al obtener producto:', response.error);
          return null;
        }

        const productos = this.transformProductos([response.data]);
        return productos.length > 0 ? productos[0] : null;
      })
    );
  }


  /**
   * Subir imagen a Supabase Storage
   */
  private async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const fileName = `${timestamp}_${randomStr}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await this.supabase.storage
      .from('productos-imagenes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      // console.error('❌ [PRODUCTOS] Error al subir imagen:', error);
      throw new Error(`Error al subir imagen: ${error.message}`);
    }

    // Obtener URL pública de la imagen
    const { data: urlData } = this.supabase.storage
      .from('productos-imagenes')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('No se pudo obtener la URL pública de la imagen');
    }

    // console.log('✅ [PRODUCTOS] Imagen subida correctamente:', urlData.publicUrl);
    return urlData.publicUrl;
  }

  /**
   * Eliminar imagen del bucket de Supabase Storage
   * Extrae el nombre del archivo de la URL y lo elimina del bucket
   */
  private async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extraer el nombre del archivo de la URL
      // La URL de Supabase tiene formato: https://[project].supabase.co/storage/v1/object/public/productos-imagenes/[filename]
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      if (!fileName) {
        // console.warn('⚠️ [PRODUCTOS] No se pudo extraer el nombre del archivo de la URL:', imageUrl);
        return;
      }

      // Eliminar el archivo del bucket
      const { error } = await this.supabase.storage
        .from('productos-imagenes')
        .remove([fileName]);

      if (error) {
        // console.error('❌ [PRODUCTOS] Error al eliminar imagen del bucket:', error);
        // No lanzar error, solo loguear, para que la actualización del producto continúe
        // console.warn('⚠️ [PRODUCTOS] Continuando con la actualización aunque no se pudo eliminar la imagen del bucket');
      } else {
        // console.log('✅ [PRODUCTOS] Imagen eliminada del bucket:', fileName);
      }
    } catch (error: any) {
      // console.error('❌ [PRODUCTOS] Error al procesar eliminación de imagen:', error);
      // No lanzar error para que la actualización continúe
    }
  }

  /**
   * Crear un nuevo producto
   */
  crearProducto(producto: NuevoProducto): Observable<Product> {
    return from(
      (async () => {
        try {
          // 1. Subir imagen si existe
          let imagenUrl = producto.imagenUrl || null;
          if (producto.imagen && !imagenUrl) {
            imagenUrl = await this.uploadImage(producto.imagen);
          }

          // 2. Calcular margen
          const margenAbsoluto = producto.precioVenta - producto.costo;
          const margenPorcentaje = producto.costo > 0
            ? ((margenAbsoluto / producto.costo) * 100)
            : 0;

          // 3. Crear producto en la tabla productos
          const { data: productoData, error: productoError } = await this.supabase
            .from('productos')
            .insert({
              nombre: producto.nombre,
              categoria_id: producto.categoria_id,
              descripcion: producto.descripcion || null,
              imagen_url: imagenUrl,
              activo: true
            })
            .select()
            .single();

          if (productoError || !productoData) {
            // console.error('❌ [PRODUCTOS] Error al crear producto:', productoError);
            throw new Error(productoError?.message || 'Error al crear el producto');
          }

          // console.log('✅ [PRODUCTOS] Producto creado:', productoData.id);

          // 4. Crear registro en inventario
          const { error: inventarioError } = await this.supabase
            .from('inventario')
            .insert({
              producto_id: productoData.id,
              stock_actual: producto.stock,
              stock_minimo: producto.stockMinimo
            });

          if (inventarioError) {
            // console.error('❌ [PRODUCTOS] Error al crear inventario:', inventarioError);
            // Intentar eliminar el producto creado
            await this.supabase.from('productos').delete().eq('id', productoData.id);
            throw new Error(`Error al crear inventario: ${inventarioError.message}`);
          }

          // 5. Crear registro en precios
          const { error: preciosError } = await this.supabase
            .from('precios')
            .insert({
              producto_id: productoData.id,
              costo: producto.costo,
              precio_venta_lempiras: producto.precioVenta,
              margen_porcentaje: margenPorcentaje,
              margen_absoluto: margenAbsoluto,
              activo: true
            });

          if (preciosError) {
            // console.error('❌ [PRODUCTOS] Error al crear precios:', preciosError);
            // Intentar eliminar el producto y inventario creados
            await this.supabase.from('inventario').delete().eq('producto_id', productoData.id);
            await this.supabase.from('productos').delete().eq('id', productoData.id);
            throw new Error(`Error al crear precios: ${preciosError.message}`);
          }

          // console.log('✅ [PRODUCTOS] Producto creado completamente');

          // 6. Obtener el producto completo para retornarlo
          const productoCompleto = await this.getProductoById(productoData.id).toPromise();
          if (!productoCompleto) {
            throw new Error('No se pudo obtener el producto creado');
          }

          return productoCompleto;
        } catch (error: any) {
          // console.error('❌ [PRODUCTOS] Error en crearProducto:', error);
          throw error;
        }
      })()
    ).pipe(
      catchError((error) => {
        // console.error('❌ [PRODUCTOS] Error en crearProducto:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar un producto
   */
  actualizarProducto(id: number, producto: Partial<NuevoProducto>): Observable<Product> {
    return from(
      (async () => {
        try {
          // 1. Obtener imagen actual del producto antes de actualizar
          const { data: productoActual } = await this.supabase
            .from('productos')
            .select('imagen_url')
            .eq('id', id)
            .single();

          const imagenActual = productoActual?.imagen_url;

          // 2. Manejar eliminación de imagen
          if (producto.eliminarImagen && imagenActual) {
            // Eliminar la imagen del bucket
            await this.deleteImage(imagenActual);
          }

          // 3. Subir nueva imagen si existe
          let imagenUrl = producto.imagenUrl || null;
          if (producto.imagen && !imagenUrl) {
            // Si hay una imagen nueva, eliminar la anterior si existe
            if (imagenActual && !producto.eliminarImagen) {
              await this.deleteImage(imagenActual);
            }
            imagenUrl = await this.uploadImage(producto.imagen);
          }

          // 4. Calcular margen si se actualizan costo o precio
          let margenAbsoluto = 0;
          let margenPorcentaje = 0;

          if (producto.costo !== undefined && producto.precioVenta !== undefined) {
            margenAbsoluto = producto.precioVenta - producto.costo;
            margenPorcentaje = producto.costo > 0
              ? ((margenAbsoluto / producto.costo) * 100)
              : 0;
          }

          // 5. Actualizar producto en la tabla productos
          const updateData: any = {};
          if (producto.nombre) updateData.nombre = producto.nombre;
          if (producto.categoria_id !== undefined) updateData.categoria_id = producto.categoria_id;
          if (producto.descripcion !== undefined) updateData.descripcion = producto.descripcion || null;

          // Manejar imagen_url: null si se elimina sin nueva imagen, nueva URL si se sube nueva, mantener si no cambia
          if (producto.eliminarImagen && !producto.imagen && imagenUrl === null) {
            // Se eliminó la imagen y no se subió una nueva
            updateData.imagen_url = null;
          } else if (imagenUrl !== null) {
            // Hay una nueva imagen (ya sea nueva subida o la misma que se mantiene)
            updateData.imagen_url = imagenUrl;
          }
          // Si no se cumple ninguna condición, no se actualiza imagen_url (se mantiene la actual)

          if (Object.keys(updateData).length > 0) {
            const { error: productoError } = await this.supabase
              .from('productos')
              .update(updateData)
              .eq('id', id);

            if (productoError) {
              // console.error('❌ [PRODUCTOS] Error al actualizar producto:', productoError);
              throw new Error(`Error al actualizar producto: ${productoError.message}`);
            }
          }

          // 4. Actualizar inventario si se proporciona stock
          if (producto.stock !== undefined || producto.stockMinimo !== undefined) {
            const inventarioData: any = {};
            if (producto.stock !== undefined) inventarioData.stock_actual = producto.stock;
            if (producto.stockMinimo !== undefined) inventarioData.stock_minimo = producto.stockMinimo;

            const { error: inventarioError } = await this.supabase
              .from('inventario')
              .update(inventarioData)
              .eq('producto_id', id);

            if (inventarioError) {
              console.error('❌ [PRODUCTOS] Error al actualizar inventario:', inventarioError);
              throw new Error(`Error al actualizar inventario: ${inventarioError.message}`);
            }
          }

          // 5. Actualizar precios si se proporcionan costo o precioVenta
          if (producto.costo !== undefined || producto.precioVenta !== undefined) {
            const preciosData: any = {};
            if (producto.costo !== undefined) preciosData.costo = producto.costo;
            if (producto.precioVenta !== undefined) preciosData.precio_venta_lempiras = producto.precioVenta;
            if (margenPorcentaje !== 0) preciosData.margen_porcentaje = margenPorcentaje;
            if (margenAbsoluto !== 0) preciosData.margen_absoluto = margenAbsoluto;

            const { error: preciosError } = await this.supabase
              .from('precios')
              .update(preciosData)
              .eq('producto_id', id)
              .eq('activo', true);

            if (preciosError) {
              console.error('❌ [PRODUCTOS] Error al actualizar precios:', preciosError);
              throw new Error(`Error al actualizar precios: ${preciosError.message}`);
            }
          }

          console.log('✅ [PRODUCTOS] Producto actualizado completamente');

          // 6. Obtener el producto completo actualizado para retornarlo
          const productoCompleto = await this.getProductoById(id).toPromise();
          if (!productoCompleto) {
            throw new Error('No se pudo obtener el producto actualizado');
          }

          return productoCompleto;
        } catch (error: any) {
          console.error('❌ [PRODUCTOS] Error en actualizarProducto:', error);
          throw error;
        }
      })()
    ).pipe(
      catchError((error) => {
        console.error('❌ [PRODUCTOS] Error en actualizarProducto:', error);
        return throwError(() => error);
      })
    );
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

  /**
   * Obtener todas las categorías activas
   */
  getCategorias(): Observable<Categoria[]> {
    return from(
      this.supabase
        .from('categorias')
        .select('id, nombre, descripcion, activo')
        .eq('activo', true)
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error('❌ [PRODUCTOS] Error al obtener categorías:', response.error);
          throw new Error(response.error.message);
        }
        console.log('✅ [PRODUCTOS] Categorías obtenidas:', response.data?.length);
        return response.data as Categoria[];
      }),
      catchError((error) => {
        console.error('❌ [PRODUCTOS] Error en petición de categorías:', error);
        throw error;
      })
    );
  }
}

