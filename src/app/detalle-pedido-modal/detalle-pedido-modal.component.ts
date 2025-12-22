import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ImageModule } from 'primeng/image';
import { ButtonModule } from 'primeng/button';
import { VentasService, DetallePedidoCompleto } from '../services/ventas.service';

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
  loading: boolean = false;

  constructor(private ventasService: VentasService) {}

  ngOnInit(): void {
    if (this.pedidoId) {
      this.loadDetalles();
    }
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
    this.ventasService.getDetallesPedido(this.pedidoId).subscribe({
      next: (detalles) => {
        this.detalles = detalles;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar detalles del pedido:', error);
        this.loading = false;
      },
    });
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
    return this.detalles.reduce((total, detalle) => total + detalle.subtotal, 0);
  }

  calcularTotalDescuentos(): number {
    return this.detalles.reduce((total, detalle) => total + (detalle.descuento || 0), 0);
  }

  calcularTotal(): number {
    return this.calcularSubtotal();
  }
}

