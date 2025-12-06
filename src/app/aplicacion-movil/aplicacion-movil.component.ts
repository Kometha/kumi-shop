import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { AppVersionsService, AppVersion } from '../services/app-versions.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-aplicacion-movil',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    ToastModule
  ],
  templateUrl: './aplicacion-movil.component.html',
  styleUrl: './aplicacion-movil.component.scss'
})
export class AplicacionMovilComponent implements OnInit {
  appVersions: AppVersion[] = [];
  loading: boolean = false;

  constructor(
    private appVersionsService: AppVersionsService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadAppVersions();
  }

  loadAppVersions(): void {
    this.loading = true;
    this.appVersionsService.getAppVersions().subscribe({
      next: (versions) => {
        this.appVersions = versions;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar versiones:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las versiones de la aplicación'
        });
        this.loading = false;
      }
    });
  }

  downloadApk(apkUrl: string | null, versionName: string): void {
    if (!apkUrl) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay URL disponible para esta versión'
      });
      return;
    }

    try {
      // Crear un enlace temporal para descargar el archivo
      const link = document.createElement('a');
      link.href = apkUrl;
      link.download = `app-${versionName}.apk`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.messageService.add({
        severity: 'success',
        summary: 'Descarga iniciada',
        detail: `Descargando versión ${versionName}...`
      });
    } catch (error) {
      console.error('Error al descargar APK:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo iniciar la descarga'
      });
    }
  }
}
