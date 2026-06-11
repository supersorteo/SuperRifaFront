import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest, RegisterRequest, TokenResponse } from '../models/auth.models';
import { StorageService } from './storage.service';

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(StorageService);

  private readonly _user = signal<AuthUser | null>(this.loadUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isOrganizer = computed(() =>
    this._user()?.roles.includes('ROLE_ORGANIZER') ?? false
  );
  readonly isAdmin = computed(() =>
    this._user()?.roles.includes('ROLE_ADMIN') ?? false
  );

  login(req: LoginRequest) {
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/login`, req).pipe(
      tap(res => this.storeSession(res))
    );
  }

  adminLogin(username: string, password: string) {
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/admin/login`, { username, password }).pipe(
      tap(res => this.storeSession(res))
    );
  }

  register(req: RegisterRequest) {
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/register`, req).pipe(
      tap(res => this.storeSession(res))
    );
  }

  logout(): void {
    this.logoutSilent();
    this.router.navigate(['/']);
  }

  logoutSilent(): void {
    this.storage.remove(ACCESS_KEY);
    this.storage.remove(REFRESH_KEY);
    this.storage.remove(USER_KEY);
    this._user.set(null);
  }

  getToken(): string | null {
    return this.storage.get(ACCESS_KEY);
  }

  private storeSession(res: TokenResponse): void {
    this.storage.set(ACCESS_KEY, res.accessToken);
    this.storage.set(REFRESH_KEY, res.refreshToken);
    const user: AuthUser = { email: res.email, fullName: res.fullName, roles: res.roles };
    this.storage.set(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  private loadUser(): AuthUser | null {
    const raw = this.storage.get(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
}
