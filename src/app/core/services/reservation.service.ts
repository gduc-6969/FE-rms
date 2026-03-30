import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, TableResponse, CreateReservationRequest, ReservationResponse } from '../models/app.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.API_BASE_URL;

  /** Build auth headers with Bearer token and explicit JSON content type */
  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('rms-token');
    if (!token) throw new Error('NOT_AUTHENTICATED');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /** Lấy tất cả bàn (trong + da_dat + dang_phuc_vu) từ backend */
  getAllTables(): Observable<TableResponse[]> {
    return this.http
      .get<ApiResponse<TableResponse[]>>(`${this.apiUrl}/tables`, {
        headers: this.authHeaders()
      })
      .pipe(map(res => res.data));
  }

  /**
   * Lấy Set các tableId đang có reservation với trạng thái cho_xac_nhan.
   * Frontend dùng set này để hiển thị bàn đó như "Đang phục vụ".
   */
  getPendingTableIds(): Observable<Set<number>> {
    return this.http
      .get<ApiResponse<ReservationResponse[]>>(
        `${this.apiUrl}/reservations/status/cho_xac_nhan`,
        { headers: this.authHeaders() }
      )
      .pipe(
        map(res => new Set(res.data.map(r => r.tableId)))
      );
  }

  /**
   * Kết hợp danh sách bàn + pending reservations thành một mảng bàn
   * với trạng thái hiển thị đã được tính sẵn.
   * Bàn có reservation chờ xác nhận → hiển thị như "dang_phuc_vu".
   */
  getTablesWithEffectiveStatus(): Observable<TableResponse[]> {
    return forkJoin({
      tables: this.getAllTables(),
      pendingIds: this.getPendingTableIds()
    }).pipe(
      map(({ tables, pendingIds }) =>
        tables
          .filter(t => t.status === 'trong' || t.status === 'da_dat' || t.status === 'dang_phuc_vu' || pendingIds.has(t.id))
          .map(t => ({
            ...t,
            // Nếu bàn đang có reservation chờ xác nhận → override hiển thị thành dang_phuc_vu
            status: pendingIds.has(t.id) ? 'dang_phuc_vu' as const : t.status
          }))
      )
    );
  }

  createReservation(payload: CreateReservationRequest): Observable<ReservationResponse> {
    return this.http
      .post<ApiResponse<ReservationResponse>>(`${this.apiUrl}/reservations`, payload, {
        headers: this.authHeaders()
      })
      .pipe(map(res => res.data));
  }

  getReservationById(id: number): Observable<ReservationResponse> {
    return this.http
      .get<ApiResponse<ReservationResponse>>(`${this.apiUrl}/reservations/${id}`, {
        headers: this.authHeaders()
      })
      .pipe(map(res => res.data));
  }

  /** Fetch all reservations with status cho_xac_nhan (pending) */
  getPendingReservations(): Observable<ReservationResponse[]> {
    return this.http
      .get<ApiResponse<ReservationResponse[]>>(
        `${this.apiUrl}/reservations/status/cho_xac_nhan`,
        { headers: this.authHeaders() }
      )
      .pipe(map(res => res.data));
  }

  /** Accept a reservation */
  acceptReservation(id: number): Observable<ReservationResponse> {
    return this.http
      .put<ApiResponse<ReservationResponse>>(
        `${this.apiUrl}/reservations/${id}/status`,
        { status: 'da_xac_nhan' },
        { headers: this.authHeaders() }
      )
      .pipe(map(res => res.data));
  }

  /** Decline a reservation */
  declineReservation(id: number): Observable<ReservationResponse> {
    return this.http
      .put<ApiResponse<ReservationResponse>>(
        `${this.apiUrl}/reservations/${id}/status`,
        { status: 'da_huy' },
        { headers: this.authHeaders() }
      )
      .pipe(map(res => res.data));
  }
}
