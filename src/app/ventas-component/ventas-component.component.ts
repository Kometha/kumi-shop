import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
import { VentasService, Canal, EstadoPedido, MetodoPago, TipoEnvio } from '../services/ventas.service';

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
  metodosPago: MetodoPago[] = [];
  tiposEnvio: TipoEnvio[] = [];
  loadingCanales: boolean = false;
  loadingEstados: boolean = false;
  loadingMetodosPago: boolean = false;
  loadingTiposEnvio: boolean = false;

  // Formulario de nueva venta
  nuevaVenta = {
    nombreCliente: '',
    telefonoCliente: '',
    canal: null,
    fechaPedido: null as Date | null,
    estado: null,
    metodoPago: null,
    notas: ''
  };

  // Métodos de pago múltiples
  metodosPagoSeleccionados: Array<{
    id: number;
    metodoPago: MetodoPago;
    monto: number;
  }> = [];
  metodoPagoTemporal: MetodoPago | null = null;

  // Envío
  necesitaEnvio: boolean = false;
  tipoEnvio: TipoEnvio | null = null;
  cantidadEnvio: number | null = null;

  // Detalles del pedido
  detallesPedido: Array<{
    id: number;
    imagen: string;
    producto: string;
    precio: number;
    cantidad: number;
    stock: number;
    descuento: number;
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
    this.loadMetodosPago();
    this.loadTiposEnvio();
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

  loadMetodosPago(): void {
    this.loadingMetodosPago = true;
    this.ventasService.getMetodosPago().subscribe({
      next: (metodosPago) => {
        this.metodosPago = metodosPago;
        this.loadingMetodosPago = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar métodos de pago:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los métodos de pago'
        });
        this.loadingMetodosPago = false;
      }
    });
  }

  loadTiposEnvio(): void {
    this.loadingTiposEnvio = true;
    this.ventasService.getTiposEnvio().subscribe({
      next: (tiposEnvio) => {
        this.tiposEnvio = tiposEnvio;
        this.loadingTiposEnvio = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar tipos de envío:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los tipos de envío'
        });
        this.loadingTiposEnvio = false;
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
      metodoPago: null,
      notas: ''
    };
    this.fueHoy = false;
    this.fechaPedidoDisabled = false;
    this.detallesPedido = [];
    this.productosSeleccionados = [];
    this.productosConCantidad = [];
    this.necesitaEnvio = false;
    this.tipoEnvio = null;
    this.cantidadEnvio = null;
    this.metodosPagoSeleccionados = [];
    this.metodoPagoTemporal = null;
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
    // Validar que haya productos en el pedido
    if (this.detallesPedido.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Pedido vacío',
        detail: 'Debes agregar al menos un producto al pedido'
      });
      return;
    }

    // Validar campos requeridos
    if (!this.nuevaVenta.nombreCliente || !this.nuevaVenta.telefonoCliente ||
        !this.nuevaVenta.canal || !this.nuevaVenta.estado || !this.nuevaVenta.fechaPedido) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    // Validar métodos de pago
    if (this.metodosPagoSeleccionados.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Métodos de pago requeridos',
        detail: 'Debes agregar al menos un método de pago'
      });
      return;
    }

    // Validar que todos los métodos de pago tengan monto
    const metodosSinMonto = this.metodosPagoSeleccionados.filter(mp => !mp.monto || mp.monto <= 0);
    if (metodosSinMonto.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Montos incompletos',
        detail: 'Todos los métodos de pago deben tener un monto válido'
      });
      return;
    }

    // Validar que la suma de métodos de pago sea igual al total
    // Si es efectivo único, permitir vuelto (monto pagado >= total)
    const diferencia = this.getDiferenciaPago();
    const esEfectivoUnico = this.esEfectivoUnico();
    
    if (esEfectivoUnico) {
      // Si es efectivo único, el monto pagado debe ser mayor o igual al total
      // diferencia > 0 significa que falta dinero (total > totalPagado)
      if (diferencia > 0.01) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Monto insuficiente',
          detail: `El monto pagado (${this.formatCurrency(this.calcularTotalMetodosPago())}) debe ser mayor o igual al total de la venta (${this.formatCurrency(this.calcularTotal())})`
        });
        return;
      }
      // Si diferencia <= 0, hay vuelto o está exacto, lo cual está permitido
    } else {
      // Si no es efectivo único, la suma debe ser exactamente igual al total
      if (Math.abs(diferencia) > 0.01) { // Tolerancia de 1 centavo
        this.messageService.add({
          severity: 'warn',
          summary: 'Suma incorrecta',
          detail: `La suma de los métodos de pago (${this.formatCurrency(this.calcularTotalMetodosPago())}) debe ser igual al total de la venta (${this.formatCurrency(this.calcularTotal())})`
        });
        return;
      }
    }

    // Formatear fecha_pedido (formato ISO o según necesites)
    const fechaPedido = this.nuevaVenta.fechaPedido
      ? new Date(this.nuevaVenta.fechaPedido).toISOString().split('T')[0]
      : null;

    // Construir JSON de la venta
    const ventaJSON = {
      canalId: this.nuevaVenta.canal,
      estadoId: this.nuevaVenta.estado,
      fechaPedido: fechaPedido,
      total: this.calcularTotal(),
      notas: this.nuevaVenta.notas || null,
      nombreCliente: this.nuevaVenta.nombreCliente,
      telefonoCliente: this.nuevaVenta.telefonoCliente,
      necesitaEnvio: this.necesitaEnvio,
      tipoEnvioId: this.tipoEnvio?.id || null,
      cantidadEnvio: this.cantidadEnvio || null,
      costoEnvio: this.necesitaEnvio && this.tipoEnvio?.costo_base !== null && this.tipoEnvio?.costo_base !== undefined 
        ? this.tipoEnvio.costo_base 
        : null
    };

    // Construir array de detalles (sin subtotal individual)
    const detallesJSON = this.detallesPedido.map(detalle => ({
      productoId: detalle.id,
      cantidad: detalle.cantidad,
      precioUnitario: detalle.precio,
      descuento: detalle.descuento || 0
    }));

    // Construir array de métodos de pago
    const metodosPagoJSON = this.metodosPagoSeleccionados.map(mp => ({
      metodoPagoId: mp.metodoPago.id,
      monto: mp.monto
    }));

    // Construir objeto de totales
    const totalesJSON = {
      subtotal: this.calcularSubtotal(),
      iva: this.calcularIVA(),
      total: this.calcularTotal()
    };

    // JSON completo
    const ventaCompletaJSON = {
      venta: ventaJSON,
      detalles: detallesJSON,
      totales: totalesJSON,
      metodosPago: metodosPagoJSON
    };

    // Mostrar en consola para análisis
    console.log('=== JSON DE VENTA ===');
    console.log(JSON.stringify(ventaCompletaJSON, null, 2));
    console.log('=====================');

    // Aquí irá la lógica para guardar en la BD
    // TODO: Llamar al servicio para guardar la venta

    // this.hideNuevaVentaModal();
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
        // Asegurar que el descuento esté inicializado
        if (this.detallesPedido[existeIndex].descuento === undefined || this.detallesPedido[existeIndex].descuento === null) {
          this.detallesPedido[existeIndex].descuento = 0;
        }
      } else {
        // Si no existe, agregarlo
        this.detallesPedido.push({
          id: item.producto.id,
          imagen: this.getProductImageUrl(item.producto),
          producto: item.producto.producto,
          precio: item.producto.precio,
          cantidad: item.cantidad,
          stock: item.producto.stock,
          descuento: 0
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
    return this.detallesPedido.reduce((total, detalle) => {
      const subtotalProducto = detalle.precio * detalle.cantidad;
      const descuento = detalle.descuento || 0;
      return total + (subtotalProducto - descuento);
    }, 0);
  }

  calcularSubtotalIndividual(detalle: any): number {
    const subtotalProducto = detalle.precio * detalle.cantidad;
    const descuento = detalle.descuento || 0;
    return subtotalProducto - descuento;
  }

  calcularIVA(): number {
    return this.calcularSubtotal() * 0.15;
  }

  calcularTotal(): number {
    return this.calcularSubtotal() + this.calcularIVA();
  }

  onMetodoPagoDropdownShow(container: HTMLElement): void {
    // Sincronizar el ancho del panel con el ancho del input
    setTimeout(() => {
      const inputElement = container.querySelector('.p-dropdown') as HTMLElement;
      const panelElement = document.querySelector('.metodo-pago-dropdown-panel') as HTMLElement;
      
      if (inputElement && panelElement) {
        const inputWidth = inputElement.getBoundingClientRect().width;
        panelElement.style.width = `${inputWidth}px`;
        panelElement.style.minWidth = `${inputWidth}px`;
      }
    }, 0);
  }

  // Métodos para manejar métodos de pago múltiples
  agregarMetodoPago(): void {
    if (!this.metodoPagoTemporal) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Selección requerida',
        detail: 'Por favor seleccione un método de pago'
      });
      return;
    }

    // Verificar si el método ya está agregado
    const yaExiste = this.metodosPagoSeleccionados.some(
      mp => mp.metodoPago.id === this.metodoPagoTemporal!.id
    );

    if (yaExiste) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Método duplicado',
        detail: 'Este método de pago ya está agregado'
      });
      return;
    }

    // Agregar el método de pago con monto inicial en 0
    this.metodosPagoSeleccionados.push({
      id: Date.now(), // ID temporal único
      metodoPago: this.metodoPagoTemporal,
      monto: 0
    });

    // Limpiar la selección temporal
    this.metodoPagoTemporal = null;
  }

  eliminarMetodoPago(id: number): void {
    this.metodosPagoSeleccionados = this.metodosPagoSeleccionados.filter(mp => mp.id !== id);
  }

  actualizarMontoMetodoPago(id: number, nuevoMonto: number | null): void {
    const metodoPago = this.metodosPagoSeleccionados.find(mp => mp.id === id);
    if (metodoPago) {
      metodoPago.monto = nuevoMonto !== null && nuevoMonto !== undefined ? nuevoMonto : 0;
    }
  }

  getMetodosPagoDisponibles(): MetodoPago[] {
    // Filtrar métodos de pago que ya están seleccionados
    const idsSeleccionados = this.metodosPagoSeleccionados.map(mp => mp.metodoPago.id);
    return this.metodosPago.filter(mp => !idsSeleccionados.includes(mp.id));
  }

  calcularTotalMetodosPago(): number {
    return this.metodosPagoSeleccionados.reduce((total, mp) => {
      return total + (mp.monto || 0);
    }, 0);
  }

  getDiferenciaPago(): number {
    return this.calcularTotal() - this.calcularTotalMetodosPago();
  }

  esEfectivoUnico(): boolean {
    return this.metodosPagoSeleccionados.length === 1 && 
           this.metodosPagoSeleccionados[0].metodoPago.id === 1;
  }

  calcularVuelto(): number {
    if (this.esEfectivoUnico()) {
      const montoPagado = this.calcularTotalMetodosPago();
      const totalVenta = this.calcularTotal();
      return montoPagado - totalVenta;
    }
    return 0;
  }
}
