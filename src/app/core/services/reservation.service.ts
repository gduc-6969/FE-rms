import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, TableResponse, CreateReservationRequest, ReservationResponse } from '../models/app.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.API_BASE_URL;

  /** Build auth headers — throws if token is missing (caller should guard with isAuthenticated) */
  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('rms-token');
    if (!token) throw new Error('NOT_AUTHENTICATED');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getAvailableTables(): Observable<TableResponse[]> {
    return this.http
      .get<ApiResponse<TableResponse[]>>(`${this.apiUrl}/tables`, {
        headers: this.authHeaders()
      })
      .pipe(map(res => res.data.filter(t => t.status === 'trong' || t.status === 'da_dat')));
  }

  createReservation(payload: CreateReservationRequest): Observable<ReservationResponse> {
    return this.http
      .post<ApiResponse<ReservationResponse>>(`${this.apiUrl}/reservations`, payload, {
        headers: this.authHeaders()
      })
      .pipe(map(res => res.data));
  }
}
