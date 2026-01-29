import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnChanges,
  SimpleChanges,
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
  PedidoCompleto,
  DetallePedidoCompleto,
} from '../services/ventas.service';

interface DetallePedido {
  id: number;
  imagen: string;
  producto: string;
  precio: number;
  cantidad: number;
  stock: number;
  descuento: number;
  productoId: number;
  detalleId?: number; // ID del detalle en la base de datos
}

@Component({
  selector: 'app-editar-venta-modal',
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
  templateUrl: './editar-venta-modal.component.html',
  styleUrl: './editar-venta-modal.component.scss',
  providers: [MessageService],
})
export class EditarVentaModalComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() pedidoId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() ventaActualizada = new EventEmitter<void>();
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

  // Formulario de venta
  venta = {
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
  costoEnvioManual: number | null = null; // Para tipo MANUAL

  // Detalles del pedido
  detallesPedido: DetallePedido[] = [];

  loading: boolean = false;
  loadingDatos: boolean = false;

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue && this.pedidoId) {
      // Asegurar que los métodos de pago disponibles estén cargados antes de cargar datos
      if (this.metodosPago.length === 0 && !this.loadingMetodosPago) {
        this.loadMetodosPago();
        // Esperar un momento para que se carguen antes de cargar los datos del pedido
        setTimeout(() => {
          this.loadDatosVenta();
        }, 300);
      } else {
        this.loadDatosVenta();
      }
    }
    if (changes['pedidoId']?.currentValue && this.visible) {
      // Asegurar que los métodos de pago disponibles estén cargados antes de cargar datos
      if (this.metodosPago.length === 0 && !this.loadingMetodosPago) {
        this.loadMetodosPago();
        // Esperar un momento para que se carguen antes de cargar los datos del pedido
        setTimeout(() => {
          this.loadDatosVenta();
        }, 300);
      } else {
        this.loadDatosVenta();
      }
    }
  }

  loadDatosVenta(): void {
    if (!this.pedidoId) return;

    this.loadingDatos = true;
    let pedidoLoaded = false;
    let detallesLoaded = false;
    let metodosPagoLoaded = false;
    let envioLoaded = false;

    const checkLoading = () => {
      if (pedidoLoaded && detallesLoaded && metodosPagoLoaded && envioLoaded) {
        this.loadingDatos = false;
      }
    };

    // Cargar información del pedido
    this.ventasService.getPedidoCompleto(this.pedidoId).subscribe({
      next: (pedido: PedidoCompleto | null) => {
        if (!pedido) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la información del pedido',
          });
          pedidoLoaded = true;
          checkLoading();
          return;
        }

        this.venta.nombreCliente = pedido.nombre_cliente;
        this.venta.telefonoCliente = pedido.telefono_cliente;
        this.venta.canal = pedido.canal_id;
        this.venta.estado = pedido.estado_id;
        this.venta.notas = pedido.notas || '';
        this.venta.direccionCliente = pedido.direccion_cliente || '';
        this.necesitaEnvio = pedido.necesita_envio;
        this.ignorarISV = pedido.ignorar_isv;
        // Guardar el costo de envío para usarlo si es tipo MANUAL
        if (pedido.costo_envio !== null && pedido.costo_envio !== undefined) {
          this.costoEnvioManual = pedido.costo_envio;
        }

        // Convertir fecha_pedido a Date
        if (pedido.fecha_pedido) {
          this.venta.fechaPedido = new Date(pedido.fecha_pedido);
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          const fechaPedido = new Date(pedido.fecha_pedido);
          fechaPedido.setHours(0, 0, 0, 0);
          this.fueHoy = fechaPedido.getTime() === hoy.getTime();
          this.fechaPedidoDisabled = this.fueHoy;
        }

        pedidoLoaded = true;
        checkLoading();
      },
      error: (error) => {
        console.error('❌ Error al cargar pedido:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del pedido',
        });
        pedidoLoaded = true;
        checkLoading();
      },
    });

    // Cargar detalles del pedido
    this.ventasService.getDetallesPedido(this.pedidoId).subscribe({
      next: (detalles: DetallePedidoCompleto[]) => {
        this.detallesPedido = detalles.map((detalle) => ({
          id: detalle.producto_id,
          detalleId: detalle.id,
          imagen: this.getProductImageUrl(detalle.producto?.imagen_url || null),
          producto: detalle.producto?.producto || `Producto ID: ${detalle.producto_id}`,
          precio: detalle.precio_unitario,
          cantidad: detalle.cantidad,
          stock: 999999, // No tenemos stock aquí, usar un valor alto
          descuento: detalle.descuento || 0,
          productoId: detalle.producto_id,
        }));

        // Cargar stock de productos
        detalles.forEach((detalle) => {
          if (detalle.producto_id) {
            this.productosService.getProductoById(detalle.producto_id).subscribe({
              next: (producto) => {
                if (producto) {
                  const detalleIndex = this.detallesPedido.findIndex(
                    (d) => d.productoId === producto.id
                  );
                  if (detalleIndex !== -1) {
                    this.detallesPedido[detalleIndex].stock = producto.stock;
                  }
                }
              },
              error: () => {
                // Si no se puede obtener el producto, usar stock por defecto
              },
            });
          }
        });

        detallesLoaded = true;
        checkLoading();
      },
      error: (error) => {
        console.error('❌ Error al cargar detalles:', error);
        detallesLoaded = true;
        checkLoading();
      },
    });

    // Cargar métodos de pago del pedido
    // Usar una función de flecha para mantener el contexto de 'this'
    const loadMetodosPagoDelPedido = () => {
      if (!this.pedidoId) {
        console.warn('⚠️ No hay pedidoId para cargar métodos de pago');
        this.metodosPagoSeleccionados = [];
        metodosPagoLoaded = true;
        checkLoading();
        return;
      }
      
      console.log('🔄 Cargando métodos de pago del pedido...');
      console.log('📦 Métodos de pago disponibles antes de cargar:', this.metodosPago.length);
      
      this.ventasService.getMetodosPagoPedido(this.pedidoId).subscribe({
        next: (metodosPago) => {
          console.log('📦 Métodos de pago recibidos del servicio:', metodosPago);
          console.log('📦 Métodos de pago disponibles para mapear:', this.metodosPago);
          
          if (!metodosPago || metodosPago.length === 0) {
            console.log('ℹ️ No hay métodos de pago para este pedido');
            this.metodosPagoSeleccionados = [];
            metodosPagoLoaded = true;
            checkLoading();
            return;
          }
          
          this.metodosPagoSeleccionados = metodosPago.map((mp, index) => {
            const metodoPago = this.metodosPago.find((m) => m.id === mp.metodo_pago_id);
            
            if (!metodoPago) {
              console.warn(`⚠️ Método de pago con ID ${mp.metodo_pago_id} no encontrado en la lista de métodos disponibles`);
              console.warn(`   Métodos disponibles:`, this.metodosPago.map(m => ({ id: m.id, nombre: m.nombre })));
            }
            
            const metodoPagoSeleccionado = {
              id: Date.now() + index, // ID temporal único
              metodoPago: metodoPago || ({} as MetodoPago),
              monto: mp.monto_aplicado || 0,
            };
            
            console.log(`✅ Mapeado método de pago ${index + 1}:`, {
              metodo_pago_id: mp.metodo_pago_id,
              monto_aplicado: mp.monto_aplicado,
              metodoPago_encontrado: !!metodoPago,
              nombre: metodoPago?.nombre || 'NO ENCONTRADO',
              monto_asignado: metodoPagoSeleccionado.monto
            });
            
            return metodoPagoSeleccionado;
          });
          
          console.log('✅ Métodos de pago cargados y mapeados:', this.metodosPagoSeleccionados);
          console.log('✅ Total métodos de pago seleccionados:', this.metodosPagoSeleccionados.length);
          
          // Verificar que los montos se asignaron correctamente
          this.metodosPagoSeleccionados.forEach((mp, index) => {
            console.log(`  Método ${index + 1}:`, {
              id: mp.id,
              nombre: mp.metodoPago?.nombre || 'NO ENCONTRADO',
              monto: mp.monto,
              metodoPago_id: mp.metodoPago?.id
            });
          });
          
          metodosPagoLoaded = true;
          checkLoading();
        },
        error: (error) => {
          console.error('❌ Error al cargar métodos de pago:', error);
          this.metodosPagoSeleccionados = [];
          metodosPagoLoaded = true;
          checkLoading();
        },
      });
    };

    // Esperar a que los métodos de pago disponibles estén cargados primero
    // Si aún no se han cargado, esperar y reintentar hasta que estén disponibles
    const tryLoadMetodosPago = () => {
      if (this.metodosPago.length === 0 && this.loadingMetodosPago) {
        // Si aún se están cargando, esperar un poco más
        console.log('⏳ Esperando a que se carguen los métodos de pago disponibles...');
        setTimeout(() => {
          tryLoadMetodosPago();
        }, 200);
      } else if (this.metodosPago.length === 0 && !this.loadingMetodosPago) {
        // Si no se están cargando y no hay métodos, intentar cargar
        console.warn('⚠️ No hay métodos de pago disponibles, intentando cargar...');
        this.loadMetodosPago();
        setTimeout(() => {
          tryLoadMetodosPago();
        }, 500);
      } else {
        // Ya están cargados, proceder
        console.log('✅ Métodos de pago disponibles cargados, procediendo a cargar métodos del pedido');
        loadMetodosPagoDelPedido();
      }
    };

    tryLoadMetodosPago();

    // Cargar información del envío
    // Esperar a que los tipos de envío estén cargados antes de mapear
    const loadEnvioDelPedido = () => {
      if (!this.pedidoId) {
        console.log('⚠️ No hay pedidoId para cargar envío');
        envioLoaded = true;
        checkLoading();
        return;
      }

      console.log('🔄 Cargando envío del pedido. necesitaEnvio:', this.necesitaEnvio);

      // Siempre intentar cargar el envío, incluso si necesitaEnvio es false
      // porque puede haber un envío configurado aunque el checkbox esté desmarcado
      this.ventasService.getEnvioPedido(this.pedidoId).subscribe({
        next: (envio) => {
          console.log('📦 Envío recibido del servicio:', envio);
          console.log('📦 Tipos de envío disponibles:', this.tiposEnvio.length);
          
          if (envio && envio.tipo_envio_id) {
            console.log('🔍 Buscando tipo de envío con ID:', envio.tipo_envio_id);
            // Buscar el tipo de envío en la lista cargada
            const tipoEnvioEncontrado = this.tiposEnvio.find(
              (tipo) => tipo.id === envio.tipo_envio_id
            );
            
            if (tipoEnvioEncontrado) {
              this.tipoEnvio = tipoEnvioEncontrado;
              console.log('✅ Tipo de envío cargado y asignado:', tipoEnvioEncontrado.nombre, tipoEnvioEncontrado.id);
            } else {
              console.warn(`⚠️ Tipo de envío con ID ${envio.tipo_envio_id} no encontrado en la lista de tipos disponibles`);
              console.warn(`   Tipos disponibles:`, this.tiposEnvio.map(t => ({ id: t.id, nombre: t.nombre })));
              this.tipoEnvio = null;
            }
          } else {
            console.log('ℹ️ No hay tipo de envío configurado para este pedido (envio es null o no tiene tipo_envio_id)');
            this.tipoEnvio = null;
          }
          
          envioLoaded = true;
          checkLoading();
        },
        error: (error) => {
          console.error('❌ Error al cargar envío:', error);
          // Si no hay envío, no es un error crítico (puede que simplemente no tenga envío)
          this.tipoEnvio = null;
          envioLoaded = true;
          checkLoading();
        },
      });
    };

    // Esperar a que los tipos de envío estén cargados antes de cargar el envío del pedido
    const tryLoadEnvio = () => {
      console.log('🔄 tryLoadEnvio - tiposEnvio.length:', this.tiposEnvio.length, 'loadingTiposEnvio:', this.loadingTiposEnvio);
      
      if (this.tiposEnvio.length === 0 && this.loadingTiposEnvio) {
        // Si aún se están cargando, esperar un poco más
        console.log('⏳ Esperando a que se carguen los tipos de envío disponibles...');
        setTimeout(() => {
          tryLoadEnvio();
        }, 200);
      } else if (this.tiposEnvio.length === 0 && !this.loadingTiposEnvio) {
        // Si no se están cargando y no hay tipos, intentar cargar
        console.warn('⚠️ No hay tipos de envío disponibles, intentando cargar...');
        this.loadTiposEnvio();
        setTimeout(() => {
          tryLoadEnvio();
        }, 500);
      } else {
        // Ya están cargados, proceder
        console.log('✅ Tipos de envío disponibles cargados (' + this.tiposEnvio.length + ' tipos), procediendo a cargar envío del pedido');
        loadEnvioDelPedido();
      }
    };

    // Iniciar la carga del envío después de un pequeño delay para asegurar que necesitaEnvio esté establecido
    setTimeout(() => {
      tryLoadEnvio();
    }, 100);
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
    this.venta = {
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
    this.costoEnvioManual = null;
    this.metodosPagoSeleccionados = [];
    this.metodoPagoTemporal = null;
    this.ignorarISV = false;
  }

  onFueHoyChange(): void {
    if (this.fueHoy) {
      this.venta.fechaPedido = new Date();
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
          productoId: item.producto.id,
        });
      }
    });
  }

  getProductImageUrl(product: Product | string | null): string {
    const defaultImageUrl =
      'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

    if (!product) {
      return defaultImageUrl;
    }

    if (typeof product === 'string') {
      if (
        !product ||
        product.trim() === '' ||
        product === '#f0f0f0' ||
        product === 'null'
      ) {
        return defaultImageUrl;
      }
      return product;
    }

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

  // Verificar si el tipo de envío seleccionado es MANUAL
  esTipoManual(): boolean {
    return this.tipoEnvio?.tipo === 'MANUAL';
  }

  // Calcular el costo de envío
  calcularCostoEnvio(): number {
    if (!this.necesitaEnvio || !this.tipoEnvio) {
      return 0;
    }

    // Si el tipo es MANUAL, usar el costo manual ingresado
    if (this.tipoEnvio.tipo === 'MANUAL') {
      return this.costoEnvioManual || 0;
    }

    // Si tiene costo_base, usarlo
    if (this.tipoEnvio.costo_base !== null && this.tipoEnvio.costo_base !== undefined) {
      return this.tipoEnvio.costo_base;
    }

    return 0;
  }

  calcularTotal(): number {
    return this.calcularSubtotal() + this.calcularIVA() + this.calcularCostoEnvio();
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

  actualizarVenta(): void {
    if (this.detallesPedido.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Pedido vacío',
        detail: 'Debes agregar al menos un producto al pedido',
      });
      return;
    }

    if (
      !this.venta.nombreCliente ||
      !this.venta.telefonoCliente ||
      !this.venta.canal ||
      !this.venta.estado ||
      !this.venta.fechaPedido ||
      !this.venta.direccionCliente
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

    // Validar costo de envío manual si es requerido
    if (this.necesitaEnvio && this.esTipoManual() && (!this.costoEnvioManual || this.costoEnvioManual <= 0)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Costo de envío requerido',
        detail: 'Debe ingresar un monto válido para el envío manual',
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

    const fechaPedido = this.venta.fechaPedido
      ? new Date(this.venta.fechaPedido).toISOString().split('T')[0]
      : null;

    const ventaJSON = {
      canalId: this.venta.canal,
      estadoId: this.venta.estado,
      fechaPedido: fechaPedido,
      total: this.calcularTotal(),
      notas: this.venta.notas || null,
      nombreCliente: this.venta.nombreCliente,
      telefonoCliente: this.venta.telefonoCliente,
      necesitaEnvio: this.necesitaEnvio,
      tipoEnvioId: this.tipoEnvio?.id || null,
      cantidadEnvio: null, // No se usa actualmente
      direccionCliente: this.venta.direccionCliente,
      costoEnvio: this.necesitaEnvio ? this.calcularCostoEnvio() : null,
      ignorarISV: this.ignorarISV,
      isv: this.calcularIVA(),
    };

    const detallesJSON = this.detallesPedido.map((detalle) => ({
      detalleId: detalle.detalleId || null, // ID del detalle existente, null si es nuevo
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
    this.ventasService.actualizarVentaCompleta(this.pedidoId!, ventaCompletaJSON).subscribe({
      next: (response) => {
        this.loading = false;

        if (response.exito) {
          this.messageService.add({
            severity: 'success',
            summary: 'Venta actualizada',
            detail: `Venta #${this.pedidoId} actualizada exitosamente`,
          });

          this.onHide();
          this.ventaActualizada.emit();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error al actualizar',
            detail: response.mensaje || 'No se pudo actualizar la venta',
          });
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('❌ Error al actualizar venta:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al actualizar',
          detail:
            error.message ||
            'Ocurrió un error al intentar actualizar la venta. Por favor intenta nuevamente.',
        });
      },
    });
  }
}
