import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <!-- Icon badge -->
    <div class="auth-icon-badge mb-4">
      <i class="bi bi-ticket-perforated-fill"></i>
    </div>

    <h2 class="auth-title">Bienvenido de nuevo</h2>
    <p class="auth-sub">Ingresá a tu cuenta de SuperSorteo para continuar</p>

    <!-- Success alert -->
    @if (registered()) {
      <div class="auth-alert auth-alert--success" role="status">
        <i class="bi bi-check-circle-fill"></i>
        ¡Cuenta creada! Ingresá con tus credenciales.
      </div>
    }

    <!-- Error alert -->
    @if (error()) {
      <div class="auth-alert auth-alert--danger" role="alert">
        <i class="bi bi-exclamation-triangle-fill"></i>
        {{ error() }}
      </div>
    }

    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <!-- Email -->
      <div class="mb-3">
        <label class="auth-label" for="email">
          <i class="bi bi-envelope me-1 opacity-50"></i>Email
        </label>
        <input id="email" type="email" class="form-control auth-input"
               formControlName="email" autocomplete="email"
               placeholder="tu@email.com"
               [class.is-invalid]="touched('email') && form.get('email')?.invalid">
        @if (touched('email') && form.get('email')?.hasError('required')) {
          <div class="invalid-feedback">El email es obligatorio</div>
        }
        @if (touched('email') && form.get('email')?.hasError('email')) {
          <div class="invalid-feedback">Ingresá un email válido</div>
        }
      </div>

      <!-- Password -->
      <div class="mb-4">
        <label class="auth-label" for="password">
          <i class="bi bi-lock me-1 opacity-50"></i>Contraseña
        </label>
        <div class="input-group auth-input-group">
          <input id="password" [type]="showPass() ? 'text' : 'password'"
                 class="form-control auth-input"
                 formControlName="password" autocomplete="current-password"
                 placeholder="Tu contraseña"
                 [class.is-invalid]="touched('password') && form.get('password')?.invalid">
          <button type="button" class="auth-pass-toggle"
                  (click)="showPass.set(!showPass())"
                  [attr.aria-label]="showPass() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
            <i [class]="showPass() ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
          @if (touched('password') && form.get('password')?.invalid) {
            <div class="invalid-feedback">La contraseña es obligatoria</div>
          }
        </div>
      </div>

      <!-- Submit -->
      <button type="submit" class="btn btn-gradient w-100 py-3 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2"
              [disabled]="loading()">
        @if (loading()) {
          <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          Ingresando...
        } @else {
          <i class="bi bi-box-arrow-in-right"></i>Iniciar sesión
        }
      </button>
    </form>

    <!-- Divider -->
    <div class="auth-divider">
      <span>¿No tenés cuenta?</span>
    </div>

    <a routerLink="/auth/register" class="auth-link-btn">
      <i class="bi bi-person-plus-fill me-1"></i>
      Registrate gratis
    </a>
  `,
  styles: [`
    :host { display: block; }

    .auth-icon-badge {
      width: 58px; height: 58px; border-radius: 1rem; margin: 0 auto;
      background: linear-gradient(135deg, #eef2ff, #e0e3ff);
      border: 1px solid rgba(99,102,241,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
      color: #6366f1;
      box-shadow: 0 4px 16px rgba(99,102,241,.18);
    }

    .auth-title {
      text-align: center; font-size: 1.45rem; font-weight: 900;
      color: #18181b; margin-bottom: .35rem; letter-spacing: -0.03em;
    }
    .auth-sub {
      text-align: center; color: #71717a; font-size: .875rem;
      margin-bottom: 1.5rem; line-height: 1.5;
    }

    .auth-alert {
      display: flex; align-items: center; gap: .5rem;
      padding: .7rem .9rem; border-radius: .75rem;
      font-size: .85rem; font-weight: 500; margin-bottom: 1.25rem;
    }
    .auth-alert--success {
      background: #f0fdf4; color: #15803d; border: 1px solid rgba(22,163,74,.2);
    }
    .auth-alert--danger {
      background: #fff1f2; color: #be123c; border: 1px solid rgba(244,63,94,.2);
    }

    .auth-label {
      display: block; font-size: .82rem; font-weight: 700;
      color: #3f3f46; margin-bottom: .35rem;
    }

    .auth-input {
      border-color: #e0e3ff;
      border-radius: .75rem !important;
      padding: .65rem .9rem;
      font-size: .9rem;
      background: #fafaff;
      transition: border-color .2s, box-shadow .2s, background .2s;

      &:focus {
        background: #fff;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99,102,241,.16);
      }
    }

    .auth-input-group {
      display: flex;
      .auth-input { border-right: none; border-radius: .75rem 0 0 .75rem !important; }
    }

    .auth-pass-toggle {
      border: 1.5px solid #e0e3ff; border-left: none;
      border-radius: 0 .75rem .75rem 0;
      background: #fafaff; color: #71717a;
      padding: 0 .85rem; cursor: pointer;
      transition: background .15s, color .15s;
      display: flex; align-items: center; justify-content: center;

      &:hover { background: #f3f4ff; color: #6366f1; }
    }

    .auth-divider {
      display: flex; align-items: center; gap: .75rem;
      margin: 1.25rem 0;
      &::before, &::after { content: ''; flex: 1; height: 1px; background: #e4e4e7; }
      span { color: #a1a1aa; font-size: .8rem; white-space: nowrap; }
    }

    .auth-link-btn {
      display: flex; align-items: center; justify-content: center; gap: .4rem;
      width: 100%; padding: .7rem;
      border: 1.5px solid #e0e3ff; border-radius: .75rem;
      color: #6366f1; font-weight: 700; font-size: .88rem;
      text-decoration: none; background: #fafaff;
      transition: border-color .18s, background .18s, box-shadow .18s;

      &:hover {
        border-color: #6366f1; background: #f3f4ff;
        box-shadow: 0 0 0 3px rgba(99,102,241,.1);
        color: #4338ca;
      }
    }
  `]
})
export class Login {
  protected readonly auth  = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  private readonly fb     = inject(FormBuilder);

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
      next: () => this.router.navigate(['/dashboard']),
      error: (e: Error) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }
}
