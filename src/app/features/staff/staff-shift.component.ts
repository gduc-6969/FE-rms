import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TableSessionService } from '../../core/services/table-session.service';

@Component({
  selector: 'app-staff-shift',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, CurrencyPipe],
  template: `
    <section class="shift-page">
      <!-- Status Banner -->
      <div class="status-banner" [class.open]="isShiftOpen()" [class.closed]="!isShiftOpen()">
        <div class="banner-left">
          <mat-icon>{{ isShiftOpen() ? 'toggle_on' : 'toggle_off' }}</mat-icon>
          <div>
            <h2>Shift {{ isShiftOpen() ? 'Open' : 'Closed' }}</h2>
            <p>{{ isShiftOpen() ? 'Currently taking orders' : 'Open a shift to start working' }}</p>
          </div>
        </div>
        @if (!isShiftOpen()) {
          <button class="shift-btn open-btn" (click)="openConfirm('open')">
            <mat-icon>play_circle</mat-icon> Open Shift
          </button>
        } @else {
          <button class="shift-btn close-btn" (click)="openConfirm('close')">
            <mat-icon>stop_circle</mat-icon> Close Shift
          </button>
        }
      </div>

      <!-- KPI Cards -->
      <div class="kpi-row">
        <div class="kpi-card">
          <mat-icon class="kpi-icon">table_restaurant</mat-icon>
          <div class="kpi-info">
            <span class="kpi-value">{{ totalTablesServed() }}</span>
            <span class="kpi-label">Tables Served</span>
          </div>
        </div>
        <div class="kpi-card">
          <mat-icon class="kpi-icon">receipt_long</mat-icon>
          <div class="kpi-info">
            <span class="kpi-value">{{ totalOrdersPerformed() }}</span>
            <span class="kpi-label">Orders Completed</span>
          </div>
        </div>
        <div class="kpi-card">
          <mat-icon class="kpi-icon">payments</mat-icon>
          <div class="kpi-info">
            <span class="kpi-value">{{ totalPaidAmount() | currency : 'USD' : 'symbol' : '1.2-2' }}</span>
            <span class="kpi-label">Revenue Collected</span>
          </div>
        </div>
      </div>

      <!-- Shift History -->
      <div class="history-card">
        <div class="history-head">
          <h3>Shift History</h3>
          <span class="badge">{{ shiftHistory().length }} records</span>
        </div>

        @if (shiftHistory().length === 0) {
          <div class="empty-state">
            <mat-icon>history</mat-icon>
            <p>No shift records yet</p>
          </div>
        } @else {
          <div class="table-wrap">
            <table class="shift-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Bills</th>
                  <th>Revenue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (row of shiftHistory(); track row.id) {
                  <tr>
                    <td>{{ row.date }}</td>
                    <td>{{ row.startTime }}</td>
                    <td>{{ row.endTime || '—' }}</td>
                    <td>{{ row.totalBills }}</td>
                    <td class="revenue-cell">{{ row.revenue | currency : 'USD' : 'symbol' : '1.2-2' }}</td>
                    <td>
                      <span class="status-pill" [class]="row.status">
                        {{ row.status === 'open' ? 'Open' : 'Closed' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Confirm Popup -->
      @if (confirmAction()) {
        <div class="backdrop" (click)="confirmAction.set(null)">
          <div class="modal" (click)="$event.stopPropagation()">
            <mat-icon class="modal-icon" [class.warn]="confirmAction() === 'close'">
              {{ confirmAction() === 'open' ? 'play_circle' : 'stop_circle' }}
            </mat-icon>
            <h3>{{ confirmAction() === 'open' ? 'Open Shift?' : 'Close Shift?' }}</h3>
            <p>
              {{ confirmAction() === 'open'
                ? 'This will start a new shift session. You can begin taking orders.'
                : 'This will end the current shift and save all statistics.' }}
            </p>
            <div class="modal-actions">
              <button class="cancel-btn" (click)="confirmAction.set(null)">Cancel</button>
              <button class="confirm-btn" [class.warn]="confirmAction() === 'close'" (click)="confirmShiftAction()">
                {{ confirmAction() === 'open' ? 'Open Shift' : 'Close Shift' }}
              </button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .shift-page { display: flex; flex-direction: column; gap: 20px; }

    /* ─── Status Banner ─── */
    .status-banner {
      display: flex; justify-content: space-between; align-items: center;
      padding: 24px 28px; border-radius: 20px; flex-wrap: wrap; gap: 16px;
    }
    .status-banner.open { background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #fff; }
    .status-banner.closed { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #e2e8f0; }
    .banner-left { display: flex; align-items: center; gap: 16px; }
    .banner-left mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.8; }
    .banner-left h2 { margin: 0; font-size: 22px; font-weight: 700; }
    .banner-left p { margin: 4px 0 0; font-size: 14px; opacity: 0.8; }

    .shift-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 24px; border-radius: 14px; border: none;
      font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.15s;
    }
    .open-btn { background: #10b981; color: #fff; }
    .open-btn:hover { background: #059669; }
    .close-btn { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); }
    .close-btn:hover { background: rgba(255,255,255,0.25); }

    /* ─── KPI Cards ─── */
    .kpi-row {
      display: grid; gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }
    .kpi-card {
      display: flex; align-items: center; gap: 16px;
      padding: 22px 24px; background: #fff; border-radius: 18px;
      border: 1px solid #e2e8f0; transition: box-shadow 0.15s;
    }
    .kpi-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .kpi-icon {
      font-size: 28px; width: 28px; height: 28px; color: #ff6a33;
      background: #fff7ed; padding: 12px; border-radius: 14px;
      box-sizing: content-box;
    }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-value { font-size: 24px; font-weight: 800; color: #1e293b; }
    .kpi-label { font-size: 13px; color: #64748b; margin-top: 2px; }

    /* ─── History Card ─── */
    .history-card {
      background: #fff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden;
    }
    .history-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid #f1f5f9;
    }
    .history-head h3 { margin: 0; font-size: 18px; font-weight: 700; color: #1e293b; }
    .badge {
      background: #f1f5f9; padding: 4px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600; color: #64748b;
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 48px 0; color: #94a3b8;
    }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; }

    .table-wrap { overflow-x: auto; }
    .shift-table {
      width: 100%; border-collapse: collapse; font-size: 14px;
    }
    .shift-table th {
      padding: 12px 20px; text-align: left; font-weight: 600; color: #64748b;
      background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .shift-table td {
      padding: 14px 20px; border-top: 1px solid #f1f5f9; color: #334155;
    }
    .shift-table tbody tr:hover { background: #f8fafc; }
    .revenue-cell { font-weight: 700; color: #ff6a33; }

    .status-pill {
      display: inline-block; padding: 4px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600;
    }
    .status-pill.open { background: #d1fae5; color: #065f46; }
    .status-pill.closed { background: #f1f5f9; color: #64748b; }

    /* ─── Modal ─── */
    .backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: grid; place-items: center; z-index: 1000;
    }
    .modal {
      width: min(92vw, 400px); background: #fff; border-radius: 20px;
      padding: 32px; text-align: center; color: #1e293b;
    }
    .modal-icon { font-size: 48px; width: 48px; height: 48px; color: #10b981; margin-bottom: 8px; }
    .modal-icon.warn { color: #ef4444; }
    .modal h3 { margin: 0 0 8px; font-size: 20px; font-weight: 700; }
    .modal p { margin: 0 0 24px; color: #64748b; font-size: 14px; line-height: 1.5; }
    .modal-actions { display: flex; gap: 10px; }
    .cancel-btn {
      flex: 1; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;
      background: #fff; font-size: 15px; font-weight: 600; color: #64748b; cursor: pointer;
    }
    .confirm-btn {
      flex: 1; padding: 12px; border-radius: 12px; border: none;
      background: #10b981; font-size: 15px; font-weight: 600; color: #fff; cursor: pointer;
    }
    .confirm-btn:hover { background: #059669; }
    .confirm-btn.warn { background: #ef4444; }
    .confirm-btn.warn:hover { background: #dc2626; }
  `],
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
