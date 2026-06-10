import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="d-flex" style="min-height:100vh">

      <!-- ── Desktop sidebar ── -->
      <aside class="sidebar d-none d-lg-flex flex-column">
        <a class="sidebar-brand" routerLink="/">
          <span class="d-flex align-items-center justify-content-center rounded-3 bg-white bg-opacity-20"
                style="width:32px;height:32px;font-size:1rem;flex-shrink:0">
            <i class="bi bi-ticket-perforated-fill text-white"></i>
          </span>
          SuperRifa
        </a>

        <div class="px-3">
          <div class="nav-section">
            <span class="nav-section-label">Resumen</span>
          </div>
          <a class="nav-link" routerLink="/dashboard" routerLinkActive="active"
             [routerLinkActiveOptions]="{exact:true}">
            <i class="bi bi-speedometer2"></i>Inicio
          </a>

          <div class="nav-section mt-2">
            <span class="nav-section-label">Mis Rifas</span>
          </div>
          <a class="nav-link" routerLink="/dashboard/rifas" routerLinkActive="active">
            <i class="bi bi-ticket"></i>Todas las rifas
          </a>
          <a class="nav-link" routerLink="/dashboard/reservas" routerLinkActive="active">
            <i class="bi bi-people"></i>Reservas
          </a>
          <a class="nav-link" routerLink="/dashboard/pagos" routerLinkActive="active">
            <i class="bi bi-cash-stack"></i>Pagos
          </a>
          <a class="nav-link" routerLink="/dashboard/metodos-pago" routerLinkActive="active">
            <i class="bi bi-credit-card"></i>Métodos de pago
          </a>
        </div>

        <div class="sidebar-footer px-3">
          <div class="d-flex align-items-center gap-2 mb-3">
            <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white bg-white-10"
                 style="width:36px;height:36px;font-size:0.85rem;flex-shrink:0">
              {{ initial() }}
            </div>
            <div style="min-width:0">
              <div class="text-white fw-semibold small text-truncate">{{ auth.user()?.fullName }}</div>
              <div class="text-white-50 small text-truncate" style="font-size:0.72rem">{{ auth.user()?.email }}</div>
            </div>
          </div>
          <button class="nav-link w-100 border-0 text-start" (click)="logout()" style="background:none">
            <i class="bi bi-box-arrow-right"></i>Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- ── Mobile overlay sidebar ── -->
      @if (sidebarOpen()) {
        <div class="sidebar-overlay" (click)="sidebarOpen.set(false)" aria-hidden="true"></div>
      }
      <aside class="sidebar sidebar-mobile d-lg-none" [class.open]="sidebarOpen()">
        <div class="d-flex align-items-center justify-content-between px-3 py-3">
          <a class="sidebar-brand py-0" routerLink="/" (click)="sidebarOpen.set(false)">
            <i class="bi bi-ticket-perforated-fill text-warning fs-5"></i>
            SuperRifa
          </a>
          <button class="btn btn-link text-white p-1" (click)="sidebarOpen.set(false)" aria-label="Cerrar menú">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="px-3 flex-grow-1">
          <a class="nav-link" routerLink="/dashboard" routerLinkActive="active"
             [routerLinkActiveOptions]="{exact:true}" (click)="sidebarOpen.set(false)">
            <i class="bi bi-speedometer2"></i>Inicio
          </a>
          <a class="nav-link" routerLink="/dashboard/rifas" routerLinkActive="active"
             (click)="sidebarOpen.set(false)">
            <i class="bi bi-ticket"></i>Todas las rifas
          </a>
          <a class="nav-link" routerLink="/dashboard/reservas" routerLinkActive="active"
             (click)="sidebarOpen.set(false)">
            <i class="bi bi-people"></i>Reservas
          </a>
          <a class="nav-link" routerLink="/dashboard/pagos" routerLinkActive="active"
             (click)="sidebarOpen.set(false)">
            <i class="bi bi-cash-stack"></i>Pagos
          </a>
          <a class="nav-link" routerLink="/dashboard/metodos-pago" routerLinkActive="active"
             (click)="sidebarOpen.set(false)">
            <i class="bi bi-credit-card"></i>Métodos de pago
          </a>
        </div>
        <div class="sidebar-footer px-3">
          <div class="text-white small fw-semibold">{{ auth.user()?.fullName }}</div>
          <div class="text-white-50 small mb-2" style="font-size:0.72rem">{{ auth.user()?.email }}</div>
          <button class="nav-link w-100 border-0 text-start" (click)="logout()" style="background:none">
            <i class="bi bi-box-arrow-right"></i>Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- ── Main content area ── -->
      <div class="d-flex flex-column flex-grow-1" style="min-width:0;min-height:100vh">

        <!-- Mobile top bar -->
        <header class="d-lg-none d-flex align-items-center gap-3 px-3 py-2 shadow-sm"
                style="background:linear-gradient(135deg,#1e1b4b,#4f46e5);min-height:52px;flex-shrink:0">
          <button class="btn btn-link text-white p-1" (click)="sidebarOpen.update(v => !v)"
                  aria-label="Abrir menú">
            <i class="bi bi-list fs-4"></i>
          </button>
          <a routerLink="/" class="d-flex align-items-center gap-2 text-decoration-none">
            <i class="bi bi-ticket-perforated-fill text-warning"></i>
            <span class="text-white fw-bold">SuperRifa</span>
          </a>
          <div class="ms-auto text-white-50 small">
            {{ firstName() }}
          </div>
        </header>

        <main class="flex-grow-1 bg-gradient-mesh p-3 p-lg-4" style="min-width:0">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class DashboardLayout {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly sidebarOpen = signal(false);
  protected readonly initial = computed(() =>
    (this.auth.user()?.fullName ?? '?').charAt(0).toUpperCase()
  );
  protected readonly firstName = computed(() => {
    const parts = this.auth.user()?.fullName?.split(' ') ?? [];
    return parts.length > 0 ? parts[0] : '';
  });

  logout(): void {
    this.auth.logout();
  }
}
