import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { TraditionalAuthService } from '../../services/traditional-auth.service';
import { Subject, takeUntil, filter } from 'rxjs';

// Importar componentes de forma explícita
import { DashboardHeaderComponent } from '../../dashboard/dashboard-header/dashboard-header.component';
import { DashboardSidebarComponent } from '../../dashboard/dashboard-sidebar/dashboard-sidebar.component';

const COMPONENTS = [
  DashboardHeaderComponent,
  DashboardSidebarComponent
] as const;

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ...COMPONENTS
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  title = 'Kumi Honduras';
  sidebarVisible = false;
  selectedMenu: string = 'dashboard';
  private destroy$ = new Subject<void>();

  constructor(
    public authService: TraditionalAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    // Suscribirse a cambios de ruta para actualizar el menú seleccionado
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        this.updateSelectedMenuFromRoute(event.url);
      });

    // Actualizar el menú seleccionado basado en la ruta actual
    this.updateSelectedMenuFromRoute(this.router.url);

    // Suscribirse a cambios de autenticación
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: any) => {
        if (!user) {
          this.router.navigate(['/login']);
        } else {
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Actualizar el menú seleccionado basado en la URL actual
   */
  private updateSelectedMenuFromRoute(url: string): void {
    if (url.includes('/inventario')) {
      this.selectedMenu = 'inventario';
    } else if (url.includes('/dashboard') || url === '/') {
      this.selectedMenu = 'dashboard';
    } else {
      // Extraer el nombre de la ruta
      const segments = url.split('/').filter(s => s);
      this.selectedMenu = segments[segments.length - 1] || 'dashboard';
    }
    this.cdr.detectChanges();
  }

  /**
   * Abrir el sidebar
   */
  openSidebar(): void {
    this.sidebarVisible = true;
    this.cdr.detectChanges();
  }

  /**
   * Manejar selección de menú desde el sidebar
   * El sidebar ya maneja la navegación, solo actualizamos el estado local
   */
  onMenuSelected(menu: string): void {
    this.selectedMenu = menu;
    // Cerrar el drawer en dispositivos móviles
    if (window.innerWidth < 768) {
      this.sidebarVisible = false;
    }
    this.cdr.detectChanges();
  }

  /**
   * Manejar logout
   */
  logout(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Cerrando sesión...',
      detail: 'Cerrando sesión...'
    });

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
        this.router.navigate(['/login']);
      }
    });
  }
}
