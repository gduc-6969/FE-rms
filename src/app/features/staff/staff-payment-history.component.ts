import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TableSessionService } from '../../core/services/table-session.service';

@Component({
  selector: 'app-staff-payment-history',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, MatIconModule],
  template: `
    <section class="history-page">
      <!-- Header -->
      <div class="page-head">
        <div>
          <h2>Payment History</h2>
          <p>All completed transactions for your shifts.</p>
        </div>
        <div class="total-badge">
          <mat-icon>payments</mat-icon>
          {{ totalRevenue() | currency : 'VND' : 'symbol' : '1.0-0' }}
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-row">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Search receipt, table or staff..." [(ngModel)]="searchQuery">
        </div>
        <div class="method-filters">
          <button class="filter-chip" [class.active]="methodFilter() === ''" (click)="methodFilter.set('')">All</button>
          <button class="filter-chip" [class.active]="methodFilter() === 'Cash'" (click)="methodFilter.set('Cash')">Cash</button>
          <button class="filter-chip" [class.active]="methodFilter() === 'Card'" (click)="methodFilter.set('Card')">Card</button>
          <button class="filter-chip" [class.active]="methodFilter() === 'Transfer'" (click)="methodFilter.set('Transfer')">Transfer</button>
          <button class="filter-chip" [class.active]="methodFilter() === 'E-Wallet'" (click)="methodFilter.set('E-Wallet')">E-Wallet</button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-card">
        @if (filteredPayments().length === 0) {
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
                @for (row of filteredPayments(); track row.billCode) {
                  <tr>
                    <td class="code-cell">{{ row.billCode }}</td>
                    <td>{{ row.tableName }}</td>
                    <td>{{ row.staffName }}</td>
                    <td>
                      <span class="method-badge" [attr.data-method]="row.method">
                        <mat-icon>{{ methodIcon(row.method) }}</mat-icon>
                        {{ row.method }}
                      </span>
                    </td>
                    <td class="time-cell">{{ row.paidAt }}</td>
                    <td class="amount-cell">{{ row.total | currency : 'VND' : 'symbol' : '1.0-0' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="table-footer">
            <span>{{ filteredPayments().length }} transaction(s)</span>
          </div>
        }
      </div>
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
    .total-badge {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px; background: #fff7ed; border-radius: 14px;
      font-size: 18px; font-weight: 700; color: #ff6a33;
    }
    .total-badge mat-icon { font-size: 22px; width: 22px; height: 22px; }

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
      padding: 48px 0; color: #94a3b8;
    }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; }

    .table-wrap { overflow-x: auto; }
    .pay-table {
      width: 100%; border-collapse: collapse; font-size: 14px;
    }
    .pay-table th {
      padding: 14px 20px; text-align: left; font-weight: 600; color: #64748b;
      background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .pay-table td {
      padding: 14px 20px; border-top: 1px solid #f1f5f9; color: #334155;
    }
    .pay-table tbody tr:hover { background: #f8fafc; }

    .code-cell { font-family: monospace; font-weight: 600; color: #1e293b; }
    .time-cell { color: #64748b; font-size: 13px; }
    .amount-cell { font-weight: 700; color: #ff6a33; text-align: right; }
    .pay-table th:last-child { text-align: right; }

    .method-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600;
      background: #f1f5f9; color: #475569;
    }
    .method-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .table-footer {
      padding: 12px 20px; border-top: 1px solid #f1f5f9;
      font-size: 13px; color: #94a3b8;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffPaymentHistoryComponent {
  private readonly tableSessionService = inject(TableSessionService);
  readonly payments = this.tableSessionService.paymentHistory;
  readonly methodFilter = signal('');
  searchQuery = '';

  readonly totalRevenue = computed(() =>
    this.payments().reduce((sum, p) => sum + p.total, 0)
  );

  readonly filteredPayments = computed(() => {
    let items = this.payments();
    const method = this.methodFilter();
    const query = this.searchQuery.toLowerCase().trim();

    if (method) {
      items = items.filter(p => p.method === method);
    }
    if (query) {
      items = items.filter(p =>
        p.billCode.toLowerCase().includes(query) ||
        p.tableName.toLowerCase().includes(query) ||
        p.staffName.toLowerCase().includes(query)
      );
    }
    return items;
  });

  methodIcon(method: string): string {
    switch (method) {
      case 'Cash': return 'payments';
      case 'Card': return 'credit_card';
      case 'Transfer': return 'account_balance';
      case 'E-Wallet': return 'account_balance_wallet';
      default: return 'payment';
    }
  }
}
