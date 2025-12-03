import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ImageModule } from 'primeng/image';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProductosService, Product } from '../services/productos.service';
import { VentasService, Canal, EstadoPedido } from '../services/ventas.service';

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
    CalendarModule,
    DropdownModule,
    CheckboxModule,
    ImageModule,
    MultiSelectModule,
    InputNumberModule,
    ToastModule
  ],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.scss'
})
export class VentasComponent implements OnInit {
  searchValue: string = '';
  loading: boolean = false;
  ventas: any[] = []; // Placeholder para datos futuros
  filteredVentas: any[] = []; // Placeholder para datos futuros

  // Modal de nueva venta
  displayNuevaVentaModal: boolean = false;
  fueHoy: boolean = false;
  fechaPedidoDisabled: boolean = false;

  // Opciones de dropdowns
  canales: Canal[] = [];
  estados: EstadoPedido[] = [];
  loadingCanales: boolean = false;
  loadingEstados: boolean = false;

  // Formulario de nueva venta
  nuevaVenta = {
    nombreCliente: '',
    telefonoCliente: '',
    canal: null,
    fechaPedido: null as Date | null,
    estado: null,
    notas: ''
  };

  // Detalles del pedido
  detallesPedido: Array<{
    id: number;
    imagen: string;
    producto: string;
    precio: number;
    cantidad: number;
    stock: number;
  }> = [];

  // Modal de selección de productos
  displaySeleccionarProductosModal: boolean = false;
  productosDisponibles: Product[] = [];
  productosSeleccionados: Product[] = [];
  productosConCantidad: Array<{ producto: Product; cantidad: number }> = [];
  loadingProductos: boolean = false;
  selectedItemsLabel: string = '{0} productos seleccionados';

  constructor(
    private productosService: ProductosService,
    private ventasService: VentasService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadProductos();
    this.loadCanales();
    this.loadEstadosPedido();
  }

  loadProductos(): void {
    this.loadingProductos = true;
    this.productosService.getProductos().subscribe({
      next: (productos) => {
        this.productosDisponibles = productos;
        this.loadingProductos = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
        this.loadingProductos = false;
      }
    });
  }

  loadCanales(): void {
    this.loadingCanales = true;
    this.ventasService.getCanales().subscribe({
      next: (canales) => {
        this.canales = canales;
        this.loadingCanales = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar canales:', error);
        this.loadingCanales = false;
      }
    });
  }

  loadEstadosPedido(): void {
    this.loadingEstados = true;
    this.ventasService.getEstadosPedido().subscribe({
      next: (estados) => {
        this.estados = estados;
        this.loadingEstados = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar estados de pedido:', error);
        this.loadingEstados = false;
      }
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
    this.resetForm();
    document.body.style.overflow = 'hidden';
  }

  hideNuevaVentaModal(): void {
    this.displayNuevaVentaModal = false;
    this.resetForm();
    document.body.style.overflow = 'auto';
  }

  resetForm(): void {
    this.nuevaVenta = {
      nombreCliente: '',
      telefonoCliente: '',
      canal: null,
      fechaPedido: null,
      estado: null,
      notas: ''
    };
    this.fueHoy = false;
    this.fechaPedidoDisabled = false;
    this.detallesPedido = [];
    this.productosSeleccionados = [];
    this.productosConCantidad = [];
  }

  onFueHoyChange(): void {
    if (this.fueHoy) {
      this.nuevaVenta.fechaPedido = new Date();
      this.fechaPedidoDisabled = true;
    } else {
      this.fechaPedidoDisabled = false;
    }
  }

  onNotasInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  guardarVenta(): void {
    // Lógica futura para guardar la venta
    console.log('Guardar venta:', this.nuevaVenta);
    console.log('Detalles del pedido:', this.detallesPedido);
    this.hideNuevaVentaModal();
  }

  // Métodos para el modal de selección de productos
  showSeleccionarProductosModal(): void {
    this.displaySeleccionarProductosModal = true;
    this.productosSeleccionados = [];
    this.productosConCantidad = [];
    document.body.style.overflow = 'hidden';
  }

  hideSeleccionarProductosModal(): void {
    this.displaySeleccionarProductosModal = false;
    this.productosSeleccionados = [];
    this.productosConCantidad = [];
    document.body.style.overflow = 'auto';
  }

  onProductosSeleccionadosChange(): void {
    // Sincronizar productosConCantidad con productosSeleccionados
    this.productosConCantidad = this.productosSeleccionados.map(producto => {
      const existente = this.productosConCantidad.find(p => p.producto.id === producto.id);
      return {
        producto: producto,
        cantidad: existente ? existente.cantidad : 1
      };
    });
  }

  actualizarCantidadDetalle(detalle: any, nuevaCantidad: number): void {
    if (nuevaCantidad <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cantidad inválida',
        detail: 'La cantidad debe ser mayor a 0'
      });
      return;
    }

    if (nuevaCantidad > detalle.stock) {
      this.messageService.add({
        severity: 'error',
        summary: 'Stock insuficiente',
        detail: `No se puede vender más de ${detalle.stock} unidades de ${detalle.producto}. Stock disponible: ${detalle.stock}`
      });
      return;
    }

    detalle.cantidad = nuevaCantidad;
  }

