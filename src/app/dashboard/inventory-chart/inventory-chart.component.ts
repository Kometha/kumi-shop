import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

// Registrar los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-inventory-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory-chart.component.html',
  styleUrl: './inventory-chart.component.scss'
})
export class InventoryChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('inventoryChart', { static: false }) inventoryChart!: ElementRef<HTMLCanvasElement>;

  private inventoryChartInstance: Chart | null = null;

  // Datos para el gráfico de inventario
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

  constructor() {}

  ngAfterViewInit() {
    this.createInventoryChart();
  }

  private createInventoryChart() {
    if (this.inventoryChart?.nativeElement) {
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

  ngOnDestroy() {
    if (this.inventoryChartInstance) {
      this.inventoryChartInstance.destroy();
    }
  }
}
