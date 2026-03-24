import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { TableSessionService } from '../../core/services/table-session.service';

@Component({
  selector: 'app-staff-payment-history',
  standalone: true,
  imports: [MatCardModule, MatTableModule, CurrencyPipe],
  template: `
    <section class="rms-page">
      <div class="page-header">
        <h2>Lịch sử thanh toán</h2>
        <p>Tổng hợp giao dịch đã xử lý trong ca.</p>
      </div>

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="payments()" class="full-width">
            <ng-container matColumnDef="billCode"><th mat-header-cell *matHeaderCellDef>Mã HĐ</th><td mat-cell *matCellDef="let row">{{ row.billCode }}</td></ng-container>
            <ng-container matColumnDef="tableName"><th mat-header-cell *matHeaderCellDef>Bàn</th><td mat-cell *matCellDef="let row">{{ row.tableName }}</td></ng-container>
            <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef>Tổng</th><td mat-cell *matCellDef="let row">{{ row.total | currency : 'VND' : 'symbol' : '1.0-0' }}</td></ng-container>
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
      .page-header p { margin: 6px 0 0; color: #6b7280; }
      .full-width { width: 100%; }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffPaymentHistoryComponent {
  private readonly tableSessionService = inject(TableSessionService);
  readonly payments = this.tableSessionService.paymentHistory;
  readonly displayedColumns = ['billCode', 'tableName', 'total', 'method', 'paidAt'];
}
