import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-cashier-checkout',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatButtonModule, CurrencyPipe],
  template: `
    <div class="page-header">
      <h2>Danh sách bàn chờ thanh toán</h2>
      <button mat-stroked-button>Làm tươi</button>
    </div>

    <mat-card>
      <mat-card-content>
        <table mat-table [dataSource]="pendingPayments" class="full-width">
          <ng-container matColumnDef="billCode">
            <th mat-header-cell *matHeaderCellDef>Mã HĐ</th>
            <td mat-cell *matCellDef="let row">{{ row.billCode }}</td>
          </ng-container>

          <ng-container matColumnDef="tableName">
            <th mat-header-cell *matHeaderCellDef>Bàn</th>
            <td mat-cell *matCellDef="let row">{{ row.tableName }}</td>
          </ng-container>

          <ng-container matColumnDef="waitingMinutes">
            <th mat-header-cell *matHeaderCellDef>Thời gian chờ</th>
            <td mat-cell *matCellDef="let row">{{ row.waitingMinutes }} phút</td>
          </ng-container>

          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Tạm tính</th>
            <td mat-cell *matCellDef="let row">{{ row.total | currency : 'VND' : 'symbol' : '1.0-0' }}</td>
          </ng-container>

          <ng-container matColumnDef="waiter">
            <th mat-header-cell *matHeaderCellDef>Nhân viên</th>
            <td mat-cell *matCellDef="let row">{{ row.waiter }}</td>
          </ng-container>

          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row"><button mat-flat-button color="primary">Thanh toán</button></td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .full-width {
        width: 100%;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashierCheckoutComponent {
  private readonly mockData = inject(MockDataService);

  readonly pendingPayments = this.mockData.getPendingPayments();
  readonly displayedColumns = ['billCode', 'tableName', 'waitingMinutes', 'total', 'waiter', 'action'];
}
