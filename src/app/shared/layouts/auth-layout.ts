import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="min-vh-100 d-flex flex-column hero-gradient">
      <div class="text-center pt-4 pb-2">
        <a routerLink="/" class="text-decoration-none">
          <span class="text-white fw-bold fs-3">
            <i class="bi bi-ticket-perforated-fill me-2"></i>SuperRifa
          </span>
        </a>
      </div>
      <div class="flex-grow-1 d-flex align-items-center justify-content-center p-3">
        <div class="card-glass p-4 p-md-5 w-100" style="max-width:440px">
          <router-outlet />
        </div>
      </div>
      <div class="text-center pb-3">
        <small class="text-white-50">© 2026 SuperRifa</small>
      </div>
    </div>
  `
})
export class AuthLayout {}
