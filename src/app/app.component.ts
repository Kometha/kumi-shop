import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from './shared/stat-card/stat-card.component';
import { InventoryComponent } from './inventory/inventory.component';
import { Chart, registerables } from 'chart.js';

// Registrar los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ButtonModule,
    DrawerModule,
    StatCardComponent,
    InventoryComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'Kumi Shop';
  sidebarVisible = false;
  selectedMenu: string = 'dashboard';

  @ViewChild('salesChart', { static: false }) salesChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('inventoryChart', { static: false }) inventoryChart!: ElementRef<HTMLCanvasElement>;

  private salesChartInstance: Chart | null = null;
  private inventoryChartInstance: Chart | null = null;

  // Datos para los gráficos
  private salesData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
      {
        label: 'Ventas',
        data: [4200, 2800, 2000, 2600, 1800, 2300, 3200, 4000, 2400, 2700, 2600, 1900],
        backgroundColor: '#8b5cf6',
        borderColor: '#8b5cf6',
        borderWidth: 0,
        borderRadius: 4
      },
      {
        label: 'Ingresos',
        data: [2400, 1400, 10000, 3600, 4800, 3600, 4400, 2400, 1400, 10000, 3600, 4800],
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        borderWidth: 0,
        borderRadius: 4
      }
    ]
  };

  private inventoryData = {
    labels: ['Sillas', 'Mesas', 'Sofás', 'Camas', 'Estanterías'],
    datasets: [
      {
        data: [31, 23, 23, 15, 8],
        backgroundColor: [
          '#3b82f6', // Azul - Sillas
          '#10b981', // Verde - Mesas
          '#f59e0b', // Amarillo - Sofás
          '#f97316', // Naranja - Camas
          '#8b5cf6'  // Púrpura - Estanterías
        ],
        borderWidth: 0
      }
    ]
  };

  constructor() {
    // Constructor vacío
  }

  ngAfterViewInit() {
    this.createSalesChart();
    this.createInventoryChart();
  }

  private createSalesChart() {
    if (this.salesChart?.nativeElement && this.selectedMenu === 'dashboard') {
      const ctx = this.salesChart.nativeElement.getContext('2d');
      if (ctx) {
        this.salesChartInstance = new Chart(ctx, {
          type: 'bar',
          data: this.salesData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  padding: 20
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false
                }
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: '#f3f4f6'
                }
              }
            }
          }
        });
      }
    }
  }

  private createInventoryChart() {
    if (this.inventoryChart?.nativeElement && this.selectedMenu === 'dashboard') {
      const ctx = this.inventoryChart.nativeElement.getContext('2d');
      if (ctx) {
        this.inventoryChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: this.inventoryData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'right',
                labels: {
                  usePointStyle: true,
                  padding: 20,
                  generateLabels: (chart) => {
                    const data = chart.data;
                    if (data.labels && data.labels.length && data.datasets.length) {
                      return data.labels.map((label, i) => {
                        const dataset = data.datasets[0];
                        const total = (dataset.data as number[]).reduce((a, b) => a + b, 0);
                        const value = dataset.data[i] as number;
                        const percentage = Math.round((value / total) * 100);

                        return {
                          text: `${label} ${percentage}%`,
                          fillStyle: (dataset.backgroundColor as string[])[i],
                          strokeStyle: (dataset.backgroundColor as string[])[i],
                          lineWidth: 0,
                          index: i
                        };
                      });
                    }
                    return [];
                  }
                }
              }
            },
            cutout: '60%'
          }
        });
      }
    }
  }

  selectMenu(menu: string) {
    this.selectedMenu = menu;

    // Recrear los gráficos cuando se selecciona dashboard
    if (menu === 'dashboard') {
      setTimeout(() => {
        this.createSalesChart();
        this.createInventoryChart();
      }, 100);
    }

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

  ngOnDestroy() {
    // Limpiar las instancias de los gráficos
    if (this.salesChartInstance) {
      this.salesChartInstance.destroy();
    }
    if (this.inventoryChartInstance) {
      this.inventoryChartInstance.destroy();
    }
  }
}
