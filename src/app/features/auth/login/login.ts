import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h2 class="fw-bold mb-1 text-center">Bienvenido</h2>
    <p class="text-muted text-center small mb-4">Ingresá a tu cuenta de SuperRifa</p>

    @if (registered()) {
      <div class="alert alert-success py-2 small" role="status">
        <i class="bi bi-check-circle-fill me-1"></i>¡Cuenta creada! Ingresá con tus credenciales.
      </div>
    }

    @if (error()) {
      <div class="alert alert-danger py-2 small" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ error() }}
      </div>
    }

    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="mb-3">
        <label class="form-label fw-medium" for="email">Email</label>
        <input id="email" type="email" class="form-control"
               formControlName="email" autocomplete="email"
               [class.is-invalid]="touched('email') && form.get('email')?.invalid">
        @if (touched('email') && form.get('email')?.hasError('required')) {
          <div class="invalid-feedback">El email es obligatorio</div>
        }
      </div>

      <div class="mb-4">
        <label class="form-label fw-medium" for="password">Contraseña</label>
        <div class="input-group">
          <input id="password" [type]="showPass() ? 'text' : 'password'" class="form-control"
                 formControlName="password" autocomplete="current-password"
                 [class.is-invalid]="touched('password') && form.get('password')?.invalid">
          <button type="button" class="btn btn-outline-secondary"
                  (click)="showPass.set(!showPass())"
                  [attr.aria-label]="showPass() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
            <i [class]="showPass() ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
        </div>
      </div>

      <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold"
              [disabled]="loading()">
        @if (loading()) {
          <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
        }
        Iniciar sesión
      </button>
    </form>

    <hr class="my-3">
    <p class="text-center small mb-0">
      ¿No tenés cuenta?
      <a routerLink="/auth/register" class="text-primary fw-medium">Registrate gratis</a>
    </p>
  `
})
export class Login {
  protected readonly auth  = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb   = inject(FormBuilder);

  protected readonly loading    = signal(false);
  protected readonly error      = signal('');
  protected readonly showPass   = signal(false);
  protected readonly registered = signal(
    this.route.snapshot.queryParamMap.get('registered') === '1'
  );

  protected readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected touched(field: string): boolean {
    return !!this.form.get(field)?.touched;
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.form.getRawValue() as { email: string; password: string }).subscribe({
      next: () => this.router.navigate([this.auth.isAdmin() ? '/admin' : '/dashboard']),
      error: (e: Error) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }
}
