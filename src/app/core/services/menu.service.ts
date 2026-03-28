import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, CategoryResponse, MenuItemResponse } from '../models/app.models';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8082/api/v1';

  getCategories(): Observable<CategoryResponse[]> {
    return this.http
      .get<ApiResponse<CategoryResponse[]>>(`${this.apiUrl}/categories`)
      .pipe(map(res => res.data));
  }

  getAvailableMenuItems(): Observable<MenuItemResponse[]> {
    return this.http
      .get<ApiResponse<MenuItemResponse[]>>(`${this.apiUrl}/menu-items/available`)
      .pipe(map(res => res.data));
  }

  getAvailableMenuItemsByCategory(categoryId: number): Observable<MenuItemResponse[]> {
    return this.http
      .get<ApiResponse<MenuItemResponse[]>>(`${this.apiUrl}/menu-items/available/category/${categoryId}`)
      .pipe(map(res => res.data));
  }

  searchAvailableMenuItems(keyword: string): Observable<MenuItemResponse[]> {
    return this.http
      .get<ApiResponse<MenuItemResponse[]>>(`${this.apiUrl}/menu-items/available/search`, {
        params: { keyword }
      })
      .pipe(map(res => res.data));
  }
}
