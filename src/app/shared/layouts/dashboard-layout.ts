import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialog } from '../components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialog],
  template: `
    <app-confirm-dialog
      [open]="logoutDialogOpen()"
      title="Cerrar sesion"
      body="Se cerrara tu sesion del panel del organizador en este dispositivo."
      icon="bi bi-box-arrow-right"
      tone="info"
      confirmLabel="Cerrar sesion"
      (cancelled)="closeLogoutDialog()"
      (confirmed)="confirmLogout()" />

    <div class="d-flex" style="min-height:100vh">
      @if (sidebarOpen()) {
        <div class="sidebar-overlay" (click)="sidebarOpen.set(false)" aria-hidden="true"></div>
      }

      <aside class="sidebar sidebar-mobile" [class.open]="sidebarOpen()">
        <div class="d-flex align-items-center justify-content-between px-3 py-3">
          <a class="sidebar-brand py-0" routerLink="/" (click)="sidebarOpen.set(false)">
            <i class="bi bi-ticket-perforated-fill text-warning fs-5"></i>
            SuperSorteo
          </a>
          <button class="btn btn-link text-white p-1" (click)="sidebarOpen.set(false)" aria-label="Cerrar menú">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="px-3 flex-grow-1">
          <div class="nav-section">
            <span class="nav-section-label">Resumen</span>
          </div>
          <a class="nav-link" routerLink="/dashboard" routerLinkActive="active"
             [routerLinkActiveOptions]="{ exact: true }" (click)="sidebarOpen.set(false)">
            <i class="bi bi-speedometer2"></i>Inicio
          </a>

          <div class="nav-section mt-2">
            <span class="nav-section-label">Mis Rifas</span>
          </div>
          <a class="nav-link" routerLink="/dashboard/rifas" routerLinkActive="active"
             (click)="sidebarOpen.set(false)">
            <i class="bi bi-ticket"></i>Todas las rifas
          </a>
          <a class="nav-link" routerLink="/dashboard/reservas" routerLinkActive="active"
             (click)="sidebarOpen.set(false)">
            <i class="bi bi-people"></i>Reservas
          </a>
          <a class="nav-link" routerLink="/dashboard/metodos-pago" routerLinkActive="active"
             (click)="sidebarOpen.set(false)">
            <i class="bi bi-credit-card"></i>Métodos de pago
          </a>

          <div class="nav-section mt-2">
            <span class="nav-section-label">Cuenta</span>
          </div>
          <a class="nav-link" routerLink="/dashboard/perfil" routerLinkActive="active"
             (click)="sidebarOpen.set(false)">
            <i class="bi bi-person-circle"></i>Mi perfil
          </a>
        </div>

        <div class="sidebar-footer px-3">
          <div class="d-flex align-items-center gap-2 mb-3">
            <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white bg-white-10"
                 style="width:36px;height:36px;font-size:0.85rem;flex-shrink:0">
              {{ initial() }}
            </div>
            <div style="min-width:0">
              <div class="text-white fw-semibold small text-truncate">{{ auth.orgUser()?.fullName }}</div>
              <div class="text-white-50 small text-truncate" style="font-size:0.72rem">{{ auth.orgUser()?.email }}</div>
            </div>
          </div>
          <button class="nav-link w-100 border-0 text-start" (click)="requestLogout()" style="background:none">
            <i class="bi bi-box-arrow-right"></i>Cerrar sesión
          </button>
        </div>
      </aside>

      <div class="d-flex flex-column flex-grow-1" style="min-width:0;min-height:100vh">
        <header class="d-flex align-items-center gap-3 px-3 px-lg-4 py-2 shadow-sm"
                style="background:linear-gradient(135deg,#1e1b4b,#4f46e5);min-height:56px;flex-shrink:0">
          <button class="btn btn-link text-white p-1" (click)="sidebarOpen.update(v => !v)"
                  aria-label="Abrir menú">
            <i class="bi bi-list fs-4"></i>
          </button>
          <a routerLink="/" class="d-flex align-items-center gap-2 text-decoration-none">
            <i class="bi bi-ticket-perforated-fill text-warning"></i>
            <span class="text-white fw-bold">SuperSorteo</span>
          </a>
          <div class="ms-auto text-white-50 small d-none d-sm-block">
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

  protected readonly sidebarOpen = signal(false);
  protected readonly logoutDialogOpen = signal(false);
  protected readonly initial = computed(() =>
    (this.auth.orgUser()?.fullName ?? '?').charAt(0).toUpperCase()
  );
  protected readonly firstName = computed(() => {
    const parts = this.auth.orgUser()?.fullName?.split(' ') ?? [];
    return parts.length > 0 ? parts[0] : '';
  });

  protected requestLogout(): void {
    this.sidebarOpen.set(false);
    this.logoutDialogOpen.set(true);
  }

  protected closeLogoutDialog(): void {
    this.logoutDialogOpen.set(false);
  }

  protected confirmLogout(): void {
    this.logoutDialogOpen.set(false);
    this.auth.logout();
  }
}
