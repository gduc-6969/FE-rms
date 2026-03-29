import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Role, UserResponse } from '../models/user.models';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class StaffService {          
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8082/api/v1/users';

  getAllStaff(): Observable<UserResponse[]> {    // thêm filter
    return this.http
      .get<ApiResponse<UserResponse[]>>(this.baseUrl)
      .pipe(
        map(res => res.data.filter(u =>
          u.role !== 'KHACH_HANG' && u.status !== 'ngung_hoat_dong'
        ))
      );
  }

  getById(id: number): Observable<UserResponse> {
    return this.http
      .get<ApiResponse<UserResponse>>(`${this.baseUrl}/${id}`)
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