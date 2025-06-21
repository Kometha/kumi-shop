import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
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

    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          console.log('✅ Guard: Usuario autenticado, acceso permitido');
          return true;
        } else {
          console.log('❌ Guard: Usuario no autenticado, redirigiendo a login');
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      })
    );
  }
}
