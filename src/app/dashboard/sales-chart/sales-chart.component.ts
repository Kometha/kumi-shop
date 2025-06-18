import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

// Registrar los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-sales-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-chart.component.html',
  styleUrl: './sales-chart.component.scss'
})
export class SalesChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('salesChart', { static: false }) salesChart!: ElementRef<HTMLCanvasElement>;

  private salesChartInstance: Chart | null = null;

  // Datos para el gráfico de ventas
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

  constructor() {}

  ngAfterViewInit() {
    this.createSalesChart();
  }

  private createSalesChart() {
    if (this.salesChart?.nativeElement) {
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

  ngOnDestroy() {
    if (this.salesChartInstance) {
      this.salesChartInstance.destroy();
    }
  }
}
