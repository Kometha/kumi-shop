import { Routes } from '@angular/router';
import { TraditionalAuthGuard } from './guards/traditional-auth.guard';
import { PublicGuard } from './guards/public.guard';
import { LoginComponent } from './auth/login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardHomeComponent } from './dashboard/dashboard-home/dashboard-home.component';
import { InventoryComponent } from './inventory/inventory.component';
import { VentasComponent } from './ventas-component/ventas-component.component';
import { AplicacionMovilComponent } from './aplicacion-movil/aplicacion-movil.component';

export const routes: Routes = [
  // Rutas públicas (solo accesibles si NO está autenticado)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [PublicGuard]
  },

  // Rutas privadas con layout (header y sidebar globales)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [TraditionalAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardHomeComponent
      },
      {
        path: 'inventario',
        component: InventoryComponent
      },
      {
        path: 'ventas',
        component: VentasComponent
      },
      {
        path: 'aplicacion-movil',
        component: AplicacionMovilComponent
      }
    ]
  },

  // Redirección para rutas no encontradas
  {
    path: '**',
    redirectTo: '/login'
  }
];
