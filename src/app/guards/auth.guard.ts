import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter, switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar a que termine el loading inicial antes de verificar autenticación
  return authService.loading$.pipe(
    filter(loading => !loading), // Esperar a que loading sea false
    take(1), // Tomar solo cuando haya terminado de cargar
    switchMap(() => authService.isAuthenticated$), // Entonces verificar autenticación
    take(1), // Tomar el estado de autenticación
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      } else {
        // Redirigir al login si no está autenticado
        router.navigate(['/login']);
        return false;
      }
    })
  );
};

// Guard para rutas públicas (login/register)
// Si ya está autenticado, redirige al dashboard
export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // También esperar a que termine el loading para las rutas públicas
  return authService.loading$.pipe(
    filter(loading => !loading), // Esperar a que loading sea false
    take(1),
    switchMap(() => authService.isAuthenticated$),
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        // Si ya está autenticado, redirigir al dashboard
        router.navigate(['/dashboard']);
        return false;
      } else {
        return true;
      }
    })
  );
};