  finalizarSeleccionProductos(): void {
    // Validar cantidades antes de agregar
    let hayError = false;

    this.productosConCantidad.forEach(item => {
      if (!item.cantidad || item.cantidad <= 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cantidad inválida',
          detail: `Debes ingresar una cantidad válida para ${item.producto.producto}`
        });
        hayError = true;
        return;
      }

      if (item.cantidad > item.producto.stock) {
        this.messageService.add({
          severity: 'error',
          summary: 'Stock insuficiente',
          detail: `No se puede vender más de ${item.producto.stock} unidades de ${item.producto.producto}. Stock disponible: ${item.producto.stock}`
        });
        hayError = true;
        return;
      }
    });

    if (hayError) {
      return;
    }

    // Agregar productos seleccionados a la tabla de detalles
    this.productosConCantidad.forEach(item => {
      // Verificar si el producto ya está en la tabla
      const existeIndex = this.detallesPedido.findIndex(detalle => detalle.id === item.producto.id);
      if (existeIndex !== -1) {
        // Si ya existe, actualizar cantidad (validando stock total)
        const nuevaCantidad = this.detallesPedido[existeIndex].cantidad + item.cantidad;
        if (nuevaCantidad > item.producto.stock) {
          this.messageService.add({
            severity: 'error',
            summary: 'Stock insuficiente',
            detail: `No se puede vender más de ${item.producto.stock} unidades de ${item.producto.producto}. Ya tienes ${this.detallesPedido[existeIndex].cantidad} en el pedido.`
          });
          return;
        }
        this.detallesPedido[existeIndex].cantidad = nuevaCantidad;
      } else {
        // Si no existe, agregarlo
        this.detallesPedido.push({
          id: item.producto.id,
          imagen: this.getProductImageUrl(item.producto),
          producto: item.producto.producto,
          precio: item.producto.precio,
          cantidad: item.cantidad,
          stock: item.producto.stock
        });
      }
    });

    this.hideSeleccionarProductosModal();
  }

  eliminarDetallePedido(id: number): void {
    this.detallesPedido = this.detallesPedido.filter(detalle => detalle.id !== id);
  }

  getProductImageUrl(product: Product): string {
    const defaultImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

    if (!product.imagen ||
        product.imagen.trim() === '' ||
        product.imagen === '#f0f0f0' ||
        product.imagen === 'null') {
      return defaultImageUrl;
    }

    return product.imagen;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(value);
  }

  calcularSubtotal(): number {
    return this.detallesPedido.reduce((total, detalle) => total + (detalle.precio * detalle.cantidad), 0);
  }

  calcularIVA(): number {
    return this.calcularSubtotal() * 0.15;
  }

  calcularTotal(): number {
    return this.calcularSubtotal() + this.calcularIVA();
  }
}
