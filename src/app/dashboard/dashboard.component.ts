import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { StatCardComponent } from '../shared/stat-card/stat-card.component';
import { InventoryComponent } from '../inventory/inventory.component';
import { RecentSalesComponent } from './recent-sales/recent-sales.component';
import { InventoryAlertsComponent } from './inventory-alerts/inventory-alerts.component';
import { SalesChartComponent } from './sales-chart/sales-chart.component';
import { InventoryChartComponent } from './inventory-chart/inventory-chart.component';
import { DashboardHeaderComponent } from './dashboard-header/dashboard-header.component';
import { DashboardSidebarComponent } from './dashboard-sidebar/dashboard-sidebar.component';
import { TraditionalAuthService } from '../services/traditional-auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    InventoryComponent,
    RecentSalesComponent,
    InventoryAlertsComponent,
    SalesChartComponent,
    InventoryChartComponent,
    DashboardHeaderComponent,
    DashboardSidebarComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  title = 'Kumi Honduras';
  sidebarVisible = false;
  selectedMenu: string = 'dashboard';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: TraditionalAuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {}

    ngOnInit() {
    // Suscribirse a cambios de autenticación para manejar estados
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: any) => {
        if (!user) {
          // Si no hay usuario, redirigir al login
          this.router.navigate(['/login']);
        } else {
          // Forzar detección de cambios después de que el usuario se establezca
          this.cdr.detectChanges();
        }
      });

    // Escuchar el estado de loading para asegurar que la UI se actualice correctamente
    this.authService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading: boolean) => {
        if (!loading) {
          // Forzar detección de cambios cuando termine de cargar
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }



  get currentUser$() {
    return this.authService.currentUser$;
  }

  /**
   * Abrir el sidebar específicamente
   */
  openSidebar() {
    this.sidebarVisible = true;
    this.cdr.detectChanges();
  }

  selectMenu(menu: string) {
    this.selectedMenu = menu;

    // Opcionalmente cerrar el drawer en dispositivos móviles
    if (window.innerWidth < 768) {
      this.sidebarVisible = false;
    }

    // Forzar detección de cambios
    this.cdr.detectChanges();
  }

  getSelectedTitle(): string {
    const titles: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'inventario': 'Gestión de Inventario',
      'clientes': 'Gestión de Clientes',
      'configuracion': 'Configuración'
    };
    return titles[this.selectedMenu] || 'Dashboard';
  }



    logout() {
    // Mostrar mensaje de información
    this.messageService.add({
      severity: 'info',
      summary: 'Cerrando sesión...',
      detail: 'Cerrando sesión...'
    });

    // Cerrar sidebar antes del logout
    this.sidebarVisible = false;
    this.cdr.detectChanges();

    this.authService.logout().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.router.navigate(['/login']);
        }
      },
      error: (error: any) => {
        console.error('Error al cerrar sesión:', error);
        // Forzar logout incluso si hay error
        this.router.navigate(['/login']);
      }
    });
  }
}
