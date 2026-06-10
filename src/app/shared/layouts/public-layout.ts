import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark hero-gradient px-3 py-2 shadow-sm">
      <div class="container-fluid">
        <a class="navbar-brand fw-bold fs-4 d-flex align-items-center gap-2" routerLink="/">
          <i class="bi bi-ticket-perforated-fill"></i>
          <span class="text-white">SuperRifa</span>
        </a>
        <div class="d-flex gap-2 align-items-center">
          @if (auth.isLoggedIn()) {
            <a class="btn btn-outline-light btn-sm" routerLink="/dashboard">
              <i class="bi bi-speedometer2 me-1"></i>Dashboard
            </a>
          } @else {
            <a class="btn btn-outline-light btn-sm" routerLink="/auth/login">Iniciar sesión</a>
            <a class="btn btn-warning btn-sm fw-semibold" routerLink="/auth/register">
              Crear cuenta
            </a>
          }
        </div>
      </div>
    </nav>

    <main>
      <router-outlet />
    </main>

    <footer class="bg-dark text-white-50 py-4 mt-auto">
      <div class="container text-center">
        <p class="mb-1 small">
          <i class="bi bi-shield-check me-1"></i>SuperRifa — Plataforma segura de rifas online
        </p>
        <p class="mb-0" style="font-size:0.75rem">© 2026 SuperRifa. Todos los derechos reservados.</p>
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
}
