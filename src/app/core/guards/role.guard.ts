import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const organizerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isOrganizer() || auth.isAdmin()) return true;
  // Logged in but wrong role → home; not logged in → already redirected by authGuard
  return inject(Router).createUrlTree(['/']);
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAdmin()) return true;
  return inject(Router).createUrlTree(['/']);
};
