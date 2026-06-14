import { Component, inject, input, OnChanges, OnInit, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login-modal',
  imports: [ReactiveFormsModule],
  template: `
    @if (open()) {
      <div class="admin-overlay" (click)="onOverlayClick($event)" role="dialog" aria-modal="true" aria-label="Panel de administración">
        <div class="admin-modal" (click)="$event.stopPropagation()">

          <div class="admin-modal__header">
            <div class="admin-modal__logo">
              <i class="bi bi-shield-lock-fill"></i>
            </div>
            <h2 class="admin-modal__title">Panel de Administración</h2>
            <p class="admin-modal__subtitle">Acceso restringido</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="admin-modal__body" novalidate>

            @if (error()) {
              <div class="admin-alert" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ error() }}
              </div>
            }

            <div class="admin-field">
              <label for="adm-user" class="admin-label">Usuario</label>
              <input id="adm-user"
                     type="text"
                     formControlName="username"
                     class="admin-input"
                     placeholder="admin"
                     autocomplete="username" />
            </div>

            <div class="admin-field">
              <label for="adm-pass" class="admin-label">Contraseña</label>
              <div class="admin-pass-wrap">
                <input id="adm-pass"
                       [type]="showPass() ? 'text' : 'password'"
                       formControlName="password"
                       class="admin-input admin-input--pass"
                       placeholder="••••••••"
                       autocomplete="current-password" />
                <button type="button" class="admin-eye"
                        (click)="showPass.set(!showPass())"
                        [attr.aria-label]="showPass() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  <i [class]="showPass() ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
            </div>

            <button type="submit"
                    class="admin-btn"
                    [disabled]="form.invalid || loading()">
              @if (loading()) {
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Verificando...
              } @else {
                <i class="bi bi-arrow-right-circle-fill me-2"></i>Ingresar
              }
            </button>

            <button type="button" class="admin-btn-cancel" (click)="closed.emit()">
              Cancelar
            </button>

          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .admin-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,.85);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      padding: 1rem;
    }
    .admin-modal {
      background: #0f172a;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 1.25rem;
      width: 100%; max-width: 400px;
      box-shadow: 0 25px 60px rgba(0,0,0,.6);
      overflow: hidden;
    }
    .admin-modal__header {
      padding: 2.5rem 2rem 1.5rem;
      text-align: center;
      background: linear-gradient(135deg,#1e1b4b,#312e81);
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .admin-modal__logo {
      width: 56px; height: 56px;
      background: rgba(99,102,241,.25);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1rem;
      font-size: 1.6rem; color: #a5b4fc;
    }
    .admin-modal__title {
      font-size: 1.2rem; font-weight: 700; color: #f1f5f9; margin: 0 0 .25rem;
    }
    .admin-modal__subtitle {
      font-size: .8rem; color: #94a3b8; margin: 0;
      text-transform: uppercase; letter-spacing: .08em;
    }
    .admin-modal__body {
      padding: 1.75rem 2rem 2rem;
      display: flex; flex-direction: column; gap: .85rem;
    }
    .admin-alert {
      background: rgba(220,38,38,.15);
      border: 1px solid rgba(220,38,38,.3);
      color: #fca5a5;
      border-radius: .5rem;
      padding: .65rem .85rem;
      font-size: .85rem;
    }
    .admin-field { display: flex; flex-direction: column; gap: .35rem; }
    .admin-pass-wrap { position: relative; }
    .admin-input--pass { padding-right: 2.8rem; width: 100%; }
    .admin-eye {
      position: absolute; right: .1rem; top: 50%; transform: translateY(-50%);
      background: transparent; border: none; color: #64748b;
      width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; border-radius: .4rem; transition: color .15s;
    }
    .admin-eye:hover { color: #a5b4fc; }
    .admin-label { font-size: .78rem; font-weight: 600; color: #94a3b8; letter-spacing: .05em; text-transform: uppercase; }
    .admin-input {
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: .6rem;
      color: #f1f5f9;
      padding: .7rem 1rem;
      font-size: .92rem;
      transition: border-color .2s;
      outline: none;
    }
    .admin-input:focus { border-color: #6366f1; background: rgba(255,255,255,.08); }
    .admin-input::placeholder { color: #475569; }
    .admin-btn {
      background: linear-gradient(135deg,#4f46e5,#7c3aed);
      color: #fff; border: none;
      border-radius: .65rem;
      padding: .8rem 1rem;
      font-size: .95rem; font-weight: 600;
      cursor: pointer; transition: opacity .2s;
      margin-top: .25rem;
    }
    .admin-btn:disabled { opacity: .6; cursor: not-allowed; }
    .admin-btn:not(:disabled):hover { opacity: .9; }
    .admin-btn-cancel {
      background: transparent;
      border: 1px solid rgba(255,255,255,.1);
      color: #64748b; border-radius: .65rem;
      padding: .6rem 1rem;
      font-size: .85rem; cursor: pointer; transition: color .2s, border-color .2s;
    }
    .admin-btn-cancel:hover { color: #94a3b8; border-color: rgba(255,255,255,.2); }
  `]
})
export class AdminLoginModal implements OnChanges {
  readonly open   = input.required<boolean>();
  readonly closed = output<void>();

  private readonly auth    = inject(AuthService);
  private readonly router  = inject(Router);
  private readonly fb      = inject(FormBuilder);

  protected readonly loading  = signal(false);
  protected readonly error    = signal<string | null>(null);
  protected readonly showPass = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  ngOnChanges(): void {
    if (!this.open()) {
      this.form.reset();
      this.error.set(null);
      this.loading.set(false);
      this.showPass.set(false);
    }
  }

  protected onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('admin-overlay')) {
      this.closed.emit();
    }
  }

  protected submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { username, password } = this.form.getRawValue();

    this.auth.adminLogin(username.trim(), password).subscribe({
      next: () => {
        this.loading.set(false);
        this.closed.emit();
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Usuario o contraseña incorrectos.');
      },
    });
  }
}
