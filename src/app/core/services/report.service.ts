import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ReportSummaryResponse,
  MonthlyReportResponse,
  CategoryReportResponse,
  BestSellerResponse,
  TopSellingItemResponse
} from '../models/report.models';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8082/api/v1/reports';
  private readonly statsUrl = 'http://localhost:8082/api/v1/statistics';

  // ========== Report APIs ==========

  getSummary(year?: number): Observable<ReportSummaryResponse> {
    let params = new HttpParams();
    if (year) params = params.set('year', year);
    return this.http
      .get<ApiResponse<ReportSummaryResponse>>(`${this.baseUrl}/summary`, { params })
      .pipe(map(res => res.data));
  }

  getMonthlyReport(year?: number): Observable<MonthlyReportResponse[]> {
    let params = new HttpParams();
    if (year) params = params.set('year', year);
    return this.http
      .get<ApiResponse<MonthlyReportResponse[]>>(`${this.baseUrl}/monthly`, { params })
      .pipe(map(res => res.data));
  }

  getCategoryReport(year?: number): Observable<CategoryReportResponse[]> {
    let params = new HttpParams();
    if (year) params = params.set('year', year);
    return this.http
      .get<ApiResponse<CategoryReportResponse[]>>(`${this.baseUrl}/by-category`, { params })
      .pipe(map(res => res.data));
  }

  getBestSellers(year?: number, limit = 5): Observable<BestSellerResponse[]> {
    let params = new HttpParams().set('limit', limit);
    if (year) params = params.set('year', year);
    return this.http
      .get<ApiResponse<BestSellerResponse[]>>(`${this.baseUrl}/best-sellers`, { params })
      .pipe(map(res => res.data));
  }

  // ========== Statistics APIs ==========

  getTopSellingWeekly(limit = 10): Observable<TopSellingItemResponse[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http
      .get<ApiResponse<TopSellingItemResponse[]>>(`${this.statsUrl}/top-selling/weekly`, { params })
      .pipe(map(res => res.data));
  }

  getTopSellingMonthly(limit = 10): Observable<TopSellingItemResponse[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http
      .get<ApiResponse<TopSellingItemResponse[]>>(`${this.statsUrl}/top-selling/monthly`, { params })
      .pipe(map(res => res.data));
  }

  getTopSellingCustomRange(startDate: string, endDate: string, limit = 10): Observable<TopSellingItemResponse[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('limit', limit);
    return this.http
      .get<ApiResponse<TopSellingItemResponse[]>>(`${this.statsUrl}/top-selling/custom`, { params })
      .pipe(map(res => res.data));
  }

  exportExcel(year: number): Observable<Blob> {
  return this.http.get(
    `${this.baseUrl}/export/excel?year=${year}`,
    { responseType: 'blob' }
  );
}

exportPdf(year: number): Observable<Blob> {
  return this.http.get(
    `${this.baseUrl}/export/pdf?year=${year}`,
    { responseType: 'blob' }
  );
}
}
