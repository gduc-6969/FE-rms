import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MenuItemRequest, MenuItemResponse, MenuItemStatus } from '../models/menu-item.models';
import { CategoryResponse } from '../models/category.models';
import { PageResponse } from '../models/pagination.models';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class MenuItemService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8082/api/v1/menu-items';
  private readonly categoryUrl = 'http://localhost:8082/api/v1/categories';


  getAll(page = 0, size = 10): Observable<PageResponse<MenuItemResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<MenuItemResponse>>>(`${this.baseUrl}/page`, { params })
      .pipe(map(res => res.data));
  }

  getByCategory(categoryId: number): Observable<MenuItemResponse[]> {
    return this.http
      .get<ApiResponse<MenuItemResponse[]>>(`${this.baseUrl}/category/${categoryId}`)
      .pipe(map(res => res.data));
  }

  search(keyword: string): Observable<MenuItemResponse[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http
      .get<ApiResponse<MenuItemResponse[]>>(`${this.baseUrl}/search`, { params })
      .pipe(map(res => res.data));
  }

  create(request: MenuItemRequest): Observable<MenuItemResponse> {
    return this.http
      .post<ApiResponse<MenuItemResponse>>(this.baseUrl, request)
      .pipe(map(res => res.data));
  }

  update(id: number, request: MenuItemRequest): Observable<MenuItemResponse> {
    return this.http
      .put<ApiResponse<MenuItemResponse>>(`${this.baseUrl}/${id}`, request)
      .pipe(map(res => res.data));
  }

  updateStatus(id: number, status: MenuItemStatus): Observable<MenuItemResponse> {
    const params = new HttpParams().set('status', status);
    return this.http
      .patch<ApiResponse<MenuItemResponse>>(`${this.baseUrl}/${id}/status`, null, { params })
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }


  getAllCategories(): Observable<CategoryResponse[]> {
    return this.http
      .get<ApiResponse<CategoryResponse[]>>(this.categoryUrl)
      .pipe(map(res => res.data));
  }
}
