import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private readonly platformId = inject(PLATFORM_ID);
  private client: unknown = null;
  private subscriptions = new Map<string, unknown>();
  private connectionPromise: Promise<void> | null = null;

  connect(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const existingClient = this.client as { connected?: boolean } | null;
    if (existingClient?.connected) return Promise.resolve();
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = import('@stomp/stompjs').then(({ Client }) => {
      // sockjs-client still expects a Node-style global in some bundling paths
      (globalThis as typeof globalThis & { global?: typeof globalThis }).global ??= globalThis;

      return import('sockjs-client').then((sockJsMod) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SockJS = (sockJsMod as any).default ?? sockJsMod;
        return new Promise<void>((resolve, reject) => {
          const client = new Client({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            webSocketFactory: () => new (SockJS as any)(environment.wsUrl),
            reconnectDelay: 5000,
            onConnect: () => resolve(),
            onStompError: () => reject(new Error('No se pudo establecer el canal en tiempo real')),
            onWebSocketError: () => reject(new Error('No se pudo abrir la conexión en tiempo real')),
          });
          this.client = client;
          client.activate();
        });
      });
    }).finally(() => {
      this.connectionPromise = null;
    });

    return this.connectionPromise;
  }

  subscribe<T>(topic: string): Observable<T> {
    const subject = new Subject<T>();
    if (!isPlatformBrowser(this.platformId)) return subject.asObservable();

    this.connect()
      .then(() => {
        const c = this.client as { subscribe: (t: string, cb: (m: unknown) => void) => unknown } | null;
        if (!c) return;

        if (this.subscriptions.has(topic)) {
          this.unsubscribe(topic);
        }

        const sub = c.subscribe(topic, (message: unknown) => {
          const msg = message as { body: string };
          try { subject.next(JSON.parse(msg.body) as T); } catch { /* ignore */ }
        });
        this.subscriptions.set(topic, sub);
      })
      .catch(() => {
        subject.complete();
      });

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
    this.subscriptions.clear();
    this.client = null;
    this.connectionPromise = null;
  }
}
