import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CalendarModule } from 'primeng/calendar';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TraditionalAuthService, RegisterCredentials } from '../../services/traditional-auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CalendarModule,
    SelectModule,
    CardModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;

  // Opciones para dropdowns
  generoOptions = [
    { label: 'Masculino', value: 'masculino' },
    { label: 'Femenino', value: 'femenino' },
    { label: 'Otro', value: 'otro' },
    { label: 'Prefiero no decir', value: 'no_decir' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: TraditionalAuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    this.registerForm = this.fb.group({
      // Campos básicos requeridos
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],

      // Campos del perfil (opcionales)
      nombres: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      fechaNacimiento: [''],
      genero: [''],
      numeroCelular: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    // Suscribirse al estado de loading
    this.authService.loading$.subscribe(loading => {
      this.loading = loading;
    });
  }

  // Validador personalizado para confirmar contraseña
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const formValue = this.registerForm.value;

      const credentials: RegisterCredentials = {
        email: formValue.email,
        password: formValue.password,
        name: `${formValue.nombres} ${formValue.apellidos}`.trim(),
        nombres: formValue.nombres,
        apellidos: formValue.apellidos,
        fechaNacimiento: formValue.fechaNacimiento ?
          new Date(formValue.fechaNacimiento).toISOString().split('T')[0] : undefined,
        genero: formValue.genero,
        numeroCelular: formValue.numeroCelular
      };

      console.log('📝 Intentando registro con:', credentials.email);

      this.authService.register(credentials).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('✅ Registro exitoso');

            this.messageService.add({
              severity: 'success',
              summary: 'Registro exitoso',
              detail: response.message || 'Usuario registrado correctamente'
            });

            // Redirigir al login después de un breve delay
            setTimeout(() => {
              this.router.navigate(['/login'], {
                queryParams: {
                  message: 'registered',
                  email: credentials.email
                }
              });
            }, 2000);

          } else {
            console.error('❌ Error en registro:', response.error);

            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.error || 'Error al registrar usuario'
            });
          }
        },
        error: (error) => {
          console.error('💥 Error inesperado:', error);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error inesperado. Intenta nuevamente.'
          });
        }
      });

    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });

      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Por favor, completa todos los campos requeridos correctamente'
      });
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  // Métodos auxiliares para el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);

    if (field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['email']) {
        return 'Email inválido';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      nombres: 'Nombres',
      apellidos: 'Apellidos',
      fechaNacimiento: 'Fecha de nacimiento',
      genero: 'Género',
      numeroCelular: 'Número de celular'
    };
    return labels[fieldName] || fieldName;
  }
}
