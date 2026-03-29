import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IngredientRequest, IngredientResponse } from '../models/ingredient.models';
import { PageResponse } from '../models/pagination.models';


interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class IngredientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8082/api/v1/ingredients';

  getAll(page = 0, size = 10): Observable<PageResponse<IngredientResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<IngredientResponse>>>(`${this.baseUrl}/page`, { params })
      .pipe(map(res => res.data));
  }

  getById(id: number): Observable<IngredientResponse> {
    return this.http
      .get<ApiResponse<IngredientResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  create(request: IngredientRequest): Observable<IngredientResponse> {
    return this.http
      .post<ApiResponse<IngredientResponse>>(this.baseUrl, request)
      .pipe(map(res => res.data));
  }

  update(id: number, request: IngredientRequest): Observable<IngredientResponse> {
    return this.http
      .put<ApiResponse<IngredientResponse>>(`${this.baseUrl}/${id}`, request)
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}
