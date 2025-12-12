import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProductosService, Product } from '../services/productos.service';
import { VentasService } from '../services/ventas.service';
import { Pedido } from '../services/interfaces/ventas.interfaces';
import { NuevaVentaModalComponent } from '../nueva-venta-modal/nueva-venta-modal.component';
import { SeleccionarProductosModalComponent } from '../seleccionar-productos-modal/seleccionar-productos-modal.component';

@Component({
  selector: 'app-ventas',
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
    NuevaVentaModalComponent,
    SeleccionarProductosModalComponent,
  ],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.scss',
})
export class VentasComponent implements OnInit {
  searchValue: string = '';
  loadingVentas: boolean = false;
  ventas: Pedido[] = [];
  filteredVentas: Pedido[] = [];

  // Modales
  displayNuevaVentaModal: boolean = false;
  displaySeleccionarProductosModal: boolean = false;
  
  @ViewChild('nuevaVentaModal') nuevaVentaModalRef!: NuevaVentaModalComponent;
  productosDisponibles: Product[] = [];

  constructor(
    private productosService: ProductosService,
    private ventasService: VentasService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadProductos();
    this.loadVentas();
  }

  loadVentas(): void {
    this.loadingVentas = true;
    this.ventasService.getVentas().subscribe({
      next: (ventas) => {
        this.ventas = ventas;
        this.filteredVentas = ventas;
        this.loadingVentas = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar ventas:', error);
        this.loadingVentas = false;
      },
      complete: () => {
        this.loadingVentas = false;
      },
    });
  }

  loadProductos(): void {
    this.productosService.getProductos().subscribe({
      next: (productos) => {
        this.productosDisponibles = productos;
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
      },
    });
  }

  // Métodos placeholder (sin lógica aún)
  applyFilters(): void {
    // Lógica futura
  }

  getFilteredVentasCount(): number {
    return this.filteredVentas.length;
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (estado) {
      case 'completado':
        return 'success';
      case 'pendiente':
        return 'warn';
      case 'cancelado':
        return 'danger';
      default:
        return 'info';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'completado':
        return 'Completado';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado;
    }
  }

  // Métodos para el modal de nueva venta
  showNuevaVentaModal(): void {
    this.displayNuevaVentaModal = true;
    document.body.style.overflow = 'hidden';
  }

  onVentaGuardada(): void {
    this.loadVentas();
  }

  onAbrirSeleccionProductos(): void {
    this.displaySeleccionarProductosModal = true;
    document.body.style.overflow = 'hidden';
  }

  onProductosSeleccionados(productos: Array<{ producto: Product; cantidad: number }>): void {
    // Usar setTimeout para asegurar que la referencia esté disponible
    setTimeout(() => {
      if (this.nuevaVentaModalRef) {
        this.nuevaVentaModalRef.agregarProductos(productos);
      }
    }, 0);
    document.body.style.overflow = 'hidden'; // Restaurar overflow para el modal de nueva venta
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2,
    }).format(value);
  }

  formatDate(fecha: Date | string | null | undefined): string {
    if (!fecha) {
      return '-';
    }

    try {
      const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
      
      // Verificar que la fecha sea válida
      if (isNaN(date.getTime())) {
        return '-';
      }

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return '-';
    }
  }

}
