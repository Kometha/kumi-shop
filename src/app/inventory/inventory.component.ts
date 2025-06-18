import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';

interface Product {
  id: number;
  imagen: string;
  producto: string;
  codigo: string;
  categoria: string;
  stock: number;
  costo: number;
  precio: number;
  margen: number;
  estado: 'disponible' | 'stock-bajo' | 'agotado';
}

@Component({
  selector: 'app-inventory',
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
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchValue: string = '';
  activeFilter: 'todos' | 'stock-bajo' | 'sin-movimiento' | 'ofertas' = 'todos';

  ngOnInit() {
    this.products = [
      {
        id: 1,
        imagen: '#3b82f6', // Color azul temporal
        producto: 'Sofá Moderno Gris',
        codigo: 'SOF-001',
        categoria: 'Sofás',
        stock: 15,
        costo: 2500.00,
        precio: 4999.00,
        margen: 50,
        estado: 'disponible'
      },
      {
        id: 2,
        imagen: '#8b5cf6', // Color púrpura temporal
        producto: 'Mesa de Centro Roble',
        codigo: 'MES-002',
        categoria: 'Mesas',
        stock: 8,
        costo: 1200.00,
        precio: 2499.00,
        margen: 52,
        estado: 'disponible'
      },
      {
        id: 3,
        imagen: '#10b981', // Color verde temporal
        producto: 'Silla Ergonómica Negra',
        codigo: 'SIL-003',
        categoria: 'Sillas',
        stock: 2,
        costo: 600.00,
        precio: 1299.00,
        margen: 54,
        estado: 'stock-bajo'
      },
      {
        id: 4,
        imagen: '#f59e0b', // Color naranja temporal
        producto: 'Estantería Modular',
        codigo: 'EST-004',
        categoria: 'Estanterías',
        stock: 12,
        costo: 1500.00,
        precio: 3199.00,
        margen: 53,
        estado: 'disponible'
      },
      {
        id: 5,
        imagen: '#ef4444', // Color rojo temporal
        producto: 'Cama King Size',
        codigo: 'CAM-005',
        categoria: 'Camas',
        stock: 5,
        costo: 4500.00,
        precio: 8999.00,
        margen: 50,
        estado: 'disponible'
      },
      {
        id: 6,
        imagen: '#6366f1', // Color indigo temporal
        producto: 'Escritorio Ejecutivo',
        codigo: 'ESC-006',
        categoria: 'Escritorios',
        stock: 0,
        costo: 3000.00,
        precio: 5499.00,
        margen: 45,
        estado: 'agotado'
      }
    ];

    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.products];

    // Aplicar filtro de búsqueda
    if (this.searchValue) {
      const searchLower = this.searchValue.toLowerCase();
      filtered = filtered.filter(product =>
        product.producto.toLowerCase().includes(searchLower) ||
        product.codigo.toLowerCase().includes(searchLower) ||
        product.categoria.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar filtro de categoría
    switch (this.activeFilter) {
      case 'stock-bajo':
        filtered = filtered.filter(product =>
          product.estado === 'stock-bajo' || product.stock < 5
        );
        break;
      case 'sin-movimiento':
        // Por ahora simulamos productos sin movimiento con stock alto
        filtered = filtered.filter(product => product.stock > 10);
        break;
      case 'ofertas':
        // Por ahora simulamos ofertas con productos con margen > 50%
        filtered = filtered.filter(product => product.margen > 50);
        break;
      case 'todos':
      default:
        // No aplicar filtro adicional
        break;
    }

    this.filteredProducts = filtered;
  }

  getFilteredProductsCount(): number {
    return this.filteredProducts.length;
  }

  // Métodos para actualizar filtros
  set searchValueUpdated(value: string) {
    this.searchValue = value;
    this.applyFilters();
  }

  set activeFilterUpdated(value: 'todos' | 'stock-bajo' | 'sin-movimiento' | 'ofertas') {
    this.activeFilter = value;
    this.applyFilters();
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' {
    switch (estado) {
      case 'disponible':
        return 'success';
      case 'stock-bajo':
        return 'warn';
      case 'agotado':
        return 'danger';
      default:
        return 'success';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'disponible':
        return 'Disponible';
      case 'stock-bajo':
        return 'Stock Bajo';
      case 'agotado':
        return 'Agotado';
      default:
        return estado;
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  }
}
