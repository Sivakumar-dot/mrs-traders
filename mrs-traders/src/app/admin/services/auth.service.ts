import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AdminLoginRequest, AdminLoginResponse } from '../models/admin-auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorageKey = 'admin_jwt_token';

  login(payload: AdminLoginRequest): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>('/api/admin/login', payload).pipe(
      tap((response) => {
        if (response.success && response.token) {
          this.setToken(response.token);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenStorageKey);
  }

  isAuthenticated(): boolean {
    return typeof window !== 'undefined' && !!localStorage.getItem(this.tokenStorageKey);
  }

  getToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem(this.tokenStorageKey) : null;
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, token);
  }
}
