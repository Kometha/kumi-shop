import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { VentasService, VentasMensualesDashboard, VentasMensualesItem } from '../../services/ventas.service';

// Registrar los componentes de Chart.js
Chart.register(...registerables);

const MES_ORDEN: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  Ene: 1, Abr: 4, Ago: 8, Dic: 12
};

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

  constructor(private ventasService: VentasService) {}

  ngAfterViewInit() {
    this.ventasService.getVentasMensualesDashboard().subscribe({
      next: (data) => this.buildChart(data),
      error: () => this.buildChart(null)
    });
  }

  private buildChart(data: VentasMensualesDashboard | null): void {
    const { labels, ventasData, egresosData } = this.buildChartData(data);
    this.salesData = {
      labels,
      datasets: [
        {
          label: 'Ventas',
          data: ventasData,
          backgroundColor: '#8b5cf6',
          borderColor: '#8b5cf6',
          borderWidth: 0,
          borderRadius: 4
        },
        {
          label: 'Egresos',
          data: egresosData,
          backgroundColor: '#ef4444',
          borderColor: '#ef4444',
          borderWidth: 0,
          borderRadius: 4
        }
      ]
    };
    this.createSalesChart();
  }

  private salesData = {
    labels: [] as string[],
    datasets: [] as { label: string; data: number[]; backgroundColor: string; borderColor: string; borderWidth: number; borderRadius: number }[]
  };

  private buildChartData(data: VentasMensualesDashboard | null): { labels: string[]; ventasData: number[]; egresosData: number[] } {
    if (!data?.ventas?.length && !data?.egresos?.length) {
      return { labels: [], ventasData: [], egresosData: [] };
    }
    const byKey = new Map<string, { ventas: number; egresos: number }>();
    const add = (items: VentasMensualesItem[], type: 'ventas' | 'egresos') => {
      (items || []).forEach((it) => {
        const key = `${it.mes}-${it.anio}`;
        const curr = byKey.get(key) ?? { ventas: 0, egresos: 0 };
        if (type === 'ventas') curr.ventas = it.total;
        else curr.egresos = it.total;
        byKey.set(key, curr);
      });
    };
    add(data?.ventas ?? [], 'ventas');
    add(data?.egresos ?? [], 'egresos');
    const sorted = [...byKey.entries()].sort((a, b) => {
      const [ma, aa] = a[0].split('-');
      const [mb, ab] = b[0].split('-');
      const diffAnio = (parseInt(aa, 10) || 0) - (parseInt(ab, 10) || 0);
      if (diffAnio !== 0) return diffAnio;
      return (MES_ORDEN[ma] ?? 99) - (MES_ORDEN[mb] ?? 99);
    });
    const labels = sorted.map(([k]) => {
      const [mes, anio] = k.split('-');
      return `${mes} ${anio}`;
    });
    const ventasData = sorted.map(([, v]) => v.ventas);
    const egresosData = sorted.map(([, v]) => v.egresos);
    return { labels, ventasData, egresosData };
  }

  private createSalesChart() {
    if (this.salesChart?.nativeElement) {
      if (this.salesChartInstance) {
        this.salesChartInstance.destroy();
        this.salesChartInstance = null;
      }
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
