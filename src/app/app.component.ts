import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { TraditionalAuthService } from './services/traditional-auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ToastModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Kumi Shop';

  constructor(public authService: TraditionalAuthService) {}

  ngOnInit() {
    // Verificar si hay un usuario autenticado al inicio
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        console.log('✅ Usuario autenticado:', user.username);
      } else {
        console.log('❌ No hay usuario autenticado');
      }
    });
  }
}
