import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  selector: 'app-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule
  ],
  templateUrl: './export-dialog.component.html',
  styleUrl: './export-dialog.component.scss'
})
export class ExportDialogComponent {
  @Input() products: Product[] = [];
  @Output() close = new EventEmitter<void>();

  selectedFormat: 'pdf' | 'excel' | null = null;
  isExporting = false;

  selectFormat(format: 'pdf' | 'excel'): void {
    this.selectedFormat = format;
  }

  getExportButtonLabel(): string {
    if (this.isExporting) {
      return 'Exportando...';
    }
    return this.selectedFormat === 'pdf' ? 'Exportar PDF' : 'Exportar Excel';
  }

  onCancel(): void {
    this.close.emit();
  }

  async onExport(): Promise<void> {
    if (!this.selectedFormat) return;

    this.isExporting = true;

    try {
      if (this.selectedFormat === 'pdf') {
        await this.exportToPDF();
      } else {
        this.exportToExcel();
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al generar el archivo. Por favor intenta de nuevo.');
    } finally {
      this.isExporting = false;
      this.close.emit();
    }
  }

  private async exportToPDF(): Promise<void> {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('es-ES');

    // Configurar fuente
    doc.setFont('helvetica', 'normal');

    // Header
    doc.setFontSize(20);
    doc.setTextColor(31, 41, 55); // text-gray-900
    doc.text('INVENTARIO DE PRODUCTOS', 20, 25);

    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128); // text-gray-500
    doc.text(`Fecha: ${currentDate}`, 150, 25);

    // Resumen
    doc.setFontSize(14);
    doc.setTextColor(75, 85, 99); // text-gray-600
    doc.text(`Total de productos: ${this.products.length}`, 20, 40);

    // Preparar datos para la tabla
    const tableData = this.products.map(product => [
      '🎨', // Emoji para imagen
      product.producto,
      product.codigo,
      product.categoria,
      product.stock.toString(),
      this.formatCurrency(product.costo),
      this.formatCurrency(product.precio),
      `${product.margen}%`,
      this.getEstadoLabel(product.estado)
    ]);

    // Crear tabla
    autoTable(doc, {
      head: [['Img', 'Producto', 'Código', 'Categoría', 'Stock', 'Costo', 'Precio', 'Margen', 'Estado']],
      body: tableData,
      startY: 50,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [59, 130, 246], // bg-blue-600
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // bg-gray-50
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' }, // Imagen
        1: { cellWidth: 35 }, // Producto
        2: { cellWidth: 20 }, // Código
        3: { cellWidth: 25 }, // Categoría
        4: { cellWidth: 15, halign: 'center' }, // Stock
        5: { cellWidth: 25, halign: 'right' }, // Costo
        6: { cellWidth: 25, halign: 'right' }, // Precio
        7: { cellWidth: 15, halign: 'center' }, // Margen
        8: { cellWidth: 25 } // Estado
      }
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('Generado por Kumi Shop - Sistema de Gestión de Inventario', 20, pageHeight - 10);

    // Descargar
    const fileName = `inventario_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  private exportToExcel(): void {
    // Preparar datos para Excel (sin imagen)
    const excelData = this.products.map(product => ({
      'Producto': product.producto,
      'Código': product.codigo,
      'Categoría': product.categoria,
      'Stock': product.stock,
      'Costo': product.costo,
      'Precio': product.precio,
      'Margen (%)': product.margen,
      'Estado': this.getEstadoLabel(product.estado)
    }));

    // Crear workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();

    // Estilo para headers
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { bgColor: { indexed: 64 }, fgColor: { rgb: "4F46E5" } },
      alignment: { horizontal: "center" }
    };

    // Aplicar estilos (si es posible)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = headerStyle;
    }

    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 25 }, // Producto
      { wch: 12 }, // Código
      { wch: 15 }, // Categoría
      { wch: 8 },  // Stock
      { wch: 12 }, // Costo
      { wch: 12 }, // Precio
      { wch: 10 }, // Margen
      { wch: 12 }  // Estado
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

    const fileName = `inventario_${new Date().toISOString().split('T')[0]}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  }

  private getEstadoLabel(estado: string): string {
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
}
