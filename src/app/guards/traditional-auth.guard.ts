import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, filter, switchMap } from 'rxjs/operators';
import { TraditionalAuthService } from '../services/traditional-auth.service';

@Injectable({
  providedIn: 'root'
})
export class TraditionalAuthGuard implements CanActivate {

  constructor(
    private authService: TraditionalAuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    console.log('🛡️ [GUARD] Verificando acceso a:', state.url);

    // Esperar a que el servicio termine la inicialización
    return this.authService.initialized$.pipe(
      filter(initialized => initialized), // Esperar a que sea true
      take(1), // Solo tomar el primer valor
      switchMap(() => this.authService.isAuthenticated$), // Cambiar al observable de autenticación
      take(1), // Solo tomar un valor
      map(isAuthenticated => {
        if (isAuthenticated) {
          console.log('✅ [GUARD] Usuario autenticado, acceso permitido a:', state.url);
          return true;
        } else {
          console.log('❌ [GUARD] Usuario no autenticado, redirigiendo a login desde:', state.url);
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      })
    );
  }
}
