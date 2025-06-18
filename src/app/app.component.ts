import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from './shared/stat-card/stat-card.component';
import { InventoryComponent } from './inventory/inventory.component';
import { RecentSalesComponent } from './dashboard/recent-sales/recent-sales.component';
import { InventoryAlertsComponent } from './dashboard/inventory-alerts/inventory-alerts.component';
import { SalesChartComponent } from './dashboard/sales-chart/sales-chart.component';
import { InventoryChartComponent } from './dashboard/inventory-chart/inventory-chart.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ButtonModule,
    DrawerModule,
    StatCardComponent,
    InventoryComponent,
    RecentSalesComponent,
    InventoryAlertsComponent,
    SalesChartComponent,
    InventoryChartComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Kumi Shop';
  sidebarVisible = false;
  selectedMenu: string = 'dashboard';

  constructor() {
    // Constructor limpio
  }

  selectMenu(menu: string) {
    this.selectedMenu = menu;

    // Opcionalmente cerrar el drawer en dispositivos móviles
    if (window.innerWidth < 768) {
      this.sidebarVisible = false;
    }
  }

  getSelectedTitle(): string {
    const titles: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'inventario': 'Gestión de Inventario',
      'clientes': 'Gestión de Clientes',
      'configuracion': 'Configuración'
    };
    return titles[this.selectedMenu] || 'Dashboard';
  }
}
