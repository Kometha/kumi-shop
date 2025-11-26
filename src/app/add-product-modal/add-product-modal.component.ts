import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ProductosService, NuevoProducto } from '../services/productos.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

interface ProductForm {
  nombre: string;
  stock: number;
  costo: number;
  precioVenta: number;
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
    SelectModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './add-product-modal.component.html',
  styleUrl: './add-product-modal.component.scss'
})
export class AddProductModalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() productCreated = new EventEmitter<void>();

  product: ProductForm = {
    nombre: '',
    stock: 0,
    costo: 0,
    precioVenta: 0
  };

  loading = false;


  constructor(
    private productosService: ProductosService,
    private messageService: MessageService
  ) {}

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
    if (this.product.costo && this.product.precioVenta) {
      const margin = ((this.product.precioVenta - this.product.costo) / this.product.costo) * 100;
      return Math.round(margin * 100) / 100;
    }
    return 0;
  }

  onCancel(): void {
    this.close.emit();
  }

  onSave(): void {
    // Validación básica
    if (!this.product.nombre ||
        this.product.costo === undefined || this.product.precioVenta === undefined ||
        this.product.stock === undefined) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'Por favor completa todos los campos obligatorios'
      });
      return;
    }

    if (this.product.costo < 0 || this.product.precioVenta < 0 ||
        this.product.stock < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Valores inválidos',
        detail: 'Los valores no pueden ser negativos'
      });
      return;
    }

    this.loading = true;

    // Crear objeto NuevoProducto para enviar a la BD
    // Usar valores por defecto para campos que no se envían
    const nuevoProducto: NuevoProducto = {
      nombre: this.product.nombre,
      categoria_id: 1, // Valor por defecto
      stock: this.product.stock,
      stockMinimo: 0, // Valor por defecto
      costo: this.product.costo,
      precioVenta: this.product.precioVenta,
      estado: 'disponible', // Valor por defecto
      imagen: this.selectedFile || undefined
    };

    // Llamar al servicio para crear el producto
    this.productosService.crearProducto(nuevoProducto).subscribe({
      next: (producto) => {
        this.loading = false;
        console.log('✅ Producto creado exitosamente:', producto);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Producto agregado correctamente'
        });

        // Emitir evento para que el componente padre recargue los productos
        this.productCreated.emit();

        // Cerrar modal después de un breve delay
        setTimeout(() => {
          this.close.emit();
        }, 1000);
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Error al crear producto:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Error al crear el producto. Intenta nuevamente.'
        });
      }
    });
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
