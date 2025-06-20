import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './guards/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  // Ruta por defecto - redirige según el estado de autenticación
  {
    path: '',
    redirectTo: '/register',
    pathMatch: 'full'
  },

  // Rutas públicas (solo accesibles si NO está autenticado)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [publicGuard]
  },

  // Rutas privadas (solo accesibles si ESTÁ autenticado)
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },

  // Redirección para rutas no encontradas
  {
    path: '**',
    redirectTo: '/register'
  }
];
