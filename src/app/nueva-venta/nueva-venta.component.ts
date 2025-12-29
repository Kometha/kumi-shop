import { Component, OnInit, signal, computed, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ImageModule } from 'primeng/image';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ProductosService, Product } from '../services/productos.service';
import { SeleccionarProductosModalComponent } from '../seleccionar-productos-modal/seleccionar-productos-modal.component';
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
  selector: 'app-nueva-venta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    InputTextModule,
    InputMaskModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    RadioButtonModule,
    CheckboxModule,
    ButtonModule,
    TableModule,
    ImageModule,
    TooltipModule,
    ToastModule,
    DialogModule,
    SeleccionarProductosModalComponent,
  ],
  templateUrl: './nueva-venta.component.html',
  styleUrl: './nueva-venta.component.scss',
  providers: [MessageService],
})
export class NuevaVentaComponent implements OnInit {
  ventaForm!: FormGroup;

  // Signals para estado local
  readonly detallesPedido = signal<DetallePedido[]>([]);
  readonly ignorarISV = signal<boolean>(false);
  readonly metodosPagoSeleccionados = signal<Array<{
    id: number;
    metodoPago: MetodoPago;
    monto: number;
  }>>([]);

  // Opciones de dropdowns desde servicios
  canales: Canal[] = [];
  estados: EstadoPedido[] = [];
  metodosPago: MetodoPago[] = [];
  tiposEnvio: TipoEnvio[] = [];
  
  loadingCanales: boolean = false;
  loadingEstados: boolean = false;
  loadingMetodosPago: boolean = false;
  loadingTiposEnvio: boolean = false;

  // Método de pago temporal para agregar
  metodoPagoTemporal: MetodoPago | null = null;

  // Envío
  necesitaEnvio: boolean = false;
  tipoEnvio: TipoEnvio | null = null;
  cantidadEnvio: number | null = null;

  // Fecha
  fueHoy: boolean = false;

  // Modal de selección de productos
  displaySeleccionarProductosModal: boolean = false;
  productosDisponibles: Product[] = [];

  // Loading state
  loading: boolean = false;

  // Computed signals para cálculos
  readonly subtotalSinDescuentos = computed(() => {
    // Subtotal sin descuentos: suma de precio * cantidad
    return this.detallesPedido().reduce((total, detalle) => {
      return total + (detalle.precio * detalle.cantidad);
    }, 0);
  });

  readonly descuentos = computed(() => {
    // Total de descuentos aplicados en Lempiras
    return this.detallesPedido().reduce((total, detalle) => {
      return total + (detalle.descuento || 0);
    }, 0);
  });

  readonly subtotal = computed(() => {
    // Subtotal después de aplicar descuentos
    return this.subtotalSinDescuentos() - this.descuentos();
  });

  readonly isv = computed(() => {
    if (this.ignorarISV()) {
      return 0;
    }
    // El ISV se calcula sobre el subtotal después de descuentos
    return this.subtotal() * 0.15;
  });

  readonly total = computed(() => {
    // Total = Subtotal (después de descuentos) + ISV
    return this.subtotal() + this.isv();
  });

  readonly totalMetodosPago = computed(() => {
    return this.metodosPagoSeleccionados().reduce((total, mp) => {
      return total + (mp.monto || 0);
    }, 0);
  });

  readonly diferenciaPago = computed(() => {
    return this.total() - this.totalMetodosPago();
  });

  readonly esEfectivoUnico = computed(() => {
    return (
      this.metodosPagoSeleccionados().length === 1 &&
      this.metodosPagoSeleccionados()[0].metodoPago.id === 1
    );
  });

  readonly vuelto = computed(() => {
    if (this.esEfectivoUnico()) {
      const montoPagado = this.totalMetodosPago();
      const totalVenta = this.total();
      return montoPagado - totalVenta;
    }
    return 0;
  });

