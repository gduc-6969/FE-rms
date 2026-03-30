import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, DiningTable, TableResponse } from '../models/app.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StaffTableService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.API_BASE_URL;

  /** Build auth headers with Bearer token */
  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('rms-token');
    if (!token) throw new Error('NOT_AUTHENTICATED');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /** Map backend TableResponse → DiningTable (frontend model) */
  private mapToDiningTable(t: TableResponse): DiningTable {
    let status: DiningTable['status'];
    switch (t.status) {
      case 'trong':        status = 'available';        break;
      case 'da_dat':       status = 'serving';          break;
      case 'dang_phuc_vu': status = 'serving';          break;
      case 'bao_tri':      status = 'disabled';         break;
      default:             status = 'available';
    }
    return {
      id: t.id,
      name: t.tableCode,
      capacity: t.capacity,
      area: 'main',
      status,
      // Keep the original backend status for display purposes
      _rawStatus: t.status
    } as DiningTable & { _rawStatus: string };
  }

  /** Fetch all tables from backend and return as DiningTable[] */
  getAllTablesForStaff(): Observable<(DiningTable & { _rawStatus: string })[]> {
    return this.http
      .get<ApiResponse<TableResponse[]>>(`${this.apiUrl}/tables`, {
        headers: this.authHeaders()
      })
      .pipe(
        map(res => res.data.map(t => this.mapToDiningTable(t) as DiningTable & { _rawStatus: string }))
      );
  }

  /** Update table status via PATCH /api/v1/tables/{id}/status */
  updateTableStatus(tableId: number, status: string): Observable<TableResponse> {
    return this.http
      .patch<ApiResponse<TableResponse>>(
        `${this.apiUrl}/tables/${tableId}/status?status=${status}`,
        {},
        { headers: this.authHeaders() }
      )
      .pipe(map(res => res.data));
  }
}
