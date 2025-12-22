import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ImageModule } from 'primeng/image';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProductosService, Product } from '../services/productos.service';
import {
  VentasService,
  Canal,
  EstadoPedido,
  MetodoPago,
  TipoEnvio,
  CrearVentaResponse,
} from '../services/ventas.service';

interface DetallePedido {
  id: number;
  imagen: string;
  producto: string;
  precio: number;
  cantidad: number;
  stock: number;
  descuento: number;
}

@Component({
  selector: 'app-nueva-venta-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    CalendarModule,
    DropdownModule,
    CheckboxModule,
    ImageModule,
    InputNumberModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    ToastModule,
  ],
  templateUrl: './nueva-venta-modal.component.html',
  styleUrl: './nueva-venta-modal.component.scss',
  providers: [MessageService],
})
export class NuevaVentaModalComponent implements OnInit {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() ventaGuardada = new EventEmitter<void>();
  @Output() abrirSeleccionProductos = new EventEmitter<void>();

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
    canal: null as number | null,
    fechaPedido: null as Date | null,
    estado: null as number | null,
    notas: '',
    direccionCliente: '',
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
  ignorarISV: boolean = false;
  tipoEnvio: TipoEnvio | null = null;
  cantidadEnvio: number | null = null;

  // Detalles del pedido
  detallesPedido: DetallePedido[] = [];

  loading: boolean = false;

