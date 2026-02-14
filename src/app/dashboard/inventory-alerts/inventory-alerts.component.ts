import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProductosService, AlertasInventario, AlertaProducto } from '../../services/productos.service';

@Component({
  selector: 'app-inventory-alerts',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule],
  templateUrl: './inventory-alerts.component.html',
  styleUrl: './inventory-alerts.component.scss'
})
export class InventoryAlertsComponent implements OnInit {
  alertas: AlertasInventario | null = null;
  loading = true;
  mostrarModalStockCritico = false;

  readonly PREVIEW_LIMIT = 5;

  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.productosService.getAlertasInventario().subscribe({
      next: (data) => {
        this.alertas = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get productosPreview(): AlertaProducto[] {
    const productos = this.alertas?.productos ?? [];
    return productos.slice(0, this.PREVIEW_LIMIT);
  }

  get hayMasProductos(): boolean {
    return (this.alertas?.productos?.length ?? 0) > this.PREVIEW_LIMIT;
  }

  formatStock(cantidad: number): string {
    return cantidad === 1 ? '1 unidad' : `${cantidad} unidades`;
  }

  abrirModalStockCritico(): void {
    this.mostrarModalStockCritico = true;
    document.body.style.overflow = 'hidden';
  }

  cerrarModalStockCritico(): void {
    this.mostrarModalStockCritico = false;
    document.body.style.overflow = 'auto';
  }
}
