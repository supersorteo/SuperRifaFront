import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h2 class="fw-bold mb-1 text-center">Crear cuenta</h2>
    <p class="text-muted text-center small mb-4">Empezá a vender rifas hoy</p>

    @if (error()) {
      <div class="alert alert-danger py-2 small" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ error() }}
      </div>
    }

    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="mb-3">
        <label class="form-label fw-medium" for="fullName">Nombre completo</label>
        <input id="fullName" type="text" class="form-control"
               formControlName="fullName" autocomplete="name"
               [class.is-invalid]="touched('fullName') && form.get('fullName')?.invalid">
        @if (touched('fullName') && form.get('fullName')?.hasError('required')) {
          <div class="invalid-feedback">El nombre es obligatorio</div>
        }
      </div>

      <div class="mb-3">
        <label class="form-label fw-medium" for="email">Email</label>
        <input id="email" type="email" class="form-control"
               formControlName="email" autocomplete="email"
               [class.is-invalid]="touched('email') && form.get('email')?.invalid">
        @if (touched('email') && form.get('email')?.hasError('email')) {
          <div class="invalid-feedback">Email inválido</div>
        }
      </div>

      <div class="mb-3">
        <label class="form-label fw-medium" for="phone">Teléfono / WhatsApp</label>
        <input id="phone" type="tel" class="form-control"
               formControlName="phone" autocomplete="tel"
               placeholder="+54 9 11 1234-5678">
      </div>

      <div class="mb-4">
        <label class="form-label fw-medium" for="password">Contraseña</label>
        <div class="input-group">
          <input id="password" [type]="showPass() ? 'text' : 'password'" class="form-control"
                 formControlName="password" autocomplete="new-password"
                 [class.is-invalid]="touched('password') && form.get('password')?.invalid">
          <button type="button" class="btn btn-outline-secondary"
                  (click)="showPass.set(!showPass())"
                  [attr.aria-label]="showPass() ? 'Ocultar' : 'Mostrar'">
            <i [class]="showPass() ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
          @if (touched('password') && form.get('password')?.hasError('minlength')) {
            <div class="invalid-feedback">Mínimo 8 caracteres</div>
          }
        </div>
      </div>

      <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold"
              [disabled]="loading()">
        @if (loading()) {
          <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
        }
        <i class="bi bi-person-check me-1"></i>Crear cuenta gratis
      </button>
    </form>

    <hr class="my-3">
    <p class="text-center small mb-0">
      ¿Ya tenés cuenta?
      <a routerLink="/auth/login" class="text-primary fw-medium">Iniciá sesión</a>
    </p>
  `
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly showPass = signal(false);

  protected readonly form = this.fb.group({
    fullName: ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    phone:    [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected touched(field: string): boolean {
    return !!this.form.get(field)?.touched;
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.register(this.form.getRawValue() as { fullName: string; email: string; phone: string; password: string }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e: Error) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }
}
