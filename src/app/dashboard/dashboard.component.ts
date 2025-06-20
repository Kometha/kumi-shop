import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { StatCardComponent } from '../shared/stat-card/stat-card.component';
import { InventoryComponent } from '../inventory/inventory.component';
import { RecentSalesComponent } from './recent-sales/recent-sales.component';
import { InventoryAlertsComponent } from './inventory-alerts/inventory-alerts.component';
import { SalesChartComponent } from './sales-chart/sales-chart.component';
import { InventoryChartComponent } from './inventory-chart/inventory-chart.component';
import { AuthService } from '../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DrawerModule,
    StatCardComponent,
    InventoryComponent,
    RecentSalesComponent,
    InventoryAlertsComponent,
    SalesChartComponent,
    InventoryChartComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  title = 'Kumi Shop';
  sidebarVisible = false;
  selectedMenu: string = 'dashboard';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Verificar si hay conflictos de NavigatorLock al inicializar
    this.checkNavigatorLockConflicts();

    // Suscribirse a cambios de autenticación para manejar estados
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
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
      .subscribe(loading => {
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

  /**
   * Verificar y resolver conflictos de NavigatorLock
   */
  private checkNavigatorLockConflicts() {
    if (this.authService.hasNavigatorLockConflict()) {
      console.log('Detectado conflicto de NavigatorLock, resolviendo...');
      this.authService.resolveNavigatorLockConflict();
    }
  }

  get currentUser$() {
    return this.authService.currentUser$;
  }

  /**
   * Abrir/cerrar el sidebar con verificación adicional
   */
  toggleSidebar() {
    console.log('Toggle sidebar clicked, current state:', this.sidebarVisible);
    this.sidebarVisible = !this.sidebarVisible;

    // Forzar detección de cambios
    this.cdr.detectChanges();

    console.log('New sidebar state:', this.sidebarVisible);
  }

  /**
   * Abrir el sidebar específicamente
   */
  openSidebar() {
    console.log('Open sidebar clicked');
    this.sidebarVisible = true;
    this.cdr.detectChanges();
  }

  selectMenu(menu: string) {
    console.log('Menu selected:', menu);
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

  /**
   * Función de emergencia para resolver problemas del sidebar
   */
  emergencyResetSidebar() {
    console.log('Emergency sidebar reset triggered');

    // Forzar el estado del sidebar
    this.sidebarVisible = false;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.sidebarVisible = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.sidebarVisible = false;
        this.cdr.detectChanges();
      }, 100);
    }, 100);
  }

  /**
   * Resolver todos los problemas persistentes
   */
  resolveAllIssues() {
    console.log('Resolving all persistent issues...');

    // 1. Resolver conflictos de NavigatorLock
    this.authService.resolveNavigatorLockConflict();

    // 2. Resetear sidebar
    this.emergencyResetSidebar();

    // 3. Forzar detección de cambios
    this.cdr.detectChanges();

    // 4. Si es necesario, deep clean
    setTimeout(() => {
      if (this.authService.hasNavigatorLockConflict()) {
        console.log('Issues persist, performing deep clean...');
        this.authService.deepCleanAndReset();

        // Recomendar refresh después de deep clean
        setTimeout(() => {
          if (confirm('Para resolver completamente los problemas, es recomendable recargar la página. ¿Deseas hacerlo ahora?')) {
            window.location.reload();
          }
        }, 1000);
      }
    }, 2000);
  }

  logout() {
    console.log('Logout clicked');

    // Cerrar sidebar antes del logout
    this.sidebarVisible = false;
    this.cdr.detectChanges();

    this.authService.logout().subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Logout successful, redirecting...');
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        // Forzar logout incluso si hay error
        this.router.navigate(['/login']);
      }
    });
  }
}
