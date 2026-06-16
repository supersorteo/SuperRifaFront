import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialog],
  template: `
    <app-confirm-dialog
      [open]="logoutDialogOpen()"
      title="Cerrar sesion"
      body="Se cerrara tu sesion del panel de administracion en este dispositivo."
      icon="bi bi-box-arrow-right"
      tone="info"
      confirmLabel="Cerrar sesion"
      (cancelled)="closeLogoutDialog()"
      (confirmed)="confirmLogout()" />

    <div class="admin-shell">

      <aside class="admin-sidebar d-none d-lg-flex flex-column">
        <div class="admin-sidebar__brand">
          <div class="admin-sidebar__brand-icon">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <div>
            <div class="admin-sidebar__brand-title">RifasPro</div>
            <div class="admin-sidebar__brand-sub">Admin</div>
          </div>
        </div>

        <nav class="admin-sidebar__nav flex-grow-1">
          <a routerLink="/admin" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }"
             class="admin-nav-item">
            <i class="bi bi-grid-fill"></i><span>Inicio</span>
          </a>
          <a routerLink="/admin/organizadores" routerLinkActive="is-active"
             class="admin-nav-item">
            <i class="bi bi-people-fill"></i><span>Organizadores</span>
          </a>

          <div class="admin-nav-divider"></div>
          <button class="admin-nav-item admin-nav-item--back" (click)="goBack()">
            <i class="bi bi-arrow-left-circle"></i><span>Salir del panel</span>
          </button>
        </nav>

        <div class="admin-sidebar__footer">
          <div class="admin-sidebar__user">
            <div class="admin-sidebar__avatar">{{ initial() }}</div>
            <div>
              <div class="admin-sidebar__user-name">{{ firstName() }}</div>
              <div class="admin-sidebar__user-role">Administrador</div>
            </div>
          </div>
          <button class="admin-sidebar__logout" (click)="requestLogout()" aria-label="Cerrar sesion">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </aside>

      <header class="admin-topbar d-flex d-lg-none align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-dark border-0 px-2" (click)="mobileOpen.set(!mobileOpen())" aria-label="Menu">
            <i [class]="mobileOpen() ? 'bi bi-x-lg' : 'bi bi-list fs-5'"></i>
          </button>
          <span class="fw-bold text-white small">Admin</span>
        </div>
        <div class="d-flex align-items-center gap-1">
          <button class="btn btn-sm btn-dark border-0 px-2" (click)="goBack()" aria-label="Salir del panel" title="Salir del panel">
            <i class="bi bi-arrow-left-circle text-info"></i>
          </button>
          <button class="btn btn-sm btn-dark border-0 px-2" (click)="requestLogout()" aria-label="Cerrar sesion">
            <i class="bi bi-box-arrow-right text-danger"></i>
          </button>
        </div>
      </header>

      @if (mobileOpen()) {
        <div class="admin-mobile-overlay" (click)="mobileOpen.set(false)"></div>
        <aside class="admin-sidebar admin-sidebar--mobile d-flex flex-column">
          <nav class="admin-sidebar__nav flex-grow-1 pt-3">
            <a routerLink="/admin" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }"
               class="admin-nav-item" (click)="mobileOpen.set(false)">
              <i class="bi bi-grid-fill"></i><span>Inicio</span>
            </a>
            <a routerLink="/admin/organizadores" routerLinkActive="is-active"
               class="admin-nav-item" (click)="mobileOpen.set(false)">
              <i class="bi bi-people-fill"></i><span>Organizadores</span>
            </a>
            <div class="admin-nav-divider"></div>
            <button class="admin-nav-item admin-nav-item--back" (click)="goBack(); mobileOpen.set(false)">
              <i class="bi bi-arrow-left-circle"></i><span>Salir del panel</span>
            </button>
          </nav>
        </aside>
      }

      <main class="admin-main">
        <router-outlet />
      </main>

    </div>
  `,
  styles: [`
    .admin-shell {
      min-height: 100vh; display: flex;
      background: #0f172a; color: #f1f5f9;
    }
    .admin-sidebar {
      width: 240px; min-height: 100vh;
      background: linear-gradient(180deg,#1e1b4b 0%,#0f172a 100%);
      border-right: 1px solid rgba(255,255,255,.07);
      padding: 1.5rem 0; position: sticky; top: 0; height: 100vh;
      flex-shrink: 0;
    }
    .admin-sidebar--mobile {
      position: fixed; inset: 0 auto 0 0; z-index: 1050;
      width: 240px;
    }
    .admin-mobile-overlay {
      position: fixed; inset: 0; z-index: 1040;
      background: rgba(0,0,0,.6);
    }
    .admin-topbar {
      position: sticky; top: 0; z-index: 100;
      background: #1e1b4b;
      padding: .75rem 1rem;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }
    .admin-sidebar__brand {
      display: flex; align-items: center; gap: .75rem;
      padding: 0 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,.07);
      margin-bottom: 1rem;
    }
    .admin-sidebar__brand-icon {
      width: 40px; height: 40px;
      background: rgba(99,102,241,.25);
      border-radius: .6rem;
      display: flex; align-items: center; justify-content: center;
      color: #a5b4fc; font-size: 1.15rem;
    }
    .admin-sidebar__brand-title { font-weight: 800; font-size: .95rem; color: #f1f5f9; line-height: 1.1; }
    .admin-sidebar__brand-sub { font-size: .7rem; color: #6366f1; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
    .admin-sidebar__nav { padding: 0 .75rem; display: flex; flex-direction: column; gap: .2rem; }
    .admin-nav-item {
      display: flex; align-items: center; gap: .75rem;
      padding: .65rem .85rem;
      border-radius: .6rem;
      color: #94a3b8; text-decoration: none;
      font-size: .88rem; font-weight: 500;
      transition: background .15s, color .15s;
    }
    .admin-nav-item:hover { background: rgba(255,255,255,.06); color: #e2e8f0; }
    .admin-nav-item.is-active { background: rgba(99,102,241,.2); color: #a5b4fc; font-weight: 600; }
    .admin-nav-item i { font-size: 1rem; width: 18px; text-align: center; }
    .admin-sidebar__footer {
      padding: 1rem 1.25rem 0;
      border-top: 1px solid rgba(255,255,255,.07);
      margin-top: auto;
      display: flex; align-items: center; justify-content: space-between;
    }
    .admin-sidebar__user { display: flex; align-items: center; gap: .6rem; }
    .admin-sidebar__avatar {
      width: 32px; height: 32px;
      background: linear-gradient(135deg,#4f46e5,#7c3aed);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: .8rem; color: #fff;
    }
    .admin-sidebar__user-name { font-size: .83rem; font-weight: 600; color: #e2e8f0; }
    .admin-sidebar__user-role { font-size: .7rem; color: #64748b; }
    .admin-nav-divider { height: 1px; background: rgba(255,255,255,.07); margin: .5rem .85rem; }
    .admin-nav-item--back {
      width: 100%; background: transparent; border: none; cursor: pointer; text-align: left;
      color: #64748b;
    }
    .admin-nav-item--back:hover { background: rgba(255,255,255,.06); color: #94a3b8; }
    .admin-sidebar__logout {
      background: transparent; border: none;
      color: #64748b; padding: .35rem; border-radius: .4rem;
      cursor: pointer; transition: color .15s;
    }
    .admin-sidebar__logout:hover { color: #f87171; }
    .admin-main {
      flex: 1; padding: 2rem;
      min-width: 0;
      background: #0f172a;
    }
    @media (max-width: 991px) {
      .admin-shell { flex-direction: column; }
      .admin-main { padding: 1.25rem 1rem; }
    }
  `]
})
export class AdminLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly mobileOpen = signal(false);
  protected readonly logoutDialogOpen = signal(false);

  protected readonly firstName = computed(() => {
    const parts = this.auth.adminUser()?.fullName?.split(' ') ?? [];
    return parts[0] ?? 'Admin';
  });

  protected readonly initial = computed(() =>
    this.firstName().charAt(0).toUpperCase()
  );

  protected requestLogout(): void {
    this.mobileOpen.set(false);
    this.logoutDialogOpen.set(true);
  }

  protected closeLogoutDialog(): void {
    this.logoutDialogOpen.set(false);
  }

  protected confirmLogout(): void {
    this.logoutDialogOpen.set(false);
    this.auth.adminLogout();
  }

  protected goBack(): void {
    this.mobileOpen.set(false);
    this.router.navigate([this.auth.hasOrgSession() && this.auth.isOrganizer() ? '/dashboard' : '/']);
  }
}
