import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { ImageModule } from 'primeng/image';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProductosService, Product } from '../services/productos.service';

@Component({
  selector: 'app-seleccionar-productos-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    MultiSelectModule,
    InputNumberModule,
    ImageModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
  ],
  templateUrl: './seleccionar-productos-modal.component.html',
  styleUrl: './seleccionar-productos-modal.component.scss',
  providers: [MessageService],
})
export class SeleccionarProductosModalComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() productosDisponibles: Product[] = [];
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() productosSeleccionados = new EventEmitter<Array<{ producto: Product; cantidad: number }>>();

  productosSeleccionadosList: Product[] = [];
  productosConCantidad: Array<{ producto: Product; cantidad: number }> = [];
  loadingProductos: boolean = false;
  selectedItemsLabel: string = '{0} productos seleccionados';

  constructor(
    private productosService: ProductosService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    if (this.productosDisponibles.length === 0) {
      this.loadProductos();
    }
  }

  loadProductos(): void {
    this.loadingProductos = true;
    this.productosService.getProductos().subscribe({
      next: (productos) => {
        this.productosDisponibles = productos;
        this.loadingProductos = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
        this.loadingProductos = false;
      },
    });
  }

  onHide(): void {
    this.visibleChange.emit(false);
    this.resetForm();
    document.body.style.overflow = 'auto';
  }

  resetForm(): void {
    this.productosSeleccionadosList = [];
    this.productosConCantidad = [];
  }

  onProductosSeleccionadosChange(): void {
    this.productosConCantidad = this.productosSeleccionadosList.map((producto) => {
      const existente = this.productosConCantidad.find((p) => p.producto.id === producto.id);
      return {
        producto: producto,
        cantidad: existente ? existente.cantidad : 1,
      };
    });
  }

  finalizarSeleccionProductos(): void {
    let hayError = false;

    this.productosConCantidad.forEach((item) => {
      if (!item.cantidad || item.cantidad <= 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cantidad inválida',
          detail: `Debes ingresar una cantidad válida para ${item.producto.producto}`,
        });
        hayError = true;
        return;
      }

      if (item.cantidad > item.producto.stock) {
        this.messageService.add({
          severity: 'error',
          summary: 'Stock insuficiente',
          detail: `No se puede vender más de ${item.producto.stock} unidades de ${item.producto.producto}. Stock disponible: ${item.producto.stock}`,
        });
        hayError = true;
        return;
      }
    });

    if (hayError) {
      return;
    }

    this.productosSeleccionados.emit(this.productosConCantidad);
    this.onHide();
  }

  getProductImageUrl(product: Product): string {
    const defaultImageUrl =
      'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

    if (
      !product.imagen ||
      product.imagen.trim() === '' ||
      product.imagen === '#f0f0f0' ||
      product.imagen === 'null'
    ) {
      return defaultImageUrl;
    }

    return product.imagen;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2,
    }).format(value);
  }
}

