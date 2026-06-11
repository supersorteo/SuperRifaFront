import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard, organizerGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // ── PUBLIC ──────────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./shared/layouts/public-layout').then(m => m.PublicLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/public/home/home').then(m => m.Home),
      },
      {
        path: 'rifa/:slug',
        loadComponent: () => import('./features/public/raffle-detail/raffle-detail').then(m => m.RaffleDetail),
      },
    ],
  },

  // ── AUTH ─────────────────────────────────────────────────────────────────
  {
    path: 'auth',
    loadComponent: () => import('./shared/layouts/auth-layout').then(m => m.AuthLayout),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then(m => m.Register),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // ── DASHBOARD (ORGANIZER + ADMIN) ────────────────────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard, organizerGuard],
    loadComponent: () => import('./shared/layouts/dashboard-layout').then(m => m.DashboardLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/organizer/dashboard-home/dashboard-home').then(m => m.DashboardHome),
      },
      {
        path: 'rifas',
        loadComponent: () => import('./features/organizer/raffle-list/raffle-list').then(m => m.RaffleList),
      },
      {
        path: 'reservas',
        loadComponent: () => import('./features/organizer/dashboard-home/dashboard-home').then(m => m.DashboardHome),
      },
      {
        path: 'pagos',
        loadComponent: () => import('./features/organizer/dashboard-home/dashboard-home').then(m => m.DashboardHome),
      },
      {
        path: 'metodos-pago',
        loadComponent: () => import('./features/organizer/dashboard-home/dashboard-home').then(m => m.DashboardHome),
      },
    ],
  },

  // ── ADMIN ────────────────────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout').then(m => m.AdminLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/admin-home/admin-home').then(m => m.AdminHome),
      },
      {
        path: 'organizadores',
        loadComponent: () => import('./features/admin/admin-organizers/admin-organizers').then(m => m.AdminOrganizers),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
