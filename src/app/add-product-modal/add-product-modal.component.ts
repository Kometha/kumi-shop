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
  categoria: string;
  stock: number;
  descripcion: string;
  costo: number;
  precio: number;
  estado: string;
  imagen?: string;
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
    categoria: '',
    stock: 0,
    descripcion: '',
    costo: 0,
    precio: 0,
    estado: 'disponible'
  };

  categorias = [
    { label: 'Sofás', value: 'sofas' },
    { label: 'Mesas', value: 'mesas' },
    { label: 'Sillas', value: 'sillas' },
    { label: 'Estanterías', value: 'estanterias' },
    { label: 'Camas', value: 'camas' },
    { label: 'Escritorios', value: 'escritorios' },
    { label: 'Armarios', value: 'armarios' },
    { label: 'Decoración', value: 'decoracion' }
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
    // Por ahora solo cerramos el modal
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
