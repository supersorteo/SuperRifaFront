import { Injectable, signal } from '@angular/core';

export type NotificationTone = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: number;
  tone: NotificationTone;
  title: string;
  message?: string;
  durationMs: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  readonly notifications = signal<AppNotification[]>([]);

  success(title: string, message?: string, durationMs = 2800): void {
    this.push({ tone: 'success', title, message, durationMs });
  }

  error(title: string, message?: string, durationMs = 4200): void {
    this.push({ tone: 'error', title, message, durationMs });
  }

  info(title: string, message?: string, durationMs = 3200): void {
    this.push({ tone: 'info', title, message, durationMs });
  }

  warning(title: string, message?: string, durationMs = 3600): void {
    this.push({ tone: 'warning', title, message, durationMs });
  }

  dismiss(id: number): void {
    this.notifications.update(list => list.filter(item => item.id !== id));
  }

  private push(input: Omit<AppNotification, 'id'>): void {
    const notification: AppNotification = { id: this.nextId++, ...input };
    this.notifications.update(list => [...list, notification]);
    setTimeout(() => this.dismiss(notification.id), notification.durationMs);
  }
}
