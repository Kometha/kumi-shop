import { Routes } from '@angular/router';
import { TraditionalAuthGuard } from './guards/traditional-auth.guard';
import { PublicGuard } from './guards/public.guard';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  // Rutas públicas (solo accesibles si NO está autenticado)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [PublicGuard]
  },

  // Rutas privadas (solo accesibles si ESTÁ autenticado)
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [TraditionalAuthGuard]
  },

  // Redirección para rutas no encontradas
  {
    path: '**',
    redirectTo: '/login'
  }
];
