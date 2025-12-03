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
import { ProductosService, Product } from '../services/productos.service';

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
    MultiSelectModule
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
  canales = [
    { label: 'WhatsApp', value: 'whatsapp' },
    { label: 'Instagram', value: 'instagram' },
    { label: 'Messenger', value: 'messenger' },
    { label: 'Otro', value: 'otro' }
  ];

  estados = [
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Enviado', value: 'enviado' },
    { label: 'Entregado', value: 'entregado' },
    { label: 'Devuelvo', value: 'devuelvo' },
    { label: 'Cancelado', value: 'cancelado' }
  ];

  // Formulario de nueva venta
  nuevaVenta = {
    nombreCliente: '',
    telefonoCliente: '',
    canal: null,
    fechaPedido: null as Date | null,
    estado: null
  };

  // Detalles del pedido
  detallesPedido: Array<{
    id: number;
    imagen: string;
    producto: string;
    precio: number;
  }> = [];

  // Modal de selección de productos
  displaySeleccionarProductosModal: boolean = false;
  productosDisponibles: Product[] = [];
  productosSeleccionados: Product[] = [];
  loadingProductos: boolean = false;
  selectedItemsLabel: string = '{0} productos seleccionados';

  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.loadProductos();
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
      estado: null
    };
    this.fueHoy = false;
    this.fechaPedidoDisabled = false;
    this.detallesPedido = [];
    this.productosSeleccionados = [];
  }

  onFueHoyChange(): void {
    if (this.fueHoy) {
      this.nuevaVenta.fechaPedido = new Date();
      this.fechaPedidoDisabled = true;
    } else {
      this.fechaPedidoDisabled = false;
    }
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
    document.body.style.overflow = 'hidden';
  }

  hideSeleccionarProductosModal(): void {
    this.displaySeleccionarProductosModal = false;
    this.productosSeleccionados = [];
    document.body.style.overflow = 'auto';
  }

  finalizarSeleccionProductos(): void {
    // Agregar productos seleccionados a la tabla de detalles
    this.productosSeleccionados.forEach(producto => {
      // Verificar si el producto ya está en la tabla
      const existe = this.detallesPedido.some(detalle => detalle.id === producto.id);
      if (!existe) {
        this.detallesPedido.push({
          id: producto.id,
          imagen: this.getProductImageUrl(producto),
          producto: producto.producto,
          precio: producto.precio
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
}
