import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError(err => {
      const isProtectedOrganizerApi = req.url.includes('/api/organizer/');
      const isProtectedAdminApi = req.url.includes('/api/admin/');

      if (err.status === 401 || ((isProtectedOrganizerApi || isProtectedAdminApi) && err.status === 403)) {
        if (isProtectedAdminApi) {
          auth.adminLogout();
        } else {
          auth.logoutSilent();
        }
        router.navigate(['/auth/login']);
      }
      const message = err.error?.message ?? err.statusText ?? 'Error desconocido';
      return throwError(() => new Error(message));
    })
  );
};
