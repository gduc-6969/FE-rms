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
      <h2>Pending Payments</h2>
      <button mat-stroked-button>Refresh</button>
    </div>

    <mat-card>
      <mat-card-content>
        <table mat-table [dataSource]="pendingPayments" class="full-width">
          <ng-container matColumnDef="billCode">
            <th mat-header-cell *matHeaderCellDef>Receipt</th>
            <td mat-cell *matCellDef="let row">{{ row.billCode }}</td>
          </ng-container>

          <ng-container matColumnDef="tableName">
            <th mat-header-cell *matHeaderCellDef>Table</th>
            <td mat-cell *matCellDef="let row">{{ row.tableName }}</td>
          </ng-container>

          <ng-container matColumnDef="waitingMinutes">
            <th mat-header-cell *matHeaderCellDef>Waiting</th>
            <td mat-cell *matCellDef="let row">{{ row.waitingMinutes }} min</td>
          </ng-container>

          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let row">{{ row.total | currency : 'USD' : 'symbol' : '1.2-2' }}</td>
          </ng-container>

          <ng-container matColumnDef="waiter">
            <th mat-header-cell *matHeaderCellDef>Staff</th>
            <td mat-cell *matCellDef="let row">{{ row.waiter }}</td>
          </ng-container>

          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row"><button mat-flat-button color="primary">Pay</button></td>
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
