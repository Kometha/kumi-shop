import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import {
  ProductosService,
  AlertasComerciales,
  AlertaStockCritico,
  ProductoSinRotacion
} from '../../services/productos.service';

@Component({
  selector: 'app-inventory-alerts',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule],
  templateUrl: './inventory-alerts.component.html',
  styleUrl: './inventory-alerts.component.scss'
})
export class InventoryAlertsComponent implements OnInit {
  alertas: AlertasComerciales | null = null;
  loading = true;
  mostrarModalStockCritico = false;
  mostrarModalSinRotacion = false;

  readonly PREVIEW_LIMIT = 5;

  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.productosService.getAlertasComerciales().subscribe({
      next: (data) => {
        this.alertas = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get productosCriticosPreview(): AlertaStockCritico[] {
    const productos = this.alertas?.stockCritico?.productos ?? [];
    return productos.slice(0, this.PREVIEW_LIMIT);
  }

  get hayMasProductosCriticos(): boolean {
    return (this.alertas?.stockCritico?.productos?.length ?? 0) > this.PREVIEW_LIMIT;
  }

  get productosSinRotacionPreview(): ProductoSinRotacion[] {
    const productos = this.alertas?.sinRotacion?.productos ?? [];
    return productos.slice(0, this.PREVIEW_LIMIT);
  }

  get hayMasProductosSinRotacion(): boolean {
    return (this.alertas?.sinRotacion?.productos?.length ?? 0) > this.PREVIEW_LIMIT;
  }

  formatStock(cantidad: number): string {
    return cantidad === 1 ? '1 unidad' : `${cantidad} unidades`;
  }

  formatDiasSinVenta(dias: number): string {
    return `+${dias} días`;
  }

  abrirModalStockCritico(): void {
    this.mostrarModalStockCritico = true;
    document.body.style.overflow = 'hidden';
  }

  cerrarModalStockCritico(): void {
    this.mostrarModalStockCritico = false;
    document.body.style.overflow = 'auto';
  }

  abrirModalSinRotacion(): void {
    this.mostrarModalSinRotacion = true;
    document.body.style.overflow = 'hidden';
  }

  cerrarModalSinRotacion(): void {
    this.mostrarModalSinRotacion = false;
    document.body.style.overflow = 'auto';
  }
}
