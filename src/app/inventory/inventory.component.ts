import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
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
    ToastModule,
    AddProductModalComponent,
    ExportDialogComponent
  ],
  providers: [MessageService],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchValue: string = '';
  activeFilter: 'todos' | 'stock-bajo' | 'sin-movimiento' | 'ofertas' = 'todos';
  displayAddProductModal: boolean = false;
  displayExportDialog: boolean = false;
  loading: boolean = false;

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

    // Aplicar filtro de categoría
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  }

  showAddProductModal(): void {
    this.displayAddProductModal = true;
    // Bloquear scroll del body cuando el modal se abre
    document.body.style.overflow = 'hidden';
  }

  hideAddProductModal(): void {
    this.displayAddProductModal = false;
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
}
