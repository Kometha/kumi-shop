import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ImageModule } from 'primeng/image';
import { ButtonModule } from 'primeng/button';
import { VentasService, DetallePedidoCompleto, PedidoCompleto, TipoEnvio } from '../services/ventas.service';

@Component({
  selector: 'app-detalle-pedido-modal',
  standalone: true,
  imports: [CommonModule, TableModule, ImageModule, ButtonModule],
  templateUrl: './detalle-pedido-modal.component.html',
  styleUrl: './detalle-pedido-modal.component.scss',
})
export class DetallePedidoModalComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() pedidoId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  detalles: DetallePedidoCompleto[] = [];
  pedidoCompleto: PedidoCompleto | null = null;
  tipoEnvio: TipoEnvio | null = null;
  tiposEnvio: TipoEnvio[] = [];
  loading: boolean = false;

  constructor(private ventasService: VentasService) {}

  ngOnInit(): void {
    this.loadTiposEnvio();
    if (this.pedidoId) {
      this.loadDetalles();
    }
  }

  loadTiposEnvio(): void {
    this.ventasService.getTiposEnvio().subscribe({
      next: (tiposEnvio) => {
        this.tiposEnvio = tiposEnvio;
      },
      error: (error) => {
        console.error('❌ Error al cargar tipos de envío:', error);
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue && this.pedidoId) {
      this.loadDetalles();
    }
    if (changes['pedidoId']?.currentValue && this.visible) {
      this.loadDetalles();
    }
  }

  loadDetalles(): void {
    if (!this.pedidoId) return;

    this.loading = true;
    let detallesLoaded = false;
    let pedidoLoaded = false;

    const checkLoading = () => {
      if (detallesLoaded && pedidoLoaded) {
        this.loading = false;
      }
    };

    // Cargar detalles de productos y información completa del pedido en paralelo
    this.ventasService.getDetallesPedido(this.pedidoId).subscribe({
      next: (detalles) => {
        this.detalles = detalles;
        detallesLoaded = true;
        checkLoading();
      },
      error: (error) => {
        console.error('❌ Error al cargar detalles del pedido:', error);
        detallesLoaded = true;
        checkLoading();
      },
    });

    this.ventasService.getPedidoCompleto(this.pedidoId).subscribe({
      next: (pedido) => {
        this.pedidoCompleto = pedido;
        // Buscar el tipo de envío si existe
        if (pedido?.tipo_envio_id && this.tiposEnvio.length > 0) {
          this.tipoEnvio = this.tiposEnvio.find(t => t.id === pedido.tipo_envio_id) || null;
        }
        pedidoLoaded = true;
        checkLoading();
      },
      error: (error) => {
        console.error('❌ Error al cargar información completa del pedido:', error);
        pedidoLoaded = true;
        checkLoading();
      },
    });
  }

  // Obtener el nombre del tipo de envío
  getNombreTipoEnvio(): string {
    if (!this.pedidoCompleto?.tipo_envio_id) {
      return '';
    }
    
    // Si ya tenemos el tipo de envío cargado
    if (this.tipoEnvio) {
      return this.tipoEnvio.nombre;
    }
    
    // Buscar en la lista de tipos de envío
    const tipo = this.tiposEnvio.find(t => t.id === this.pedidoCompleto?.tipo_envio_id);
    if (tipo) {
      this.tipoEnvio = tipo;
      return tipo.nombre;
    }
    
    return `Tipo de envío ID: ${this.pedidoCompleto.tipo_envio_id}`;
  }

  // Verificar si el tipo de envío es MANUAL
  esTipoEnvioManual(): boolean {
    return this.tipoEnvio?.tipo === 'MANUAL';
  }

  onHide(): void {
    this.visibleChange.emit(false);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2,
    }).format(value);
  }

  getProductImageUrl(imagenUrl: string | null): string {
    const defaultImageUrl =
      'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

    if (!imagenUrl || imagenUrl.trim() === '' || imagenUrl === 'null') {
      return defaultImageUrl;
    }

    return imagenUrl;
  }

  calcularSubtotal(): number {
    if (this.pedidoCompleto?.subtotal_productos !== null && this.pedidoCompleto?.subtotal_productos !== undefined) {
      return this.pedidoCompleto.subtotal_productos;
    }
    return this.detalles.reduce((total, detalle) => total + detalle.subtotal, 0);
  }

  calcularTotalDescuentos(): number {
    return this.detalles.reduce((total, detalle) => total + (detalle.descuento || 0), 0);
  }

  calcularISV(): number {
    if (this.pedidoCompleto?.isv !== null && this.pedidoCompleto?.isv !== undefined) {
      return this.pedidoCompleto.isv;
    }
    return 0;
  }

  calcularCostoEnvio(): number {
    if (this.pedidoCompleto?.costo_envio !== null && this.pedidoCompleto?.costo_envio !== undefined) {
      return this.pedidoCompleto.costo_envio;
    }
    return 0;
  }

  calcularTotalComisionesMetodos(): number {
    if (this.pedidoCompleto?.total_comisiones_metodos !== null && this.pedidoCompleto?.total_comisiones_metodos !== undefined) {
      return this.pedidoCompleto.total_comisiones_metodos;
    }
    return 0;
  }

  calcularTotalComisionesFinanciamiento(): number {
    if (this.pedidoCompleto?.total_comisiones_financiamiento !== null && this.pedidoCompleto?.total_comisiones_financiamiento !== undefined) {
      return this.pedidoCompleto.total_comisiones_financiamiento;
    }
    return 0;
  }

  calcularMontoNetoRecibido(): number {
    if (this.pedidoCompleto?.monto_neto_recibido !== null && this.pedidoCompleto?.monto_neto_recibido !== undefined) {
      return this.pedidoCompleto.monto_neto_recibido;
    }
    return 0;
  }

  calcularTotalFactura(): number {
    if (this.pedidoCompleto?.total_factura !== null && this.pedidoCompleto?.total_factura !== undefined) {
      return this.pedidoCompleto.total_factura;
    }
    return this.calcularTotal();
  }

  calcularTotal(): number {
    if (this.pedidoCompleto?.total !== null && this.pedidoCompleto?.total !== undefined) {
      return this.pedidoCompleto.total;
    }
    return this.calcularSubtotal();
  }

  tieneEnvio(): boolean {
    return this.pedidoCompleto?.necesita_envio === true;
  }

  ignorarISV(): boolean {
    return this.pedidoCompleto?.ignorar_isv === true;
  }
}

