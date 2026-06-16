import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  template: `
    <div class="app-toast-stack" aria-live="polite" aria-atomic="true">
      @for (item of notifications.notifications(); track item.id) {
        <div class="app-toast"
             [class.app-toast--success]="item.tone === 'success'"
             [class.app-toast--error]="item.tone === 'error'"
             [class.app-toast--info]="item.tone === 'info'"
             [class.app-toast--warning]="item.tone === 'warning'">
          <div class="app-toast__icon">
            <i class="bi"
               [class.bi-check2-circle]="item.tone === 'success'"
               [class.bi-x-circle]="item.tone === 'error'"
               [class.bi-info-circle]="item.tone === 'info'"
               [class.bi-exclamation-triangle]="item.tone === 'warning'"></i>
          </div>
          <div class="app-toast__body">
            <div class="app-toast__title">{{ item.title }}</div>
            @if (item.message) {
              <div class="app-toast__message">{{ item.message }}</div>
            }
          </div>
          <button type="button" class="app-toast__close" (click)="notifications.dismiss(item.id)" aria-label="Cerrar">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .app-toast-stack {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 3000;
      display: flex;
      flex-direction: column;
      gap: .75rem;
      width: min(360px, calc(100vw - 1.5rem));
      pointer-events: none;
    }

    .app-toast {
      pointer-events: auto;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: .85rem;
      align-items: start;
      padding: .95rem 1rem;
      border-radius: 1rem;
      color: #e2e8f0;
      background: rgba(15,23,42,.96);
      border: 1px solid rgba(255,255,255,.08);
      box-shadow: 0 18px 40px rgba(15,23,42,.24);
      backdrop-filter: blur(10px);
      animation: app-toast-in .2s ease;
    }

    .app-toast--success { box-shadow: 0 18px 40px rgba(16,185,129,.18); }
    .app-toast--error { box-shadow: 0 18px 40px rgba(239,68,68,.18); }
    .app-toast--info { box-shadow: 0 18px 40px rgba(79,70,229,.18); }
    .app-toast--warning { box-shadow: 0 18px 40px rgba(245,158,11,.18); }

    .app-toast__icon {
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      background: rgba(255,255,255,.08);
    }

    .app-toast--success .app-toast__icon { color: #10b981; }
    .app-toast--error .app-toast__icon { color: #ef4444; }
    .app-toast--info .app-toast__icon { color: #818cf8; }
    .app-toast--warning .app-toast__icon { color: #f59e0b; }

    .app-toast__body { min-width: 0; }
    .app-toast__title {
      font-size: .9rem;
      font-weight: 700;
      line-height: 1.2;
      color: #f8fafc;
    }
    .app-toast__message {
      margin-top: .2rem;
      font-size: .8rem;
      line-height: 1.45;
      color: #94a3b8;
    }

    .app-toast__close {
      border: 0;
      background: transparent;
      color: #64748b;
      padding: .1rem;
      cursor: pointer;
    }

    .app-toast__close:hover {
      color: #cbd5e1;
    }

    @keyframes app-toast-in {
      from { opacity: 0; transform: translateY(-8px) scale(.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @media (max-width: 576px) {
      .app-toast-stack {
        left: .75rem;
        right: .75rem;
        top: .75rem;
        width: auto;
      }
    }
  `]
})
export class AppNotifications {
  protected readonly notifications = inject(NotificationService);
}
