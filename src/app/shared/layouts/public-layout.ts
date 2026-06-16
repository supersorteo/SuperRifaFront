import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <nav class="navbar hero-gradient py-0 shadow-sm" style="min-height:60px">
      <div class="container-xl">
        <a class="navbar-brand fw-bold d-flex align-items-center gap-2 py-3" routerLink="/"
           style="font-size:1.15rem; text-decoration:none; color:#fff">
          <span class="d-flex align-items-center justify-content-center rounded-3 bg-white bg-opacity-20"
                style="width:34px;height:34px;font-size:1.1rem">
            <i class="bi bi-ticket-perforated-fill text-white"></i>
          </span>
          <span class="text-white">SuperRifa</span>
        </a>

        <button class="btn btn-link text-white d-lg-none p-2 ms-auto"
                (click)="navOpen.update(v => !v)"
                [attr.aria-expanded]="navOpen()"
                aria-label="Menu">
          <i [class]="navOpen() ? 'bi bi-x-lg fs-5' : 'bi bi-list fs-4'"></i>
        </button>

        <div class="d-none d-lg-flex align-items-center gap-2 ms-auto">
          @if (auth.isLoggedIn()) {
            <span class="text-white-50 small me-1">
              <i class="bi bi-person-circle me-1"></i>{{ auth.orgUser()?.fullName?.split(' ')?.at(0) ?? '' }}
            </span>
            <a class="btn btn-sm btn-outline-light px-3 fw-medium" routerLink="/dashboard">
              <i class="bi bi-speedometer2 me-1"></i>Dashboard
            </a>
          } @else {
            <a class="btn btn-sm btn-outline-light px-3" routerLink="/auth/login">Iniciar sesion</a>
            <a class="btn btn-sm fw-semibold px-3" routerLink="/auth/register"
               style="background:#f59e0b;color:#0f172a;border:none">
              <i class="bi bi-rocket-takeoff me-1"></i>Crear cuenta
            </a>
          }
        </div>
      </div>

      @if (navOpen()) {
        <div class="container-xl pb-3 d-lg-none animate-fade-up">
          <div class="border-top border-white border-opacity-25 pt-3 d-flex flex-column gap-2">
            @if (auth.isLoggedIn()) {
              <div class="text-white-50 small px-1">
                <i class="bi bi-person-circle me-1"></i>{{ auth.orgUser()?.fullName }}
              </div>
              <a class="btn btn-outline-light btn-sm w-100 text-start" routerLink="/dashboard"
                 (click)="navOpen.set(false)">
                <i class="bi bi-speedometer2 me-2"></i>Dashboard
              </a>
            } @else {
              <a class="btn btn-outline-light btn-sm w-100" routerLink="/auth/login"
                 (click)="navOpen.set(false)">Iniciar sesion</a>
              <a class="btn btn-sm fw-semibold w-100" routerLink="/auth/register"
                 (click)="navOpen.set(false)"
                 style="background:#f59e0b;color:#0f172a;border:none">
                <i class="bi bi-rocket-takeoff me-1"></i>Crear cuenta gratis
              </a>
            }
          </div>
        </div>
      }
    </nav>

    <main>
      <router-outlet />
    </main>

    <footer class="bg-dark text-white py-5 mt-auto">
      <div class="container-xl">
        <div class="row g-4 mb-4">
          <div class="col-md-4">
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="bi bi-ticket-perforated-fill text-warning fs-5"></i>
              <span class="fw-bold fs-5">SuperRifa</span>
            </div>
            <p class="text-white-50 small mb-0">Plataforma profesional de rifas online para Argentina. Segura, transparente y en tiempo real.</p>
          </div>
          <div class="col-md-4">
            <h6 class="text-white-50 text-uppercase small fw-semibold mb-3" style="letter-spacing:.08em">Plataforma</h6>
            <ul class="list-unstyled mb-0">
              <li class="mb-1"><a routerLink="/auth/register" class="text-white-50 text-decoration-none small hover-text-white">Crear cuenta</a></li>
              <li class="mb-1"><a routerLink="/auth/login" class="text-white-50 text-decoration-none small">Iniciar sesion</a></li>
            </ul>
          </div>
          <div class="col-md-4">
            <h6 class="text-white-50 text-uppercase small fw-semibold mb-3" style="letter-spacing:.08em">Contacto</h6>
            <p class="text-white-50 small mb-0">
              <i class="bi bi-shield-check me-1 text-success"></i>Pagos seguros via Mercado Pago<br>
              <i class="bi bi-lightning-charge me-1 text-warning"></i>Actualizaciones en tiempo real
            </p>
          </div>
        </div>
        <div class="section-divider mb-4" style="opacity:.15"></div>
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
          <p class="mb-0 text-white-50 small">© 2026 SuperRifa. Todos los derechos reservados.</p>
          <p class="mb-0 text-white-50 small">Hecho con <i class="bi bi-heart-fill text-danger small"></i> en Argentina</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex: 1; }
  `]
})
export class PublicLayout {
  protected readonly auth = inject(AuthService);
  protected readonly navOpen = signal(false);
}
