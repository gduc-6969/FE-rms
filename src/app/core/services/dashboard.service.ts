import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IngredientResponse } from '../models/ingredient.models';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> { success: boolean; data: T; }

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DashboardSummary {
  revenueToday: number;
  customersToday: number;
  totalTables: number;
  occupiedTables: number;
  occupancyRate: number;
  activeReservations: number;
}

export interface DailyRevenue { date: string; revenue: number; }
export interface PeakHour    { hour: string; count: number;   }

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.API_BASE_URL;

  getSummary(): Observable<DashboardSummary> {
    return this.http
      .get<ApiResponse<DashboardSummary>>(`${this.base}/reports/dashboard-summary`)
      .pipe(map(r => r.data));
  }

  getWeeklyTrend(): Observable<DailyRevenue[]> {
    return this.http
      .get<ApiResponse<DailyRevenue[]>>(`${this.base}/reports/weekly-trend`)
      .pipe(map(r => r.data));
  }

  getPeakHours(): Observable<PeakHour[]> {
    return this.http
      .get<ApiResponse<PeakHour[]>>(`${this.base}/reports/peak-hours`)
      .pipe(map(r => r.data));
  }

  getIngredients(): Observable<IngredientResponse[]> {
    return this.http
      .get<ApiResponse<PageResponse<IngredientResponse>>>(
        `${this.base}/ingredients/page?page=0&size=1000`
      )
      .pipe(map(r => r.data.content));
  }
}