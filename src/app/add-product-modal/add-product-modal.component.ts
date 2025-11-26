import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

interface ProductForm {
  nombre: string;
  codigo: string;
  categoria: number;
  stock: number;
  descripcion: string;
  costo: number;
  precio: number;
  estado: string;
  stockMinimo: number;
  nivelReorden: number;
  imagen?: string;
}

interface NewProduct {
  tenantId: number;
  name: string;
  description: string;
  categoryId: number;
  sku: string;
  price: number;
  cost: number;
  stockQuantity: number;
  minimumStock: number;
  reorderLevel: number;
}

@Component({
  selector: 'app-add-product-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule
  ],
  templateUrl: './add-product-modal.component.html',
  styleUrl: './add-product-modal.component.scss'
})
export class AddProductModalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<ProductForm>();

  product: ProductForm = {
    nombre: '',
    codigo: '',
    categoria: 0,
    stock: 0,
    descripcion: '',
    costo: 0,
    precio: 0,
    estado: 'disponible',
    stockMinimo: 0,
    nivelReorden: 0
  };

  categorias = [
    { label: 'Sofás', value: 1 },
    { label: 'Mesas', value: 2 },
    { label: 'Sillas', value: 3 },
    { label: 'Estanterías', value: 4 },
    { label: 'Camas', value: 5 },
    { label: 'Escritorios', value: 6 },
    { label: 'Armarios', value: 7 },
    { label: 'Decoración', value: 8 }
  ];

  estados = [
    { label: 'Disponible', value: 'disponible' },
    { label: 'Stock Bajo', value: 'stock-bajo' },
    { label: 'Agotado', value: 'agotado' }
  ];

  previewImage: string | null = null;
  isDragging = false;
  selectedFile: File | null = null;
  showImageViewer = false;

  ngOnInit(): void {
    // No bloquear scroll aquí, lo manejamos desde el componente padre
  }

  ngOnDestroy(): void {
    // Restaurar scroll del body cuando el modal se destruye
    document.body.style.overflow = 'auto';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  private handleFile(file: File): void {
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor selecciona una imagen JPG, PNG o GIF');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    this.selectedFile = file;

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewImage = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.previewImage = null;
    this.selectedFile = null;
  }

  calculateMargin(): number {
    if (this.product.costo && this.product.precio) {
      const margin = ((this.product.precio - this.product.costo) / this.product.costo) * 100;
      return Math.round(margin * 100) / 100;
    }
    return 0;
  }

  onCancel(): void {
    this.close.emit();
  }

  onSave(): void {
        // Validación básica
    if (!this.product.nombre || !this.product.codigo || !this.product.categoria ||
        !this.product.precio || !this.product.costo || this.product.stockMinimo < 0 ||
        this.product.nivelReorden < 0) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Crear objeto NewProduct para enviar a la BD
    const newProduct: NewProduct = {
      tenantId: 1, // Siempre 1 para desarrollo
      name: this.product.nombre,
      description: this.product.descripcion || '',
      categoryId: this.product.categoria,
      sku: this.product.codigo,
      price: this.product.precio,
      cost: this.product.costo,
      stockQuantity: this.product.stock,
      minimumStock: this.product.stockMinimo,
      reorderLevel: this.product.nivelReorden
    };

    // Mostrar datos en consola para desarrollo
    console.log('Datos del producto a guardar:', JSON.stringify(newProduct, null, 2));

    // Cerrar modal
    this.close.emit();
  }

  viewImage(): void {
    if (this.previewImage) {
      this.showImageViewer = true;
    }
  }

  closeImageViewer(): void {
    this.showImageViewer = false;
  }
}
