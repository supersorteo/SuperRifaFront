import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <!-- Icon badge -->
    <div class="auth-icon-badge mb-4">
      <i class="bi bi-rocket-takeoff-fill"></i>
    </div>

    <h2 class="auth-title">Empezá gratis hoy</h2>
    <p class="auth-sub">Creá tu cuenta y publicá tu primera rifa en minutos</p>

    <!-- Error alert -->
    @if (error()) {
      <div class="auth-alert auth-alert--danger" role="alert">
        <i class="bi bi-exclamation-triangle-fill"></i>
        {{ error() }}
      </div>
    }

    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>

      <!-- Full name -->
      <div class="mb-3">
        <label class="auth-label" for="fullName">
          <i class="bi bi-person me-1 opacity-50"></i>Nombre completo
        </label>
        <input id="fullName" type="text" class="form-control auth-input"
               formControlName="fullName" autocomplete="name"
               placeholder="Juan Pérez"
               [class.is-invalid]="touched('fullName') && form.get('fullName')?.invalid">
        @if (touched('fullName') && form.get('fullName')?.hasError('required')) {
          <div class="invalid-feedback">El nombre es obligatorio</div>
        }
      </div>

      <!-- Email -->
      <div class="mb-3">
        <label class="auth-label" for="email">
          <i class="bi bi-envelope me-1 opacity-50"></i>Email
        </label>
        <input id="email" type="email" class="form-control auth-input"
               formControlName="email" autocomplete="email"
               placeholder="juan@email.com"
               [class.is-invalid]="touched('email') && form.get('email')?.invalid">
        @if (touched('email') && form.get('email')?.hasError('email')) {
          <div class="invalid-feedback">Ingresá un email válido</div>
        }
        @if (touched('email') && form.get('email')?.hasError('required')) {
          <div class="invalid-feedback">El email es obligatorio</div>
        }
      </div>

      <!-- Phone -->
      <div class="mb-3">
        <label class="auth-label" for="phone">
          <i class="bi bi-whatsapp me-1 text-success opacity-75"></i>Teléfono / WhatsApp
          <span class="auth-label--opt ms-1">(opcional)</span>
        </label>
        <input id="phone" type="tel" class="form-control auth-input"
               formControlName="phone" autocomplete="tel"
               placeholder="+54 9 11 1234-5678">
      </div>

      <!-- Password -->
      <div class="mb-1">
        <label class="auth-label" for="password">
          <i class="bi bi-lock me-1 opacity-50"></i>Contraseña
        </label>
        <div class="input-group auth-input-group">
          <input id="password" [type]="showPass() ? 'text' : 'password'"
                 class="form-control auth-input"
                 formControlName="password" autocomplete="new-password"
                 placeholder="Mínimo 8 caracteres"
                 [class.is-invalid]="touched('password') && form.get('password')?.invalid"
                 (input)="updateStrength()">
          <button type="button" class="auth-pass-toggle"
                  (click)="showPass.set(!showPass())"
                  [attr.aria-label]="showPass() ? 'Ocultar' : 'Mostrar'">
            <i [class]="showPass() ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
          @if (touched('password') && form.get('password')?.hasError('minlength')) {
            <div class="invalid-feedback">Mínimo 8 caracteres</div>
          }
          @if (touched('password') && form.get('password')?.hasError('required')) {
            <div class="invalid-feedback">La contraseña es obligatoria</div>
          }
        </div>
      </div>

      <!-- Password strength indicator -->
      @if (form.get('password')?.value) {
        <div class="auth-strength mb-4">
          <div class="auth-strength__bars">
            @for (i of [0,1,2,3]; track i) {
              <div class="auth-strength__bar"
                   [class.auth-strength__bar--active]="i < strengthLevel()"
                   [style.background]="i < strengthLevel() ? strengthColor() : ''"></div>
            }
          </div>
          <span class="auth-strength__label" [style.color]="strengthColor()">
            {{ strengthLabel() }}
          </span>
        </div>
      } @else {
        <div class="mb-4"></div>
      }

      <!-- Submit -->
      <button type="submit"
              class="btn btn-gradient w-100 py-3 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2"
              style="font-size:1rem"
              [disabled]="loading()">
        @if (loading()) {
          <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          Creando cuenta...
        } @else {
          <i class="bi bi-person-check-fill"></i>Crear cuenta gratis
        }
      </button>
    </form>

    <!-- Divider -->
    <div class="auth-divider">
      <span>¿Ya tenés cuenta?</span>
    </div>

    <a routerLink="/auth/login" class="auth-link-btn">
      <i class="bi bi-box-arrow-in-right me-1"></i>
      Iniciar sesión
    </a>
  `,
  styles: [`
    :host { display: block; }

    .auth-icon-badge {
      width: 58px; height: 58px; border-radius: 1rem; margin: 0 auto;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; color: #fff;
      box-shadow: 0 8px 24px rgba(99,102,241,.38);
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
    .auth-label--opt { color: #a1a1aa; font-size: .75rem; font-weight: 400; }

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

    /* Password strength */
    .auth-strength {
      display: flex; align-items: center; gap: .6rem; margin-top: .5rem;
    }
    .auth-strength__bars {
      display: flex; gap: .25rem; flex: 1;
    }
    .auth-strength__bar {
      flex: 1; height: 4px; border-radius: 99px;
      background: #e4e4e7;
      transition: background .3s ease;
    }
    .auth-strength__label {
      font-size: .75rem; font-weight: 700; white-space: nowrap;
      transition: color .3s ease;
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
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly loading  = signal(false);
  protected readonly error    = signal('');
  protected readonly showPass = signal(false);
  private readonly _strength = signal(0);

  protected readonly form = this.fb.group({
    fullName: ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    phone:    [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected touched(field: string): boolean {
    return !!this.form.get(field)?.touched;
  }

  protected updateStrength(): void {
    const pw = this.form.get('password')?.value ?? '';
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    this._strength.set(score);
  }

  protected strengthLevel(): number {
    return this._strength();
  }

  protected strengthColor(): string {
    const s = this._strength();
    if (s <= 1) return '#f43f5e';
    if (s === 2) return '#fbbf24';
    if (s === 3) return '#10b981';
    return '#6366f1';
  }

  protected strengthLabel(): string {
    const s = this._strength();
    if (s <= 1) return 'Débil';
    if (s === 2) return 'Regular';
    if (s === 3) return 'Buena';
    return 'Excelente';
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.register(this.form.getRawValue() as {
      fullName: string; email: string; phone: string; password: string
    }).subscribe({
      next: () => this.router.navigate(['/auth/login'], { queryParams: { registered: '1' } }),
      error: (e: Error) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }
}
