import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTableModule, CurrencyPipe],
  template: `
    <section class="rms-page">
      <div class="page-header">
        <div>
          <h2>Reports</h2>
          <p>Xuất báo cáo doanh thu và thanh toán.</p>
        </div>
        <div class="actions">
          <button mat-stroked-button><mat-icon>table_view</mat-icon> Export Excel</button>
          <button mat-stroked-button><mat-icon>picture_as_pdf</mat-icon> Export PDF</button>
          <button mat-flat-button color="primary"><mat-icon>print</mat-icon> In</button>
        </div>
      </div>

      <div class="summary-grid">
        <mat-card><mat-card-content><p>Tổng doanh thu</p><h3>{{ totalRevenue() | currency : 'VND' : 'symbol' : '1.0-0' }}</h3></mat-card-content></mat-card>
        <mat-card><mat-card-content><p>Số hóa đơn</p><h3>{{ payments.length }}</h3></mat-card-content></mat-card>
        <mat-card><mat-card-content><p>TB mỗi hóa đơn</p><h3>{{ averageRevenue() | currency : 'VND' : 'symbol' : '1.0-0' }}</h3></mat-card-content></mat-card>
      </div>

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="payments" class="full-width">
            <ng-container matColumnDef="billCode"><th mat-header-cell *matHeaderCellDef>Mã HĐ</th><td mat-cell *matCellDef="let row">{{ row.billCode }}</td></ng-container>
            <ng-container matColumnDef="tableName"><th mat-header-cell *matHeaderCellDef>Bàn</th><td mat-cell *matCellDef="let row">{{ row.tableName }}</td></ng-container>
            <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef>Tổng tiền</th><td mat-cell *matCellDef="let row">{{ row.total | currency : 'VND' : 'symbol' : '1.0-0' }}</td></ng-container>
            <ng-container matColumnDef="method"><th mat-header-cell *matHeaderCellDef>Phương thức</th><td mat-cell *matCellDef="let row">{{ row.method }}</td></ng-container>
            <ng-container matColumnDef="paidAt"><th mat-header-cell *matHeaderCellDef>Thời gian</th><td mat-cell *matCellDef="let row">{{ row.paidAt }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .rms-page { display: grid; gap: 16px; }
      .page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
      .page-header p { margin: 4px 0 0; color: #6b7280; }
      .actions { display: flex; gap: 8px; flex-wrap: wrap; }
      .summary-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .summary-grid p { margin: 0; color: #6b7280; }
      .summary-grid h3 { margin-top: 8px; }
      .full-width { width: 100%; }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent {
  private readonly mockData = inject(MockDataService);

  readonly payments = this.mockData.getPaymentHistory();
  readonly displayedColumns = ['billCode', 'tableName', 'total', 'method', 'paidAt'];

  readonly totalRevenue = computed(() => this.payments.reduce((sum, item) => sum + item.total, 0));
  readonly averageRevenue = computed(() =>
    this.payments.length ? Math.round(this.totalRevenue() / this.payments.length) : 0
  );
}
