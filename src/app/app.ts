import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminLoginModal } from './features/admin/admin-login-modal/admin-login-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AdminLoginModal],
  templateUrl: './app.html',
  host: {
    '(document:keydown)': 'onKeyDown($event)',
  },
})
export class App {
  protected readonly showAdminLogin = signal(false);

  protected onKeyDown(e: KeyboardEvent): void {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      this.showAdminLogin.set(true);
    }
  }
}
