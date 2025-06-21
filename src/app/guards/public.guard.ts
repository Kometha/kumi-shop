import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, filter, switchMap } from 'rxjs/operators';
import { TraditionalAuthService } from '../services/traditional-auth.service';

@Injectable({
  providedIn: 'root'
})
export class PublicGuard implements CanActivate {

  constructor(
    private authService: TraditionalAuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    console.log('🛡️ [PUBLIC GUARD] Verificando acceso a ruta pública');

    // Esperar a que el servicio termine la inicialización
    return this.authService.initialized$.pipe(
      filter(initialized => initialized), // Esperar a que sea true
      take(1), // Solo tomar el primer valor
      switchMap(() => this.authService.isAuthenticated$), // Cambiar al observable de autenticación
      take(1), // Solo tomar un valor
      map(isAuthenticated => {
        if (!isAuthenticated) {
          console.log('✅ [PUBLIC GUARD] Usuario no autenticado, acceso permitido');
          return true;
        } else {
          console.log('❌ [PUBLIC GUARD] Usuario autenticado, redirigiendo a dashboard');
          this.router.navigate(['/dashboard']);
          return false;
        }
      })
    );
  }
}
