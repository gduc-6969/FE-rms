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

  getAvailableTables(): Observable<TableResponse[]> {
    return this.http
      .get<ApiResponse<TableResponse[]>>(`${this.apiUrl}/tables`)
      .pipe(map(res => res.data.filter(t => t.status === 'trong' || t.status === 'da_dat')));
  }

  createReservation(payload: CreateReservationRequest): Observable<ReservationResponse> {
    const token = localStorage.getItem('rms-token');
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http
      .post<ApiResponse<ReservationResponse>>(`${this.apiUrl}/reservations`, payload, { headers })
      .pipe(map(res => res.data));
  }
}
