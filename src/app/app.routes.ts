import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { organizerGuard } from './core/guards/role.guard';

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

  // ── DASHBOARD (ORGANIZER) ────────────────────────────────────────────────
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

  { path: '**', redirectTo: '' },
];