  constructor(
    private productosService: ProductosService,
    private ventasService: VentasService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadCanales();
    this.loadEstadosPedido();
    this.loadMetodosPago();
    this.loadTiposEnvio();
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
      },
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
      },
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
          detail: 'No se pudieron cargar los métodos de pago',
        });
        this.loadingMetodosPago = false;
      },
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
          detail: 'No se pudieron cargar los tipos de envío',
        });
        this.loadingTiposEnvio = false;
      },
    });
  }

  onHide(): void {
    this.visibleChange.emit(false);
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
      notas: '',
      direccionCliente: '',
    };
    this.fueHoy = false;
    this.fechaPedidoDisabled = false;
    this.detallesPedido = [];
    this.necesitaEnvio = false;
    this.tipoEnvio = null;
    this.cantidadEnvio = null;
    this.metodosPagoSeleccionados = [];
    this.metodoPagoTemporal = null;
    this.ignorarISV = false;
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

  onMetodoPagoDropdownShow(container: HTMLElement): void {
    setTimeout(() => {
      const inputElement = container.querySelector(
        '.p-dropdown'
      ) as HTMLElement;
      const panelElement = document.querySelector(
        '.metodo-pago-dropdown-panel'
      ) as HTMLElement;

      if (inputElement && panelElement) {
        const inputWidth = inputElement.getBoundingClientRect().width;
        panelElement.style.width = `${inputWidth}px`;
        panelElement.style.minWidth = `${inputWidth}px`;
      }
    }, 0);
  }

  agregarMetodoPago(): void {
    if (!this.metodoPagoTemporal) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Selección requerida',
        detail: 'Por favor seleccione un método de pago',
      });
      return;
    }

    const yaExiste = this.metodosPagoSeleccionados.some(
      (mp) => mp.metodoPago.id === this.metodoPagoTemporal!.id
    );

    if (yaExiste) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Método duplicado',
        detail: 'Este método de pago ya está agregado',
      });
      return;
    }

    this.metodosPagoSeleccionados.push({
      id: Date.now(),
      metodoPago: this.metodoPagoTemporal,
      monto: 0,
    });

    this.metodoPagoTemporal = null;
  }

  eliminarMetodoPago(id: number): void {
    this.metodosPagoSeleccionados = this.metodosPagoSeleccionados.filter(
      (mp) => mp.id !== id
    );
  }

  getMetodosPagoDisponibles(): MetodoPago[] {
    const idsSeleccionados = this.metodosPagoSeleccionados.map(
      (mp) => mp.metodoPago.id
    );
    return this.metodosPago.filter((mp) => !idsSeleccionados.includes(mp.id));
  }

  eliminarDetallePedido(id: number): void {
    this.detallesPedido = this.detallesPedido.filter(
      (detalle) => detalle.id !== id
    );
  }

  agregarProductos(
    productos: Array<{ producto: Product; cantidad: number }>
  ): void {
    productos.forEach((item) => {
      const existeIndex = this.detallesPedido.findIndex(
        (detalle) => detalle.id === item.producto.id
      );
      if (existeIndex !== -1) {
        const nuevaCantidad =
          this.detallesPedido[existeIndex].cantidad + item.cantidad;
        if (nuevaCantidad > item.producto.stock) {
          this.messageService.add({
            severity: 'error',
            summary: 'Stock insuficiente',
            detail: `No se puede vender más de ${item.producto.stock} unidades de ${item.producto.producto}. Ya tienes ${this.detallesPedido[existeIndex].cantidad} en el pedido.`,
          });
          return;
        }
        this.detallesPedido[existeIndex].cantidad = nuevaCantidad;
        if (
          this.detallesPedido[existeIndex].descuento === undefined ||
          this.detallesPedido[existeIndex].descuento === null
        ) {
          this.detallesPedido[existeIndex].descuento = 0;
        }
      } else {
        this.detallesPedido.push({
          id: item.producto.id,
          imagen: this.getProductImageUrl(item.producto),
          producto: item.producto.producto,
          precio: item.producto.precio,
          cantidad: item.cantidad,
          stock: item.producto.stock,
          descuento: 0,
        });
      }
    });
  }

  getProductImageUrl(product: Product): string {
    const defaultImageUrl =
      'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

    if (
      !product.imagen ||
      product.imagen.trim() === '' ||
      product.imagen === '#f0f0f0' ||
      product.imagen === 'null'
    ) {
      return defaultImageUrl;
    }

    return product.imagen;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2,
    }).format(value);
  }

  calcularSubtotal(): number {
    return this.detallesPedido.reduce((total, detalle) => {
      const subtotalProducto = detalle.precio * detalle.cantidad;
      const descuento = detalle.descuento || 0;
      return total + (subtotalProducto - descuento);
    }, 0);
  }

  calcularSubtotalIndividual(detalle: DetallePedido): number {
    const subtotalProducto = detalle.precio * detalle.cantidad;
    const descuento = detalle.descuento || 0;
    return subtotalProducto - descuento;
  }

  calcularIVA(): number {
    if (this.ignorarISV) {
      return 0;
    }
    return this.calcularSubtotal() * 0.15;
  }

  calcularTotal(): number {
    return this.calcularSubtotal() + this.calcularIVA();
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
    return (
      this.metodosPagoSeleccionados.length === 1 &&
      this.metodosPagoSeleccionados[0].metodoPago.id === 1
    );
  }

  calcularVuelto(): number {
    if (this.esEfectivoUnico()) {
      const montoPagado = this.calcularTotalMetodosPago();
      const totalVenta = this.calcularTotal();
      return montoPagado - totalVenta;
    }
    return 0;
  }

  guardarVenta(): void {
    if (this.detallesPedido.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Pedido vacío',
        detail: 'Debes agregar al menos un producto al pedido',
      });
      return;
    }

    if (
      !this.nuevaVenta.nombreCliente ||
      !this.nuevaVenta.telefonoCliente ||
      !this.nuevaVenta.canal ||
      !this.nuevaVenta.estado ||
      !this.nuevaVenta.fechaPedido ||
      !this.nuevaVenta.direccionCliente
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'Por favor completa todos los campos requeridos',
      });
      return;
    }

    if (this.metodosPagoSeleccionados.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Métodos de pago requeridos',
        detail: 'Debes agregar al menos un método de pago',
      });
      return;
    }

    const metodosSinMonto = this.metodosPagoSeleccionados.filter(
      (mp) => !mp.monto || mp.monto <= 0
    );
    if (metodosSinMonto.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Montos incompletos',
        detail: 'Todos los métodos de pago deben tener un monto válido',
      });
      return;
    }

    const diferencia = this.getDiferenciaPago();
    const esEfectivoUnico = this.esEfectivoUnico();

    if (esEfectivoUnico) {
      if (diferencia > 0.01) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Monto insuficiente',
          detail: `El monto pagado (${this.formatCurrency(
            this.calcularTotalMetodosPago()
          )}) debe ser mayor o igual al total de la venta (${this.formatCurrency(
            this.calcularTotal()
          )})`,
        });
        return;
      }
    } else {
      if (Math.abs(diferencia) > 0.01) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Suma incorrecta',
          detail: `La suma de los métodos de pago (${this.formatCurrency(
            this.calcularTotalMetodosPago()
          )}) debe ser igual al total de la venta (${this.formatCurrency(
            this.calcularTotal()
          )})`,
        });
        return;
      }
    }

    const fechaPedido = this.nuevaVenta.fechaPedido
      ? new Date(this.nuevaVenta.fechaPedido).toISOString().split('T')[0]
      : null;

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
      direccionCliente: this.nuevaVenta.direccionCliente,
      costoEnvio:
        this.necesitaEnvio &&
        this.tipoEnvio?.costo_base !== null &&
        this.tipoEnvio?.costo_base !== undefined
          ? this.tipoEnvio.costo_base
          : null,
      ignorarISV: this.ignorarISV,
    };

    const detallesJSON = this.detallesPedido.map((detalle) => ({
      productoId: detalle.id,
      cantidad: detalle.cantidad,
      precioUnitario: detalle.precio,
      descuento:
        detalle.descuento !== null &&
        detalle.descuento !== undefined &&
        !isNaN(Number(detalle.descuento))
          ? Number(detalle.descuento)
          : 0,
    }));

    const metodosPagoJSON = this.metodosPagoSeleccionados.map((mp) => ({
      metodoPagoId: mp.metodoPago.id,
      monto: mp.monto,
    }));

    const totalesJSON = {
      subtotal: this.calcularSubtotal(),
      iva: this.calcularIVA(),
      total: this.calcularTotal(),
    };

    const ventaCompletaJSON = {
      venta: ventaJSON,
      detalles: detallesJSON,
      totales: totalesJSON,
      metodosPago: metodosPagoJSON,
    };

    this.loading = true;
    this.ventasService.crearVentaCompleta(ventaCompletaJSON).subscribe({
      next: (response: CrearVentaResponse) => {
        this.loading = false;

        if (response.exito && response.pedido_id) {
          this.messageService.add({
            severity: 'success',
            summary: 'Venta guardada',
            detail: `Venta #${response.pedido_id} creada exitosamente`,
          });

          this.onHide();
          this.ventaGuardada.emit();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error al guardar',
            detail: response.mensaje || 'No se pudo crear la venta',
          });
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('❌ Error al guardar venta:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al guardar',
          detail:
            error.message ||
            'Ocurrió un error al intentar guardar la venta. Por favor intenta nuevamente.',
        });
      },
    });
  }
}
