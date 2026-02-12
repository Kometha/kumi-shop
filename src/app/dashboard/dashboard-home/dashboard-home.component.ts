import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';
import { SalesChartComponent } from '../sales-chart/sales-chart.component';
import { InventoryAlertsComponent } from '../inventory-alerts/inventory-alerts.component';
import { RecentSalesComponent } from '../recent-sales/recent-sales.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    SalesChartComponent,
    InventoryAlertsComponent,
    RecentSalesComponent
  ],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent {
}
