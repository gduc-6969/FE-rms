import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TableResponse, TableRequest, TableStatus } from '../models/table.models';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.API_BASE_URL}/tables`;

  // Get all tables
  getAllTables(): Observable<TableResponse[]> {
    return this.http
      .get<ApiResponse<TableResponse[]>>(this.baseUrl)
      .pipe(map(res => res.data));
  }

  // Get table by ID
  getTableById(id: number): Observable<TableResponse> {
    return this.http
      .get<ApiResponse<TableResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  // Get tables by status
  getTablesByStatus(status: TableStatus): Observable<TableResponse[]> {
    return this.http
      .get<ApiResponse<TableResponse[]>>(`${this.baseUrl}/status/${status}`)
      .pipe(map(res => res.data));
  }

  // Create new table
  createTable(request: TableRequest): Observable<TableResponse> {
    return this.http
      .post<ApiResponse<TableResponse>>(this.baseUrl, request)
      .pipe(map(res => res.data));
  }

  // Update table
  updateTable(id: number, request: TableRequest): Observable<TableResponse> {
    return this.http
      .put<ApiResponse<TableResponse>>(`${this.baseUrl}/${id}`, request)
      .pipe(map(res => res.data));
  }

  // Update table status
  updateTableStatus(id: number, status: TableStatus): Observable<TableResponse> {
    return this.http
      .patch<ApiResponse<TableResponse>>(`${this.baseUrl}/${id}/status?status=${status}`, {})
      .pipe(map(res => res.data));
  }

  // Delete table
  deleteTable(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}
