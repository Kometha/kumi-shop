import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
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
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (!isAuthenticated) {
          console.log('✅ Public Guard: Usuario no autenticado, acceso permitido');
          return true;
        } else {
          console.log('❌ Public Guard: Usuario autenticado, redirigiendo a dashboard');
          this.router.navigate(['/dashboard']);
          return false;
        }
      })
    );
  }
}
