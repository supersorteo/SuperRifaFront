import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest, RegisterRequest, TokenResponse } from '../models/auth.models';
import { StorageService } from './storage.service';

// Organizer session — claves completamente separadas de admin
const ORG_ACCESS  = 'org:access';
const ORG_REFRESH = 'org:refresh';
const ORG_USER    = 'org:user';

// Admin session — namespace independiente
const ADM_ACCESS  = 'adm:access';
const ADM_REFRESH = 'adm:refresh';
const ADM_USER    = 'adm:user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http    = inject(HttpClient);
  private readonly router  = inject(Router);
  private readonly storage = inject(StorageService);

  private readonly _orgToken   = signal<string | null>(this.storage.get(ORG_ACCESS));
  private readonly _adminToken = signal<string | null>(this.storage.get(ADM_ACCESS));
  private readonly _orgUser   = signal<AuthUser | null>(this.loadUser(ORG_USER));
  private readonly _adminUser = signal<AuthUser | null>(this.loadUser(ADM_USER));

  // Señales públicas separadas — NO se mezclan
  readonly orgUser   = this._orgUser.asReadonly();
  readonly adminUser = this._adminUser.asReadonly();

  readonly hasOrgSession = computed(() => this._orgUser() !== null && this._orgToken() !== null);
  readonly hasAdminSession = computed(() => this._adminUser() !== null && this._adminToken() !== null);
  readonly hasAnySession = computed(() => this.hasOrgSession() || this.hasAdminSession());
  readonly isLoggedIn  = computed(() => this.hasOrgSession());
  readonly isOrganizer = computed(() =>
    this.hasOrgSession() && (this._orgUser()?.roles.includes('ROLE_ORGANIZER') ?? false)
  );
  readonly isAdmin = computed(() =>
    this.hasAdminSession() && (this._adminUser()?.roles.includes('ROLE_ADMIN') ?? false)
  );

  // ── ORGANIZER ───────────────────────────────────────────────
  login(req: LoginRequest) {
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/login`, req).pipe(
      tap(res => this.storeOrgSession(res))
    );
  }

  register(req: RegisterRequest) {
    return this.http.post<void>(`${environment.apiUrl}/auth/register`, req);
  }

  logout(): void {
    this.clearOrgSession();
    this.router.navigate(['/']);
  }

  logoutSilent(): void {
    this.clearOrgSession();
  }

  getOrgToken(): string | null {
    return this._orgToken();
  }

  // ── ADMIN ────────────────────────────────────────────────────
  adminLogin(username: string, password: string) {
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/admin/login`, { username, password }).pipe(
      tap(res => this.storeAdminSession(res))
    );
  }

  adminLogout(): void {
    this.clearAdminSession();
    this.router.navigate(['/']);
  }

  getAdminToken(): string | null {
    return this._adminToken();
  }

  // ── PRIVATE ──────────────────────────────────────────────────
  private storeOrgSession(res: TokenResponse): void {
    this.storage.set(ORG_ACCESS,  res.accessToken);
    this.storage.set(ORG_REFRESH, res.refreshToken);
    this._orgToken.set(res.accessToken);
    const user: AuthUser = { email: res.email, fullName: res.fullName, roles: res.roles };
    this.storage.set(ORG_USER, JSON.stringify(user));
    this._orgUser.set(user);
  }

  private storeAdminSession(res: TokenResponse): void {
    this.storage.set(ADM_ACCESS,  res.accessToken);
    this.storage.set(ADM_REFRESH, res.refreshToken);
    this._adminToken.set(res.accessToken);
    const user: AuthUser = { email: res.email, fullName: res.fullName, roles: res.roles };
    this.storage.set(ADM_USER, JSON.stringify(user));
    this._adminUser.set(user);
  }

  private clearOrgSession(): void {
    this.storage.remove(ORG_ACCESS);
    this.storage.remove(ORG_REFRESH);
    this.storage.remove(ORG_USER);
    this._orgToken.set(null);
    this._orgUser.set(null);
  }

  private clearAdminSession(): void {
    this.storage.remove(ADM_ACCESS);
    this.storage.remove(ADM_REFRESH);
    this.storage.remove(ADM_USER);
    this._adminToken.set(null);
    this._adminUser.set(null);
  }

  private loadUser(key: string): AuthUser | null {
    const raw = this.storage.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
}
