import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import { AddProductModalComponent } from '../add-product-modal/add-product-modal.component';
import { ExportDialogComponent } from '../export-dialog/export-dialog.component';
import { ProductosService, Product } from '../services/productos.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    FormsModule,
    DialogModule,
    ImageModule,
    ToastModule,
    AddProductModalComponent,
    ExportDialogComponent
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchValue: string = '';
  activeFilter: 'todos' | 'stock-bajo' | 'sin-movimiento' | 'ofertas' = 'todos';
  categoryFilterValue: string = '';
  displayAddProductModal: boolean = false;
  displayExportDialog: boolean = false;
  displayDeleteConfirmDialog: boolean = false;
  loading: boolean = false;
  productToDelete: Product | null = null;
  productToEdit: Product | null = null;
  deleting: boolean = false;

  constructor(
    private productosService: ProductosService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadProductos();
  }

  /**
   * Cargar productos desde Supabase
   */
  loadProductos(): void {
    this.loading = true;
    this.productosService.getProductos().subscribe({
      next: (productos) => {
        this.products = productos;
        this.applyFilters();
        this.loading = false;
        console.log('✅ Productos cargados:', productos.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los productos. Intenta nuevamente.',
        });
      }
    });
  }

  /**
   * Refrescar inventario (recargar productos)
   */
  refreshProductos(): void {
    this.loadProductos();
    this.messageService.add({
      severity: 'info',
      summary: 'Actualizando',
      detail: 'Refrescando inventario...',
      life: 2000
    });
  }

  applyFilters() {
    let filtered = [...this.products];

    // Aplicar filtro de búsqueda
    if (this.searchValue) {
      const searchLower = this.searchValue.toLowerCase();
      filtered = filtered.filter(product =>
        product.producto.toLowerCase().includes(searchLower) ||
        (product.codigo && product.codigo.toLowerCase().includes(searchLower)) ||
        (product.categoria && product.categoria.toLowerCase().includes(searchLower))
      );
    }

    // Aplicar filtro por categoría (nombre, desde el header)
    if (this.categoryFilterValue?.trim()) {
      const catLower = this.categoryFilterValue.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        (p.categoria ?? '').toLowerCase().includes(catLower)
      );
    }

    // Aplicar filtros por pestañas (stock/ofertas)
    switch (this.activeFilter) {
      case 'stock-bajo':
        filtered = filtered.filter(product =>
          product.estado === 'stock-bajo' || product.stock <= product.stockMinimo
        );
        break;
      case 'sin-movimiento':
        // Productos con stock alto (sin movimiento)
        filtered = filtered.filter(product => product.stock > product.stockMinimo * 2);
        break;
      case 'ofertas':
        // Productos con margen alto (> 50%)
        filtered = filtered.filter(product => product.margen > 50);
        break;
      case 'todos':
      default:
        // No aplicar filtro adicional
        break;
    }

    this.filteredProducts = filtered;
  }

  getFilteredProductsCount(): number {
    return this.filteredProducts.length;
  }

  // Métodos para actualizar filtros
  set searchValueUpdated(value: string) {
    this.searchValue = value;
    this.applyFilters();
  }

  set activeFilterUpdated(value: 'todos' | 'stock-bajo' | 'sin-movimiento' | 'ofertas') {
    this.activeFilter = value;
    this.applyFilters();
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' {
    switch (estado) {
      case 'disponible':
        return 'success';
      case 'stock-bajo':
        return 'warn';
      case 'agotado':
        return 'danger';
      default:
        return 'success';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'disponible':
        return 'Disponible';
      case 'stock-bajo':
        return 'Stock Bajo';
      case 'agotado':
        return 'Agotado';
      default:
        return estado;
    }
  }

  formatCurrencyLempiras(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(value);
  }

  formatCurrencyUSD(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  }

  /**
   * Formatear margen con redondeo inteligente
   * - Si es un número entero (o muy cercano), mostrar como entero
   * - Si tiene decimales significativos, mostrar máximo 2 decimales
   */
  formatMargin(value: number): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }

    // Redondear a 2 decimales
    const rounded = Math.round(value * 100) / 100;

    // Si después de redondear a 2 decimales es muy cercano a un entero (diferencia < 0.01)
    const difference = Math.abs(rounded - Math.round(rounded));

    if (difference < 0.01) {
      // Mostrar como entero
      return Math.round(rounded).toString();
    } else {
      // Mostrar con máximo 2 decimales, eliminando ceros innecesarios
      return rounded.toFixed(2).replace(/\.?0+$/, '');
    }
  }

  /**
   * Obtener la URL de la imagen del producto, con fallback a imagen por defecto
   */
  getProductImageUrl(product: Product): string {
    const defaultImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

    // Si no hay imagen, es null, vacío, o es el valor por defecto '#f0f0f0', usar imagen por defecto
    if (!product.imagen ||
        product.imagen.trim() === '' ||
        product.imagen === '#f0f0f0' ||
        product.imagen === 'null') {
      return defaultImageUrl;
    }

    return product.imagen;
  }

  showAddProductModal(): void {
    this.productToEdit = null; // Asegurar que no hay producto para editar
    this.displayAddProductModal = true;
    // Bloquear scroll del body cuando el modal se abre
    document.body.style.overflow = 'hidden';
  }

  showEditProductModal(product: Product): void {
    this.productToEdit = product;
    this.displayAddProductModal = true;
    // Bloquear scroll del body cuando el modal se abre
    document.body.style.overflow = 'hidden';
  }

  hideAddProductModal(): void {
    this.displayAddProductModal = false;
    this.productToEdit = null; // Limpiar producto al cerrar
    // Restaurar scroll del body cuando el modal se cierra
    document.body.style.overflow = 'auto';
  }

  showExportDialog(): void {
    this.displayExportDialog = true;
    // Bloquear scroll del body cuando el modal se abre
    document.body.style.overflow = 'hidden';
  }

  hideExportDialog(): void {
    this.displayExportDialog = false;
    // Restaurar scroll del body cuando el modal se cierra
    document.body.style.overflow = 'auto';
  }

  /**
   * Manejar cuando se crea un producto nuevo
   */
  onProductCreated(): void {
    // Recargar productos cuando se cierra el modal después de crear uno
    this.loadProductos();
  }

  /**
   * Manejar cuando se actualiza un producto
   */
  onProductUpdated(): void {
    // Recargar productos cuando se cierra el modal después de actualizar uno
    this.loadProductos();
  }

  /**
   * Abrir modal de confirmación para eliminar producto
   */
  confirmDelete(product: Product): void {
    this.productToDelete = product;
    this.displayDeleteConfirmDialog = true;
    document.body.style.overflow = 'hidden';
  }

  /**
   * Cerrar modal de confirmación
   */
  cancelDelete(): void {
    this.displayDeleteConfirmDialog = false;
    this.productToDelete = null;
    document.body.style.overflow = 'auto';
  }

  /**
   * Confirmar y ejecutar eliminación del producto
   */
  deleteProduct(): void {
    if (!this.productToDelete) {
      return;
    }

    this.deleting = true;
    const productId = this.productToDelete.id;

    this.productosService.eliminarProducto(productId).subscribe({
      next: (success) => {
        this.deleting = false;
        if (success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Producto eliminado correctamente'
          });

          // Cerrar modal y recargar productos
          this.cancelDelete();
          this.loadProductos();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar el producto'
          });
        }
      },
      error: (error) => {
        this.deleting = false;
        console.error('❌ Error al eliminar producto:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Error al eliminar el producto. Intenta nuevamente.'
        });
      }
    });
  }
}
