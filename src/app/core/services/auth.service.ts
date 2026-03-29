import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { UserRole, ApiResponse, AuthResponse } from '../models/app.models';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'rms-token';
const ROLE_KEY = 'rms-role';
const USER_KEY = 'rms-user';
const USER_ID_KEY = 'rms-user-id';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.API_BASE_URL}/auth`;

  readonly role = signal<UserRole | null>((localStorage.getItem(ROLE_KEY) as UserRole | null) ?? null);
  readonly fullName = signal<string | null>(localStorage.getItem(USER_KEY));

  private mapBackendRoleToUserRole(backendRole: string): UserRole {
    if (backendRole === 'QUAN_LY') return 'admin';  
    if (backendRole === 'NHAN_VIEN') return 'staff';
    return 'customer';
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          const mappedRole = this.mapBackendRoleToUserRole(response.data.user.role);
          localStorage.setItem(TOKEN_KEY, response.data.accessToken);
          localStorage.setItem(ROLE_KEY, mappedRole);
          localStorage.setItem(USER_KEY, response.data.user.fullName);
          localStorage.setItem(USER_ID_KEY, String(response.data.user.id));

          this.role.set(mappedRole);
          this.fullName.set(response.data.user.fullName);
        }
      }),
      catchError(this.handleError)
    );
  }

  register(payload: { name: string; email: string; password: string }): Observable<ApiResponse<AuthResponse>> {    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, payload).pipe(
      catchError(this.handleError)
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_ID_KEY);
    this.role.set(null);
    this.fullName.set(null);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  private handleError(error: HttpErrorResponse) {
    let errorRes = error.error;
    if (!errorRes || !errorRes.errorCode) {
      errorRes = {
        success: false,
        status: error.status,
        message: 'Lỗi hệ thống. Vui lòng thử lại!',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
    return throwError(() => errorRes);
  }
}

