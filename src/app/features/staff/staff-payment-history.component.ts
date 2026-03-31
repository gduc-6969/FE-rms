import {
  ChangeDetectionStrategy, Component, OnInit,
  computed, inject, signal
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

/** Matches backend InvoiceResponse */
interface InvoiceRecord {
  id: number;
  tableId: number;
  tableCode: string | null;
  customerName: string | null;
  invoiceCode: string | null;
  subtotal: number;
  discount: number | null;
  totalAmount: number;
  status: string;
  openedByName: string | null;
  createdAt: string;
  closedAt: string | null;
  payments: PaymentRecord[];
}

/** Matches backend PaymentResponse */
interface PaymentRecord {
  id: number;
  invoiceId: number;
  amount: number;
  paymentMethod: string;   // e.g. tien_mat, the, chuyen_khoan, vi_dien_tu
  processedByName: string | null;
  paymentDate: string | null;
}

/** Flattened row for the table */
interface PaymentRow {
  invoiceCode: string;
  tableCode: string;
  staffName: string;
  method: string;
  methodLabel: string;
  paidAt: string;
  total: number;
}

const METHOD_MAP: Record<string, { label: string; icon: string }> = {
  tien_mat:     { label: 'Cash',     icon: 'payments' },
  the:          { label: 'Card',     icon: 'credit_card' },
  chuyen_khoan: { label: 'Transfer', icon: 'account_balance' },
  vi_dien_tu:   { label: 'E-Wallet', icon: 'account_balance_wallet' },
};

@Component({
  selector: 'app-staff-payment-history',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, MatIconModule],
  template: `
    <section class="history-page">
      <!-- Header -->
      <div class="page-head">
        <div>
          <h2>Payment History</h2>
          <p>All completed transactions stored in the system.</p>
        </div>
        <div class="header-right">
          <div class="total-badge">
            <mat-icon>payments</mat-icon>
            {{ totalRevenue() | currency : 'VND' : 'symbol' : '1.0-0' }}
          </div>
          <button class="reload-btn" (click)="loadInvoices()" [disabled]="isLoading()">
            <mat-icon [class.spinning]="isLoading()">refresh</mat-icon>
            Reload
          </button>
        </div>
      </div>

      <!-- Error -->
      @if (loadError()) {
        <div class="error-banner">
          <mat-icon>error_outline</mat-icon>
          <span>{{ loadError() }}</span>
          <button (click)="loadInvoices()">Retry</button>
        </div>
      }

      <!-- Filters -->
      <div class="filter-row">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Search by receipt code, table or staff..."
            [value]="searchQuery()"
            (input)="searchQuery.set(asStr($event))">
        </div>
        <div class="method-filters">
          <button class="filter-chip" [class.active]="methodFilter() === ''" (click)="methodFilter.set('')">All</button>
          <button class="filter-chip" [class.active]="methodFilter() === 'tien_mat'" (click)="methodFilter.set('tien_mat')">Cash</button>
          <button class="filter-chip" [class.active]="methodFilter() === 'the'" (click)="methodFilter.set('the')">Card</button>
          <button class="filter-chip" [class.active]="methodFilter() === 'chuyen_khoan'" (click)="methodFilter.set('chuyen_khoan')">Transfer</button>
          <button class="filter-chip" [class.active]="methodFilter() === 'vi_dien_tu'" (click)="methodFilter.set('vi_dien_tu')">E-Wallet</button>
        </div>
      </div>

      <!-- Loading skeleton -->
      @if (isLoading()) {
        <div class="skeleton-list">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-row"></div>
          }
        </div>
      }

      <!-- Table -->
      @if (!isLoading()) {
        <div class="table-card">
          @if (filteredRows().length === 0) {
            <div class="empty-state">
              <mat-icon>receipt_long</mat-icon>
              <p>No transactions found</p>
            </div>
          } @else {
            <div class="table-wrap">
              <table class="pay-table">
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Table</th>
                    <th>Staff</th>
                    <th>Method</th>
                    <th>Time</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of filteredRows(); track row.invoiceCode) {
                    <tr>
                      <td class="code-cell">{{ row.invoiceCode }}</td>
                      <td><span class="table-badge">{{ row.tableCode }}</span></td>
                      <td class="staff-cell">{{ row.staffName || '—' }}</td>
                      <td>
                        <span class="method-badge" [attr.data-method]="row.method">
                          <mat-icon>{{ methodIcon(row.method) }}</mat-icon>
                          {{ row.methodLabel }}
                        </span>
                      </td>
                      <td class="time-cell">{{ row.paidAt | date : 'dd/MM/yyyy HH:mm' }}</td>
                      <td class="amount-cell">{{ row.total | currency : 'VND' : 'symbol' : '1.0-0' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="table-footer">
              <span>{{ filteredRows().length }} transaction(s) found</span>
              <span class="footer-total">
                Filtered total: {{ filteredTotal() | currency : 'VND' : 'symbol' : '1.0-0' }}
              </span>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .history-page { display: flex; flex-direction: column; gap: 20px; }

    /* Header */
    .page-head {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 16px;
    }
    .page-head h2 { margin: 0; font-size: 24px; font-weight: 700; color: #1e293b; }
    .page-head p { margin: 4px 0 0; color: #64748b; font-size: 14px; }
    .header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

    .total-badge {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px; background: #fff7ed; border-radius: 14px;
      font-size: 18px; font-weight: 700; color: #ff6a33;
    }
    .total-badge mat-icon { font-size: 22px; width: 22px; height: 22px; }

    .reload-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 10px; border: 1px solid #e2e8f0;
      background: #fff; font-size: 13px; font-weight: 600; color: #475569;
      cursor: pointer; transition: all 0.15s;
    }
    .reload-btn:hover { border-color: #ff6a33; color: #ff6a33; }
    .reload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .reload-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .spinning { animation: spin 1s linear infinite; }

    /* Error */
    .error-banner {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 20px; background: #fef2f2;
      border: 1px solid #fca5a5; border-radius: 14px;
    }
    .error-banner mat-icon { color: #dc2626; }
    .error-banner span { flex: 1; font-size: 14px; color: #dc2626; }
    .error-banner button {
      padding: 6px 14px; border-radius: 8px; border: none;
      background: #dc2626; color: #fff; font-size: 13px; cursor: pointer;
    }

    /* Skeleton */
    .skeleton-list { display: flex; flex-direction: column; gap: 8px; }
    .skeleton-row {
      height: 56px; border-radius: 12px;
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Filters */
    .filter-row {
      display: flex; gap: 16px; flex-wrap: wrap; align-items: center;
    }
    .search-box {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; background: #fff; border-radius: 12px;
      border: 1px solid #e2e8f0; flex: 1; min-width: 240px;
    }
    .search-box mat-icon { color: #94a3b8; font-size: 20px; width: 20px; height: 20px; }
    .search-box input {
      flex: 1; border: none; outline: none; font-size: 14px; color: #1e293b;
      background: transparent;
    }

    .method-filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-chip {
      padding: 8px 16px; border-radius: 20px; border: 1px solid #e2e8f0;
      background: #fff; font-size: 13px; font-weight: 500; color: #475569;
      cursor: pointer; transition: all 0.15s;
    }
    .filter-chip:hover { border-color: #ff6a33; color: #ff6a33; }
    .filter-chip.active { background: #ff6a33; color: #fff; border-color: #ff6a33; }

    /* Table Card */
    .table-card {
      background: #fff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden;
    }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 60px 0; color: #94a3b8;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { font-size: 15px; margin: 0; }

    .table-wrap { overflow-x: auto; }
    .pay-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .pay-table th {
      padding: 14px 20px; text-align: left; font-weight: 600; color: #64748b;
      background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
      position: sticky; top: 0;
    }
    .pay-table td {
      padding: 14px 20px; border-top: 1px solid #f1f5f9; color: #334155; vertical-align: middle;
    }
    .pay-table tbody tr:hover { background: #fafafa; }
    .pay-table th:last-child, .pay-table td:last-child { text-align: right; }

    .code-cell { font-family: monospace; font-weight: 700; color: #1e293b; font-size: 13px; }
    .staff-cell { color: #64748b; font-size: 13px; }
    .time-cell { color: #64748b; font-size: 13px; white-space: nowrap; }
    .amount-cell { font-weight: 700; color: #ff6a33; }

    .table-badge {
      background: #f1f5f9; color: #1e293b; padding: 4px 10px;
      border-radius: 8px; font-size: 12px; font-weight: 700;
    }

    .method-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: 10px; font-size: 12px; font-weight: 600;
    }
    .method-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .method-badge[data-method="tien_mat"]     { background: #f0fdf4; color: #15803d; }
    .method-badge[data-method="the"]          { background: #eff6ff; color: #1d4ed8; }
    .method-badge[data-method="chuyen_khoan"] { background: #faf5ff; color: #7c3aed; }
    .method-badge[data-method="vi_dien_tu"]   { background: #fff7ed; color: #c2410c; }

    .table-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 20px; border-top: 1px solid #f1f5f9;
      font-size: 13px; color: #94a3b8;
    }
    .footer-total { font-weight: 600; color: #ff6a33; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffPaymentHistoryComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.API_BASE_URL;

  readonly invoices = signal<InvoiceRecord[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly methodFilter = signal('');
  readonly searchQuery = signal('');

  /** Flatten invoices → payment rows (one row per payment on a closed invoice) */
  readonly allRows = computed<PaymentRow[]>(() => {
    const rows: PaymentRow[] = [];
    for (const inv of this.invoices()) {
      if (!inv.payments || inv.payments.length === 0) continue;
      for (const p of inv.payments) {
        const m = METHOD_MAP[p.paymentMethod] ?? { label: p.paymentMethod, icon: 'payment' };
        rows.push({
          invoiceCode: inv.invoiceCode ?? `#${inv.id}`,
          tableCode:   inv.tableCode ?? '—',
          staffName:   inv.openedByName ?? p.processedByName ?? '—',
          method:      p.paymentMethod,
          methodLabel: m.label,
          paidAt:      p.paymentDate ?? inv.closedAt ?? inv.createdAt,
          total:       p.amount ?? inv.totalAmount ?? 0,
        });
      }
    }
    // Sort by most recent first
    return rows.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  });

  readonly filteredRows = computed<PaymentRow[]>(() => {
    let items = this.allRows();
    const method = this.methodFilter();
    const q = this.searchQuery().toLowerCase().trim();
    if (method) {
      items = items.filter(r => r.method === method);
    }
    if (q) {
      items = items.filter(r =>
        r.invoiceCode.toLowerCase().includes(q) ||
        r.tableCode.toLowerCase().includes(q) ||
        (r.staffName || '').toLowerCase().includes(q)
      );
    }
    return items;
  });

  readonly totalRevenue = computed(() =>
    this.allRows().reduce((sum, r) => sum + Number(r.total), 0)
  );

  readonly filteredTotal = computed(() =>
    this.filteredRows().reduce((sum, r) => sum + Number(r.total), 0)
  );

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    const token = localStorage.getItem('rms-token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http
      .get<{ data: InvoiceRecord[] }>(`${this.apiUrl}/invoices`, { headers })
      .pipe(map(r => r.data))
      .subscribe({
        next: (data) => {
          this.invoices.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load invoices:', err);
          this.loadError.set('Could not load payment history. Please try again.');
          this.isLoading.set(false);
        }
      });
  }

  asStr(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  methodIcon(method: string): string {
    return METHOD_MAP[method]?.icon ?? 'payment';
  }
}
