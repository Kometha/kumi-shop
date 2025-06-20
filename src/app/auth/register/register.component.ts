import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';

import { AuthService, RegisterCredentials } from '../../services/auth.service';

interface RegisterForm {
  nombres: string;
  apellidos: string;
  fecha_nacimiento: Date;
  genero: string;
  email: string;
  numero_celular: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    DropdownModule,
    CalendarModule,
    MessageModule,
    MessagesModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Opciones para el dropdown de género
  generoOptions = [
    { label: 'Masculino', value: 'masculino' },
    { label: 'Femenino', value: 'femenino' },
    { label: 'Otro', value: 'otro' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.registerForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      fecha_nacimiento: ['', [Validators.required]],
      genero: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      numero_celular: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/) // 10 dígitos
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/) // Al menos 1 minúscula, 1 mayúscula, 1 número
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Validador personalizado para confirmar contraseña
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    if (confirmPassword?.errors?.['mismatch']) {
      delete confirmPassword.errors['mismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = this.registerForm.value as RegisterForm;

      // Formatear fecha para envío
      const fechaNacimiento = formData.fecha_nacimiento;
      const fechaString = fechaNacimiento.toISOString().split('T')[0]; // YYYY-MM-DD

      const credentials: RegisterCredentials = {
        email: formData.email,
        password: formData.password,
        name: `${formData.nombres} ${formData.apellidos}`,
        // Datos adicionales en metadata
        metadata: {
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          fecha_nacimiento: fechaString,
          genero: formData.genero,
          numero_celular: formData.numero_celular
        }
      };

      this.authService.register(credentials).subscribe({
        next: (response) => {
          this.loading = false;

          if (response.success) {
            this.successMessage = response.message || 'Usuario registrado exitosamente';

            // Limpiar formulario
            this.registerForm.reset();

            // Redirigir después de 2 segundos
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);

          } else {
            this.errorMessage = response.error || 'Error al registrar usuario';
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Error de conexión. Intenta de nuevo.';
          console.error('Error en registro:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  // Métodos de validación para mostrar errores
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);

    if (field?.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} es requerido`;
      if (field.errors['email']) return 'Email inválido';
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['pattern']) {
        if (fieldName === 'numero_celular') return 'Número debe tener 10 dígitos';
        if (fieldName === 'password') return 'Contraseña debe tener al menos 1 mayúscula, 1 minúscula y 1 número';
      }
      if (field.errors['mismatch']) return 'Las contraseñas no coinciden';
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nombres: 'Nombres',
      apellidos: 'Apellidos',
      fecha_nacimiento: 'Fecha de nacimiento',
      genero: 'Género',
      email: 'Email',
      numero_celular: 'Número celular',
      password: 'Contraseña',
      confirmPassword: 'Confirmación de contraseña'
    };
    return labels[fieldName] || fieldName;
  }

  getMaxDate(): Date {
    // Fecha máxima: hace 13 años (para usuarios menores de edad)
    const today = new Date();
    today.setFullYear(today.getFullYear() - 13);
    return today;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
