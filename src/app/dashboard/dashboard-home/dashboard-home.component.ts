import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';
import { SalesChartComponent } from '../sales-chart/sales-chart.component';
import { InventoryAlertsComponent } from '../inventory-alerts/inventory-alerts.component';
import { VentasService, DashboardResumen } from '../../services/ventas.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    SalesChartComponent,
    InventoryAlertsComponent
  ],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent implements OnInit {
  resumen: DashboardResumen | null = null;
  loadingResumen = true;

  constructor(private ventasService: VentasService) {}

  ngOnInit(): void {
    this.ventasService.getDashboardResumen().subscribe({
      next: (data) => {
        this.resumen = data;
        this.loadingResumen = false;
      },
      error: () => {
        this.loadingResumen = false;
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  abs(value: number): number {
    return Math.abs(value);
  }
}
