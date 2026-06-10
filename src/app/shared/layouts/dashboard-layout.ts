import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="d-flex" style="min-height:100vh">
      <!-- Sidebar -->
      <aside class="sidebar d-flex flex-column p-3 gap-1" style="flex-shrink:0">
        <a routerLink="/" class="text-decoration-none mb-3 d-flex align-items-center gap-2">
          <i class="bi bi-ticket-perforated-fill text-warning fs-5"></i>
          <span class="fw-bold text-white">SuperRifa</span>
        </a>

        <span class="text-uppercase small text-white-50 px-2 mt-2" style="font-size:0.65rem;letter-spacing:.08em">Mis Rifas</span>
        <a class="nav-link" routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
          <i class="bi bi-speedometer2 me-2"></i>Resumen
        </a>
        <a class="nav-link" routerLink="/dashboard/rifas" routerLinkActive="active">
          <i class="bi bi-ticket me-2"></i>Mis Rifas
        </a>
        <a class="nav-link" routerLink="/dashboard/rifas/nueva" routerLinkActive="active">
          <i class="bi bi-plus-circle me-2"></i>Nueva Rifa
        </a>
        <a class="nav-link" routerLink="/dashboard/reservas" routerLinkActive="active">
          <i class="bi bi-people me-2"></i>Reservas
        </a>
        <a class="nav-link" routerLink="/dashboard/pagos" routerLinkActive="active">
          <i class="bi bi-cash-stack me-2"></i>Pagos
        </a>
        <a class="nav-link" routerLink="/dashboard/metodos-pago" routerLinkActive="active">
          <i class="bi bi-credit-card me-2"></i>Métodos de Pago
        </a>

        <div class="mt-auto pt-3 border-top border-white-10">
          <div class="px-2 mb-2">
            <div class="text-white small fw-semibold">{{ auth.user()?.fullName }}</div>
            <div class="text-white-50" style="font-size:0.75rem">{{ auth.user()?.email }}</div>
          </div>
          <button class="btn btn-sm w-100 text-start nav-link" (click)="logout()">
            <i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- Content -->
      <main class="flex-grow-1 overflow-auto bg-light p-4">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`.border-white-10 { border-color: rgba(255,255,255,0.1) !important; }`]
})
export class DashboardLayout {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
  }
}
