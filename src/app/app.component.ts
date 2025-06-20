import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Kumi Shop';

  constructor(public authService: AuthService) {}

  ngOnInit() {
    // Detectar y resolver conflictos de NavigatorLock al inicio
    this.resolveInitialConflicts();

    // Escuchar errores de ventana para capturar NavigatorLock errors
    window.addEventListener('error', (event) => {
      if (event.error?.message?.includes('NavigatorLockAcquireTimeoutError')) {
        console.warn('NavigatorLock error detected, attempting to resolve...');
        this.authService.resolveNavigatorLockConflict();
      }
    });
  }

  /**
   * Resolver conflictos iniciales de NavigatorLock
   */
  private resolveInitialConflicts() {
    // Verificar en el siguiente tick para asegurar que DOM esté listo
    setTimeout(() => {
      if (this.authService.hasNavigatorLockConflict()) {
        console.log('Initial NavigatorLock conflict detected, resolving...');
        this.authService.resolveNavigatorLockConflict();
      }
    }, 100);
  }
}
