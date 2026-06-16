import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { AdminLoginModal } from './features/admin/admin-login-modal/admin-login-modal';
import { AppNotifications } from './shared/components/app-notifications/app-notifications';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AdminLoginModal, AppNotifications],
  templateUrl: './app.html',
  host: {
    '(document:keydown)': 'onKeyDown($event)',
  },
})
export class App {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showAdminLogin = signal(false);

  protected onKeyDown(e: KeyboardEvent): void {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      if (this.auth.isAdmin()) {
        this.router.navigate(['/admin']);
      } else {
        this.showAdminLogin.set(true);
      }
    }
  }
}