  tipoEntregaOptions = [
    { label: 'Retiro en tienda', value: 'retiro' },
    { label: 'Envío a domicilio', value: 'envio' },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private ventasService: VentasService,
    private productosService: ProductosService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    // Effect para actualizar el subtotal cuando cambian los detalles
    effect(() => {
      // Los computed signals se actualizan automáticamente
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCanales();
    this.loadEstadosPedido();
    this.loadMetodosPago();
    this.loadTiposEnvio();
    this.loadProductos();
    
    // Sincronizar el signal con el valor inicial del formulario
    this.ventaForm.get('ignorarISV')?.valueChanges.subscribe((value) => {
      this.ignorarISV.set(value);
    });
  }

  private initializeForm(): void {
    this.ventaForm = this.fb.group({
      // Información del Cliente
      nombreCliente: ['', [Validators.required]],
      telefonoCliente: ['', [Validators.required]],
      direccionCliente: [''],

      // Información del Pedido
      canalVenta: [null, [Validators.required]],
      estadoPedido: [null, [Validators.required]],
      fechaPedido: [new Date(), [Validators.required]],
      tipoEntrega: ['retiro', [Validators.required]],
      notas: [''],

      // Pago
      ignorarISV: [false],
    });

    // Validación condicional para dirección cuando es envío
    this.ventaForm.get('tipoEntrega')?.valueChanges.subscribe((tipoEntrega) => {
      const direccionControl = this.ventaForm.get('direccionCliente');
      if (tipoEntrega === 'envio') {
        direccionControl?.setValidators([Validators.required]);
      } else {
        direccionControl?.clearValidators();
      }
      direccionControl?.updateValueAndValidity();
    });
  }

  // Cargar datos desde servicios
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
        this.loadingTiposEnvio = false;
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
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los productos',
        });
      },
    });
  }

  // Manejo de fecha
  onFueHoyChange(): void {
    const fechaControl = this.ventaForm.get('fechaPedido');
    
    if (this.fueHoy) {
      // Establecer la fecha actual y deshabilitar el calendario
      const fechaActual = new Date();
      fechaActual.setHours(0, 0, 0, 0);
      
      // Establecer el valor y deshabilitar usando el FormControl
      if (fechaControl) {
        fechaControl.setValue(fechaActual);
        fechaControl.disable();
      }
    } else {
      // Habilitar el calendario
      if (fechaControl) {
        fechaControl.enable();
      }
    }
  }

  // Métodos de pago
  onMetodoPagoTemporalChange(metodo: MetodoPago | null): void {
    this.metodoPagoTemporal = metodo;
    this.cdr.detectChanges();
  }

  puedeAgregarMetodoPago(): boolean {
    return !!this.metodoPagoTemporal;
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

    const yaExiste = this.metodosPagoSeleccionados().some(
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

    this.metodosPagoSeleccionados.update((metodos) => [
      ...metodos,
      {
        id: Date.now(),
        metodoPago: this.metodoPagoTemporal!,
        monto: 0,
      },
    ]);

    this.metodoPagoTemporal = null;
  }

  eliminarMetodoPago(id: number): void {
    this.metodosPagoSeleccionados.update((metodos) =>
      metodos.filter((mp) => mp.id !== id)
    );
  }

  getMetodosPagoDisponibles(): MetodoPago[] {
    const idsSeleccionados = this.metodosPagoSeleccionados().map(
      (mp) => mp.metodoPago.id
    );
    const disponibles = this.metodosPago.filter((mp) => !idsSeleccionados.includes(mp.id));
    return disponibles;
  }

  onMetodoPagoDropdownShow(dropdown: any): void {
    setTimeout(() => {
      const container = dropdown.el?.nativeElement || dropdown;
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

  // Productos/Detalles del pedido
  onAgregarProducto(): void {
    this.displaySeleccionarProductosModal = true;
    document.body.style.overflow = 'hidden';
  }

  onAbrirSeleccionProductos(): void {
    this.displaySeleccionarProductosModal = true;
    document.body.style.overflow = 'hidden';
  }

  onProductosSeleccionados(productos: Array<{ producto: Product; cantidad: number }>): void {
    this.agregarProductos(productos);
    this.displaySeleccionarProductosModal = false;
    document.body.style.overflow = 'auto';
  }

  onSeleccionarProductosModalHide(): void {
    this.displaySeleccionarProductosModal = false;
    document.body.style.overflow = 'auto';
  }

  agregarProductos(
    productos: Array<{ producto: Product; cantidad: number }>
  ): void {
    productos.forEach((item) => {
      const detallesActuales = this.detallesPedido();
      const existeIndex = detallesActuales.findIndex(
        (detalle) => detalle.id === item.producto.id
      );
      
      if (existeIndex !== -1) {
        const nuevaCantidad =
          detallesActuales[existeIndex].cantidad + item.cantidad;
        if (nuevaCantidad > item.producto.stock) {
          this.messageService.add({
            severity: 'error',
            summary: 'Stock insuficiente',
            detail: `No se puede vender más de ${item.producto.stock} unidades de ${item.producto.producto}. Ya tienes ${detallesActuales[existeIndex].cantidad} en el pedido.`,
          });
          return;
        }
        
        const nuevosDetalles = [...detallesActuales];
        nuevosDetalles[existeIndex] = {
          ...nuevosDetalles[existeIndex],
          cantidad: nuevaCantidad,
        };
        this.detallesPedido.set(nuevosDetalles);
      } else {
        this.detallesPedido.update((detalles) => [
          ...detalles,
          {
            id: item.producto.id,
            imagen: this.getProductImageUrl(item.producto),
            producto: item.producto.producto,
            precio: item.producto.precio,
            cantidad: item.cantidad,
            stock: item.producto.stock,
            descuento: 0,
          },
        ]);
      }
    });
  }

  eliminarDetallePedido(id: number): void {
    this.detallesPedido.update((detalles) =>
      detalles.filter((detalle) => detalle.id !== id)
    );
  }

  calcularSubtotalIndividual(detalle: DetallePedido): number {
    const subtotalProducto = detalle.precio * detalle.cantidad;
    const descuento = detalle.descuento || 0;
    return subtotalProducto - descuento;
  }

  actualizarDetalleDescuento(): void {
    // Forzar actualización del signal para recalcular totales
    // Esto dispara la recalculación de los computed signals (subtotal, descuentos, total)
    const detallesActuales = this.detallesPedido();
    this.detallesPedido.set([...detallesActuales]);
  }

  actualizarMetodoPagoMonto(): void {
    // Forzar actualización del signal para recalcular totales
    this.metodosPagoSeleccionados.set([...this.metodosPagoSeleccionados()]);
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

  onIgnorarISVChange(event: { checked?: boolean }): void {
    const checked = event.checked ?? false;
    this.ignorarISV.set(checked);
    this.ventaForm.patchValue({ ignorarISV: checked });
  }

  onRegistrarVenta(): void {
    // Validar que haya productos
    if (this.detallesPedido().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Pedido vacío',
        detail: 'Debes agregar al menos un producto al pedido',
      });
      return;
    }

    // Validar formulario
    if (this.ventaForm.invalid) {
      Object.keys(this.ventaForm.controls).forEach((key) => {
        this.ventaForm.get(key)?.markAsTouched();
      });
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'Por favor completa todos los campos requeridos',
      });
      return;
    }

    // Validar métodos de pago
    if (this.metodosPagoSeleccionados().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Métodos de pago requeridos',
        detail: 'Debes agregar al menos un método de pago',
      });
      return;
    }

    // Validar montos de métodos de pago
    const metodosSinMonto = this.metodosPagoSeleccionados().filter(
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

    // Validar diferencia de pago
    const diferencia = this.diferenciaPago();
    const esEfectivoUnico = this.esEfectivoUnico();

    if (esEfectivoUnico) {
      if (diferencia > 0.01) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Monto insuficiente',
          detail: `El monto pagado (${this.formatCurrency(
            this.totalMetodosPago()
          )}) debe ser mayor o igual al total de la venta (${this.formatCurrency(
            this.total()
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
            this.totalMetodosPago()
          )}) debe ser igual al total de la venta (${this.formatCurrency(
            this.total()
          )})`,
        });
        return;
      }
    }

    // Obtener valores del formulario
    const formValue = this.ventaForm.value;
    const tipoEntrega = formValue.tipoEntrega;
    const necesitaEnvio = tipoEntrega === 'envio';

    // Formatear fecha - obtener directamente del control para asegurar que tenemos el valor
    const fechaControl = this.ventaForm.get('fechaPedido');
    const fechaPedidoValue = fechaControl?.value;
    
    console.log('🔍 Debug fecha:', {
      fechaPedidoValue,
      tipo: typeof fechaPedidoValue,
      esDate: fechaPedidoValue instanceof Date,
      fechaControlValue: fechaControl?.value,
      formValueFecha: formValue.fechaPedido
    });
    
    let fechaPedido: string | null = null;
    if (fechaPedidoValue) {
      // Si es un objeto Date, convertirlo a string ISO
      if (fechaPedidoValue instanceof Date) {
        fechaPedido = fechaPedidoValue.toISOString().split('T')[0];
      } 
      // Si ya es un string, intentar parsearlo y formatearlo
      else if (typeof fechaPedidoValue === 'string') {
        const fecha = new Date(fechaPedidoValue);
        if (!isNaN(fecha.getTime())) {
          fechaPedido = fecha.toISOString().split('T')[0];
        }
      }
      // Si es un número (timestamp), convertirlo
      else if (typeof fechaPedidoValue === 'number') {
        const fecha = new Date(fechaPedidoValue);
        if (!isNaN(fecha.getTime())) {
          fechaPedido = fecha.toISOString().split('T')[0];
        }
      }
    }
    
    // Si aún no tenemos fecha válida, usar la fecha actual
    if (!fechaPedido) {
      fechaPedido = new Date().toISOString().split('T')[0];
      console.warn('⚠️ No se pudo obtener fecha del formulario, usando fecha actual:', fechaPedido);
    }
    
    console.log('📅 Fecha final formateada:', fechaPedido);

    // Construir JSON de venta
    const ventaJSON = {
      canalId: formValue.canalVenta,
      estadoId: formValue.estadoPedido,
      fechaPedido: fechaPedido,
      total: this.total(),
      notas: formValue.notas || null,
      nombreCliente: formValue.nombreCliente,
      telefonoCliente: formValue.telefonoCliente,
      necesitaEnvio: necesitaEnvio,
      tipoEnvioId: necesitaEnvio && this.tipoEnvio ? this.tipoEnvio.id : null,
      cantidadEnvio: necesitaEnvio ? this.cantidadEnvio || null : null,
      direccionCliente: necesitaEnvio ? formValue.direccionCliente : null,
      costoEnvio:
        necesitaEnvio &&
        this.tipoEnvio?.costo_base !== null &&
        this.tipoEnvio?.costo_base !== undefined
          ? this.tipoEnvio.costo_base
          : null,
      ignorarISV: this.ignorarISV(),
      isv: this.isv(),
    };

    // Construir JSON de detalles
    const detallesJSON = this.detallesPedido().map((detalle) => ({
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

    // Construir JSON de métodos de pago
    const metodosPagoJSON = this.metodosPagoSeleccionados().map((mp) => ({
      metodoPagoId: mp.metodoPago.id,
      monto: mp.monto,
    }));

    // Construir JSON de totales
    const totalesJSON = {
      subtotal: this.subtotal(),
      iva: this.isv(),
      total: this.total(),
    };

    // Construir JSON completo
    const ventaCompletaJSON = {
      venta: ventaJSON,
      detalles: detallesJSON,
      totales: totalesJSON,
      metodosPago: metodosPagoJSON,
    };

    // Guardar venta
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

          // Navegar de vuelta a la lista de ventas
          this.router.navigate(['/ventas']);
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

  onCancelar(): void {
    this.router.navigate(['/ventas']);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2,
    }).format(value);
  }
}
