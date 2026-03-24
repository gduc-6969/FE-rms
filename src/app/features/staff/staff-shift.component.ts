import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { TableSessionService } from '../../core/services/table-session.service';

@Component({
  selector: 'app-staff-shift',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatTableModule, CurrencyPipe],
  template: `
    <section class="rms-page">
      <div class="page-header">
        <div>
          <h2>Shift</h2>
          <p>Mở ca, kết ca và theo dõi lịch sử làm việc.</p>
        </div>
        @if (!isShiftOpen()) {
          <button mat-flat-button color="primary" (click)="openConfirm('open')">Mở ca</button>
        } @else {
          <button mat-flat-button color="warn" (click)="openConfirm('close')">Kết ca</button>
        }
      </div>

      <section class="summary-grid">
        <mat-card>
          <mat-card-content>
            <p>Tổng số bàn phục vụ</p>
            <h3>{{ totalTablesServed() }}</h3>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <p>Số order thực hiện</p>
            <h3>{{ totalOrdersPerformed() }}</h3>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <p>Số tiền đã thanh toán</p>
            <h3>{{ totalPaidAmount() | currency : 'VND' : 'symbol' : '1.0-0' }}</h3>
          </mat-card-content>
        </mat-card>
      </section>

      <mat-card>
        <mat-card-content>
          <p><strong>Trạng thái ca hiện tại:</strong> {{ isShiftOpen() ? 'Đang mở' : 'Đã đóng' }}</p>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="shiftHistory()" class="full-width">
            <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Ngày</th><td mat-cell *matCellDef="let row">{{ row.date }}</td></ng-container>
            <ng-container matColumnDef="startTime"><th mat-header-cell *matHeaderCellDef>Bắt đầu</th><td mat-cell *matCellDef="let row">{{ row.startTime }}</td></ng-container>
            <ng-container matColumnDef="endTime"><th mat-header-cell *matHeaderCellDef>Kết thúc</th><td mat-cell *matCellDef="let row">{{ row.endTime }}</td></ng-container>
            <ng-container matColumnDef="totalBills"><th mat-header-cell *matHeaderCellDef>Số HĐ</th><td mat-cell *matCellDef="let row">{{ row.totalBills }}</td></ng-container>
            <ng-container matColumnDef="revenue"><th mat-header-cell *matHeaderCellDef>Doanh thu</th><td mat-cell *matCellDef="let row">{{ row.revenue | currency : 'VND' : 'symbol' : '1.0-0' }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Trạng thái</th><td mat-cell *matCellDef="let row">{{ row.status }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      @if (confirmAction()) {
        <div class="popup-backdrop" (click)="confirmAction.set(null)">
          <div class="popup-card" (click)="$event.stopPropagation()">
            <h3>{{ confirmAction() === 'open' ? 'Xác nhận mở ca' : 'Xác nhận kết ca' }}</h3>
            <p>
              {{
                confirmAction() === 'open'
                  ? 'Bạn có chắc muốn bắt đầu ca làm việc mới không?'
                  : 'Bạn có chắc muốn kết ca và lưu thống kê ca hiện tại không?'
              }}
            </p>
            <div class="popup-actions">
              <button mat-stroked-button type="button" (click)="confirmAction.set(null)">Hủy</button>
              <button mat-flat-button color="primary" type="button" (click)="confirmShiftAction()">Xác nhận</button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .rms-page { display: grid; gap: 16px; }
      .page-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
      .page-header p { margin: 4px 0 0; color: #6b7280; }

      .summary-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .summary-grid p {
        margin: 0;
        color: #6b7280;
      }

      .summary-grid h3 {
        margin-top: 8px;
      }

      .full-width { width: 100%; }

      .popup-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(2, 6, 23, 0.42);
        display: grid;
        place-items: center;
        z-index: 999;
      }

      .popup-card {
        width: min(92vw, 460px);
        border-radius: 20px;
        background: #fff;
        padding: 20px;
      }

      .popup-card p {
        color: #64748b;
        margin: 6px 0 14px;
      }

      .popup-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffShiftComponent {
  private readonly tableSessionService = inject(TableSessionService);

  readonly shiftHistory = this.tableSessionService.shiftHistory;
  readonly isShiftOpen = this.tableSessionService.isShiftOpen;
  readonly totalTablesServed = this.tableSessionService.totalTablesServed;
  readonly totalOrdersPerformed = this.tableSessionService.totalOrdersPerformed;
  readonly totalPaidAmount = this.tableSessionService.totalPaidAmount;
  readonly confirmAction = signal<'open' | 'close' | null>(null);
  readonly displayedColumns = ['date', 'startTime', 'endTime', 'totalBills', 'revenue', 'status'];

  openConfirm(type: 'open' | 'close'): void {
    this.confirmAction.set(type);
  }

  confirmShiftAction(): void {
    const action = this.confirmAction();
    if (action === 'open') {
      this.tableSessionService.openShift();
    }
    if (action === 'close') {
      this.tableSessionService.closeShift();
    }
    this.confirmAction.set(null);
  }
}
