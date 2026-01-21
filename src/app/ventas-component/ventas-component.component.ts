import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { DetallePedidoModalComponent } from '../detalle-pedido-modal/detalle-pedido-modal.component';
import { EditarVentaModalComponent } from '../editar-venta-modal/editar-venta-modal.component';

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
    DetallePedidoModalComponent,
    EditarVentaModalComponent,
  ],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.scss',
})
export class VentasComponent implements OnInit {
  searchValue: string = '';
  loadingVentas: boolean = false;
  loading: boolean = false;
  ventas: Pedido[] = []; // Placeholder para datos futuros
  filteredVentas: Pedido[] = []; // Placeholder para datos futuros

  // Modales
  displayNuevaVentaModal: boolean = false;
  displaySeleccionarProductosModal: boolean = false;
  displayDetallePedidoModal: boolean = false;
  displayEditarVentaModal: boolean = false;
  pedidoIdSeleccionado: number | null = null;
  pedidoIdParaEditar: number | null = null;
  
  @ViewChild('nuevaVentaModal') nuevaVentaModalRef!: NuevaVentaModalComponent;
  @ViewChild('editarVentaModal') editarVentaModalRef!: EditarVentaModalComponent;
  productosDisponibles: Product[] = [];

  constructor(
    private productosService: ProductosService,
    private ventasService: VentasService,
    private messageService: MessageService,
    private router: Router
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

  navigateToNuevaVenta(): void {
    this.router.navigate(['/ventas/nueva']);
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
      // Si el modal de nueva venta está abierto, agregar productos ahí
      if (this.displayNuevaVentaModal && this.nuevaVentaModalRef) {
        this.nuevaVentaModalRef.agregarProductos(productos);
      }
      // Si el modal de editar venta está abierto, agregar productos ahí
      if (this.displayEditarVentaModal && this.editarVentaModalRef) {
        this.editarVentaModalRef.agregarProductos(productos);
      }
    }, 0);
    document.body.style.overflow = 'hidden'; // Restaurar overflow para el modal activo
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

  // Método para abrir el modal de detalles del pedido
  verDetallesPedido(venta: Pedido): void {
    console.log(venta);
    // Obtener el ID del pedido desde el objeto venta
    // El ID está en venta.item.id según la interfaz
    if (venta.item && venta.item.id) {
      this.pedidoIdSeleccionado = venta.item.id;
      this.displayDetallePedidoModal = true;
      document.body.style.overflow = 'hidden';
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Error',
        detail: 'No se pudo obtener el ID del pedido',
      });
    }
  }

  // Método para cerrar el modal de detalles del pedido
  onDetallePedidoModalHide(): void {
    this.displayDetallePedidoModal = false;
    document.body.style.overflow = 'auto';
  }

  // Método para abrir el modal de edición de venta
  editarVenta(venta: Pedido): void {
    if (venta.item && venta.item.id) {
      this.pedidoIdParaEditar = venta.item.id;
      this.displayEditarVentaModal = true;
      document.body.style.overflow = 'hidden';
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Error',
        detail: 'No se pudo obtener el ID del pedido',
      });
    }
  }

  // Método para cerrar el modal de edición
  onEditarVentaModalHide(): void {
    this.displayEditarVentaModal = false;
    this.pedidoIdParaEditar = null;
    document.body.style.overflow = 'auto';
  }

  // Método cuando se actualiza una venta
  onVentaActualizada(): void {
    this.loadVentas();
  }

  // Método para abrir selección de productos desde el modal de edición
  onAbrirSeleccionProductosEditar(): void {
    this.displaySeleccionarProductosModal = true;
    document.body.style.overflow = 'hidden';
  }

}
