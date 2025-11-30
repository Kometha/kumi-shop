import { Component, EventEmitter, Output, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DropdownModule } from 'primeng/dropdown';
import { ProductosService, NuevoProducto, Product, Categoria } from '../services/productos.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

interface ProductForm {
  nombre: string;
  stock: number;
  costo: number;
  precioVenta: number;
  descripcion: string;
  categoriaId: number | null;
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
    DropdownModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './add-product-modal.component.html',
  styleUrl: './add-product-modal.component.scss'
})
export class AddProductModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() productToEdit: Product | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() productCreated = new EventEmitter<void>();
  @Output() productUpdated = new EventEmitter<void>();

  product: ProductForm = {
    nombre: '',
    stock: 0,
    costo: 0,
    precioVenta: 0,
    descripcion: '',
    categoriaId: null
  };

  loading = false;
  isEditMode = false;
  productId: number | null = null;
  categorias: Categoria[] = [];
  loadingCategorias = false;


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
    this.cargarCategorias();
  }

  /**
   * Cargar categorías desde el servicio
   */
  cargarCategorias(): void {
    this.loadingCategorias = true;
    this.productosService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.loadingCategorias = false;
        console.log('✅ Categorías cargadas:', categorias);
      },
      error: (error) => {
        this.loadingCategorias = false;
        console.error('❌ Error al cargar categorías:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las categorías'
        });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productToEdit'] && this.productToEdit) {
      this.loadProductForEdit();
    } else {
      this.resetForm();
    }
  }

  /**
   * Cargar datos del producto para edición
   */
  loadProductForEdit(): void {
    if (this.productToEdit) {
      this.isEditMode = true;
      this.productId = this.productToEdit.id;
      this.product = {
        nombre: this.productToEdit.producto,
        stock: this.productToEdit.stock,
        costo: this.productToEdit.costo,
        precioVenta: this.productToEdit.precio,
        descripcion: '',
        categoriaId: null
      };

      // Cargar imagen existente si existe y es válida
      // Si no hay imagen o es el valor por defecto '#f0f0f0', previewImage será null
      // y se mostrará el placeholder de "Subir Imagen"
      if (this.productToEdit.imagen &&
          this.productToEdit.imagen !== '#f0f0f0' &&
          this.productToEdit.imagen.trim() !== '' &&
          this.productToEdit.imagen !== 'null') {
        this.previewImage = this.productToEdit.imagen;
        this.selectedFile = null; // No hay archivo nuevo seleccionado
      } else {
        // No hay imagen válida, mostrar placeholder de subir imagen
        this.previewImage = null;
        this.selectedFile = null;
      }
    }
  }

  /**
   * Resetear formulario para modo creación
   */
  resetForm(): void {
    this.isEditMode = false;
    this.productId = null;
    this.product = {
      nombre: '',
      stock: 0,
      costo: 0,
      precioVenta: 0,
      descripcion: '',
      categoriaId: null
    };
    this.previewImage = null;
    this.selectedFile = null;
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

    if (this.isEditMode && this.productId) {
      // Modo edición: actualizar producto existente
      const productoActualizado: Partial<NuevoProducto> = {
        nombre: this.product.nombre,
        stock: this.product.stock,
        costo: this.product.costo,
        precioVenta: this.product.precioVenta,
        imagen: this.selectedFile || undefined,
        imagenUrl: this.selectedFile ? undefined : this.previewImage || undefined
      };

      this.productosService.actualizarProducto(this.productId, productoActualizado).subscribe({
        next: (producto) => {
          this.loading = false;
          console.log('✅ Producto actualizado exitosamente:', producto);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Producto actualizado correctamente'
          });

          // Emitir evento para que el componente padre recargue los productos
          this.productUpdated.emit();

          // Cerrar modal después de un breve delay
          setTimeout(() => {
            this.close.emit();
            this.resetForm();
          }, 1000);
        },
        error: (error) => {
          this.loading = false;
          console.error('❌ Error al actualizar producto:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Error al actualizar el producto. Intenta nuevamente.'
          });
        }
      });
    } else {
      // Modo creación: crear nuevo producto
      const nuevoProducto: NuevoProducto = {
        nombre: this.product.nombre,
        categoria_id: this.product.categoriaId || 1, // Usar categoría seleccionada o valor por defecto
        stock: this.product.stock,
        stockMinimo: 0, // Valor por defecto
        costo: this.product.costo,
        precioVenta: this.product.precioVenta,
        estado: 'disponible', // Valor por defecto
        imagen: this.selectedFile || undefined
      };

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
            this.resetForm();
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
