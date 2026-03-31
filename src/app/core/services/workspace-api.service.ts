import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CategoryResponse {
  id: number;
  name: string;
}

export interface ApiMenuItem {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  price: number;
  imageUrl: string | null;
  status: string;
}

export interface InvoiceResponse {
  id: number;
  tableId: number;
  tableCode: string;
  customerId?: number;
  customerName?: string;
  subtotal: number;  // tam_tinh
  discount?: number;
  discountReason?: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export interface OrderResponse {
  id: number;
  invoiceId: number;
  status: string;
}

export interface PaymentResponse {
  id: number;
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  paidAt: string;
}

export interface TableDetailResponse {
  id: number;
  tableCode: string;
  capacity: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.API_BASE_URL;

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('rms-token');
    if (!token) throw new Error('NOT_AUTHENTICATED');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /** Lấy thông tin bàn theo ID */
  getTableById(id: number): Observable<TableDetailResponse> {
    return this.http
      .get<{ data: TableDetailResponse }>(`${this.apiUrl}/tables/${id}`, {
        headers: this.authHeaders()
      })
      .pipe(map(r => r.data));
  }

  /** Lấy tất cả categories */
  getCategories(): Observable<CategoryResponse[]> {
    return this.http
      .get<{ data: CategoryResponse[] }>(`${this.apiUrl}/categories`, {
        headers: this.authHeaders()
      })
      .pipe(map(r => r.data));
  }

  /** Lấy menu items đang bán theo category */
  getMenuItemsByCategory(categoryId: number): Observable<ApiMenuItem[]> {
    return this.http
      .get<{ data: ApiMenuItem[] }>(
        `${this.apiUrl}/menu-items/available/category/${categoryId}`,
        { headers: this.authHeaders() }
      )
      .pipe(map(r => r.data));
  }

  /** Lấy tất cả menu items đang bán */
  getAllAvailableMenuItems(): Observable<ApiMenuItem[]> {
    return this.http
      .get<{ data: ApiMenuItem[] }>(`${this.apiUrl}/menu-items/available`, {
        headers: this.authHeaders()
      })
      .pipe(map(r => r.data));
  }

  /** Tìm kiếm menu items đang bán */
  searchMenuItems(keyword: string): Observable<ApiMenuItem[]> {
    return this.http
      .get<{ data: ApiMenuItem[] }>(
        `${this.apiUrl}/menu-items/available/search?keyword=${encodeURIComponent(keyword)}`,
        { headers: this.authHeaders() }
      )
      .pipe(map(r => r.data));
  }

  /** Đổi trạng thái bàn */
  updateTableStatus(tableId: number, status: string): Observable<any> {
    return this.http
      .patch<{ data: any }>(
        `${this.apiUrl}/tables/${tableId}/status?status=${status}`,
        {},
        { headers: this.authHeaders() }
      )
      .pipe(map(r => r.data));
  }

  /** Tạo hóa đơn mới khi mở bàn */
  createInvoice(tableId: number): Observable<InvoiceResponse> {
    return this.http
      .post<{ data: InvoiceResponse }>(
        `${this.apiUrl}/invoices`,
        { tableId },
        { headers: this.authHeaders() }
      )
      .pipe(map(r => r.data));
  }

  /** Lấy invoice đang mở (chưa thanh toán) của bàn */
  getOpenInvoiceByTable(tableId: number): Observable<InvoiceResponse> {
    return this.http
      .get<{ data: InvoiceResponse }>(
        `${this.apiUrl}/invoices/table/${tableId}/open`,
        { headers: this.authHeaders() }
      )
      .pipe(map(r => r.data));
  }

  /** Lấy invoice theo ID */
  getInvoiceById(invoiceId: number): Observable<InvoiceResponse> {
    return this.http
      .get<{ data: InvoiceResponse }>(
        `${this.apiUrl}/invoices/${invoiceId}`,
        { headers: this.authHeaders() }
      )
      .pipe(map(r => r.data));
  }

  /** Ghi order (danh sách món) vào hóa đơn */
  createOrder(invoiceId: number, items: { menuItemId: number; quantity: number }[]): Observable<OrderResponse> {
    return this.http
      .post<{ data: OrderResponse }>(
        `${this.apiUrl}/orders`,
        { invoiceId, items },
        { headers: this.authHeaders() }
      )
      .pipe(map(r => r.data));
  }

  /** Thanh toán hóa đơn */
  createPayment(
    invoiceId: number,
    amount: number,
    paymentMethod: string
  ): Observable<PaymentResponse> {
    return this.http
      .post<{ data: PaymentResponse }>(
        `${this.apiUrl}/payments`,
        { invoiceId, amount, paymentMethod },
        { headers: this.authHeaders() }
      )
      .pipe(map(r => r.data));
  }

  /** Cập nhật discount cho invoice */
  updateInvoiceDiscount(
    invoiceId: number,
    tableId: number,
    discount: number,
    discountReason?: string
  ): Observable<InvoiceResponse> {
    return this.http
      .put<{ data: InvoiceResponse }>(
        `${this.apiUrl}/invoices/${invoiceId}/discount`,
        { tableId, discount, discountReason },
        { headers: this.authHeaders() }
      )
      .pipe(map(r => r.data));
  }
}
