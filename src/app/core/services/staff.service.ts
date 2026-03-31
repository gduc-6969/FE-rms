import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Role, UserResponse } from '../models/user.models';
import { PageResponse } from '../models/pagination.models';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface CreateStaffRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
}

@Injectable({ providedIn: 'root' })
export class StaffService {          
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8082/api/v1/users';

  getAllStaff(page = 0, size = 10): Observable<PageResponse<UserResponse>> {    
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<UserResponse>>>(`${this.baseUrl}/page`, { params })
      .pipe(map(res => res.data));
  }

  getById(id: number): Observable<UserResponse> {
    return this.http
      .get<ApiResponse<UserResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  createStaff(request: CreateStaffRequest): Observable<UserResponse> {
    return this.http
      .post<ApiResponse<UserResponse>>(this.baseUrl, request)
      .pipe(map(res => res.data));
  }

  updateRole(id: number, role: Role): Observable<UserResponse> {
    const params = new HttpParams().set('role', role);
    return this.http
      .patch<ApiResponse<UserResponse>>(`${this.baseUrl}/${id}/role`, null, { params })
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}