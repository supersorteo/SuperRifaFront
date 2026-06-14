import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const organizerGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.hasOrgSession() && auth.isOrganizer()) return true;
  // Admins have their own panel
  if (auth.hasAdminSession() && auth.isAdmin()) return router.createUrlTree(['/admin']);
  return router.createUrlTree(['/']);
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.hasAdminSession() && auth.isAdmin()) return true;
  return inject(Router).createUrlTree(['/']);
};
