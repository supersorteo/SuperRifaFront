import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private readonly platformId = inject(PLATFORM_ID);
  private client: unknown = null;
  private subscriptions = new Map<string, unknown>();

  connect(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    if (this.client) return Promise.resolve();

    return import('@stomp/stompjs').then(({ Client }) => {
      // sockjs-client still expects a Node-style global in some bundling paths
      (globalThis as typeof globalThis & { global?: typeof globalThis }).global ??= globalThis;

      return import('sockjs-client').then(({ default: SockJS }) => {
        this.client = new Client({
          webSocketFactory: () => new SockJS(environment.wsUrl),
          reconnectDelay: 5000,
        });
        (this.client as { activate: () => void }).activate();
      });
    });
  }

  subscribe<T>(topic: string): Observable<T> {
    const subject = new Subject<T>();
    if (!isPlatformBrowser(this.platformId)) return subject.asObservable();

    const waitForClient = () => {
      const c = this.client as { connected?: boolean; subscribe: (t: string, cb: (m: unknown) => void) => unknown } | null;
      if (c?.connected) {
        const sub = c.subscribe(topic, (message: unknown) => {
          const msg = message as { body: string };
          try { subject.next(JSON.parse(msg.body) as T); } catch { /* ignore */ }
        });
        this.subscriptions.set(topic, sub);
      } else {
        setTimeout(waitForClient, 200);
      }
    };
    waitForClient();
    return subject.asObservable();
  }

  unsubscribe(topic: string): void {
    const sub = this.subscriptions.get(topic);
    if (sub) {
      (sub as { unsubscribe: () => void }).unsubscribe();
      this.subscriptions.delete(topic);
    }
  }

  disconnect(): void {
    const c = this.client as { deactivate: () => void } | null;
    c?.deactivate();
    this.client = null;
  }
}
