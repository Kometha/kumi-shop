import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  TraditionalAuthService,
  LoginCredentials,
} from '../../services/traditional-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    ToastModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  returnUrl: string = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: TraditionalAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(1)]],
    });
  }

  ngOnInit() {
    // Obtener la URL de retorno de los query params
    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Suscribirse al estado de loading
    this.authService.loading$.subscribe((loading) => {
      this.loading = loading;
    });
  }

  onSubmit() {
    if (!this.loginForm.valid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.loginForm.controls).forEach((key) => {
        this.loginForm.get(key)?.markAsTouched();
      });

      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Por favor, completa todos los campos correctamente',
      });
      return;
    }

    this.loading = true;
    const credentials: LoginCredentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          console.log('✅ Login exitoso:', response.user);

          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: response.message || 'Sesión iniciada correctamente',
          });

          // Redirigir después de un breve delay para mostrar el mensaje
          setTimeout(() => {
            this.router.navigate([this.returnUrl]);
          }, 1000);
        } else {
          console.error('❌ Error en login:', response.error);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.error || 'Error al iniciar sesión',
          });
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('💥 Error inesperado:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error inesperado. Intenta nuevamente.',
        });
      },
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  // Métodos auxiliares para el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        if (fieldName === 'username') {
          return 'El nombre de usuario es requerido';
        }
        return `${fieldName} es requerido`;
      }
      if (field.errors['minlength']) {
        return `${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }
}
