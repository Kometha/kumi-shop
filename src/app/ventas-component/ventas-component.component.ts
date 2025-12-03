import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    FormsModule
  ],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.scss'
})
export class VentasComponent {
  searchValue: string = '';
  loading: boolean = false;
  ventas: any[] = []; // Placeholder para datos futuros
  filteredVentas: any[] = []; // Placeholder para datos futuros

  // Métodos placeholder (sin lógica aún)
  applyFilters(): void {
    // Lógica futura
  }

  getFilteredVentasCount(): number {
    return this.filteredVentas.length;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(value);
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (estado) {
      case 'completado':
        return 'success';
      case 'pendiente':
        return 'warn';
      case 'cancelado':
        return 'danger';
      default:
        return 'info';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'completado':
        return 'Completado';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado;
    }
  }
}
