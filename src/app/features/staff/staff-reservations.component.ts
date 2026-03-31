import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit,
  inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { ReservationService } from '../../core/services/reservation.service';
import { ReservationResponse } from '../../core/models/app.models';

// Seat duration rules (minutes) — same as customer-reservation.component.ts
function maxDurationMinutes(capacity: number): number {
  if (capacity <= 3) return 90;
  if (capacity <= 6) return 120;
  return 165;
}

/** Grace period (minutes) before no-show auto-cancel */
const NOSHOW_GRACE_MINUTES = 15;

interface ReservationVM extends ReservationResponse {
  /** Nếu có: tableCapacity từ bảng bàn (dùng để tính đếm ngược) */
  tableCapacity?: number;
  /** Thời điểm khách thực sự đến (set khi nhấn Show Up) */
  arrivedAt?: Date;
  /** Timer id của countdown interval */
  _timerId?: ReturnType<typeof setInterval>;
  /** Chuỗi countdown hiển thị */
  countdown?: string;
  /** Timer id của no-show auto-cancel */
  _noShowTimerId?: ReturnType<typeof setTimeout>;
  /** Đã auto-hủy hay chưa */
  autoCancelled?: boolean;
}

@Component({
  selector: 'app-staff-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <section class="res-page">
      <div class="page-head">
        <div>
          <h2>Reservations</h2>
          <p>Review and manage customer booking requests.</p>
        </div>
        <div class="head-right">
          <!-- Tab: Pending / Confirmed -->
          <div class="tab-switch">
            <button class="tab-btn" [class.active]="activeTab() === 'pending'" (click)="switchTab('pending')">
              Pending <span class="badge" *ngIf="pendingList().length">{{ pendingList().length }}</span>
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'confirmed'" (click)="switchTab('confirmed')">
              Confirmed <span class="badge confirmed-badge" *ngIf="confirmedList().length">{{ confirmedList().length }}</span>
            </button>
          </div>
          <button class="refresh-btn" (click)="loadReservations()" [disabled]="isLoading()">
            <mat-icon [class.spinning]="isLoading()">refresh</mat-icon> Refresh
          </button>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <mat-icon>hourglass_empty</mat-icon>
          <p>Loading reservations...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button class="retry-btn" (click)="loadReservations()">Retry</button>
        </div>
      } @else {

        <!-- ── PENDING TAB ── -->
        @if (activeTab() === 'pending') {
          @if (pendingList().length === 0) {
            <div class="empty-state">
              <mat-icon>event_available</mat-icon>
              <p>No pending reservations</p>
              <small>All caught up! New bookings will appear here.</small>
            </div>
          } @else {
            <div class="res-list">
              @for (res of pendingList(); track res.id) {
                <div class="res-card" [class.processing]="processingId() === res.id">
                  <div class="res-header">
                    <span class="res-id">#{{ res.id }}</span>
                    <span class="res-status pending-chip">Pending</span>
                  </div>

                  <div class="res-body">
                    <div class="res-row"><mat-icon>person</mat-icon><span>{{ res.customerName }}</span></div>
                    <div class="res-row"><mat-icon>table_restaurant</mat-icon><span>{{ res.tableCode }} · {{ res.numberOfGuests }} guests</span></div>
                    <div class="res-row"><mat-icon>schedule</mat-icon><span>{{ formatDateTime(res.reservationTime) }}</span></div>
                    @if (res.note) {
                      <div class="res-row note"><mat-icon>sticky_note_2</mat-icon><span>{{ res.note }}</span></div>
                    }
                    <div class="res-row created"><mat-icon>history</mat-icon><span>Booked {{ formatDateTime(res.createdAt) }}</span></div>
                  </div>

                  <!-- Decline modal inline -->
                  @if (decliningId() === res.id) {
                    <div class="decline-form">
                      <label>Lý do hủy đặt bàn:</label>
                      <textarea [(ngModel)]="declineReason" rows="2" placeholder="VD: Nhà hàng không còn chỗ vào thời điểm này..."></textarea>
                      <div class="decline-form-actions">
                        <button class="cancel-reason-btn" (click)="decliningId.set(null); declineReason = ''">Hủy</button>
                        <button class="confirm-decline-btn" [disabled]="!declineReason.trim() || processingId() === res.id"
                          (click)="confirmDecline(res.id)">
                          <mat-icon>close</mat-icon> Xác nhận hủy
                        </button>
                      </div>
                    </div>
                  } @else {
                    <div class="res-actions">
                      <button class="decline-btn" [disabled]="processingId() === res.id"
                        (click)="startDecline(res.id)">
                        <mat-icon>close</mat-icon> Decline
                      </button>
                      <button class="accept-btn" [disabled]="processingId() === res.id"
                        (click)="accept(res)">
                        <mat-icon>check</mat-icon> Accept
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        }

        <!-- ── CONFIRMED TAB ── -->
        @if (activeTab() === 'confirmed') {
          @if (confirmedList().length === 0) {
            <div class="empty-state">
              <mat-icon>event_note</mat-icon>
              <p>No confirmed reservations</p>
            </div>
          } @else {
            <div class="res-list">
              @for (res of confirmedList(); track res.id) {
                <div class="res-card confirmed-card" [class.processing]="processingId() === res.id">
                  <div class="res-header">
                    <span class="res-id">#{{ res.id }}</span>
                    <div class="res-header-right">
                      <!-- Countdown or status badge -->
                      @if (res.arrivedAt && res.countdown && !res.autoCancelled) {
                        <span class="countdown-chip arrived">
                          <mat-icon>timer</mat-icon> {{ res.countdown }} remaining
                        </span>
                      } @else if (res.autoCancelled) {
                        <span class="res-status noshow-chip">Auto-cancelled</span>
                      } @else if (res.status === 'khach_khong_den') {
                        <span class="countdown-chip noshow-wait">
                          <mat-icon>schedule</mat-icon>
                          @if (res.countdown) { {{ res.countdown }} to auto-cancel }
                          @else { Waiting... }
                        </span>
                      } @else {
                        <span class="res-status confirmed-chip">Confirmed</span>
                      }
                    </div>
                  </div>

                  <div class="res-body">
                    <div class="res-row"><mat-icon>person</mat-icon><span>{{ res.customerName }}</span></div>
                    <div class="res-row">
                      <mat-icon>table_restaurant</mat-icon>
                      <span>{{ res.tableCode }} · {{ res.numberOfGuests }} guests
                        @if (res.tableCapacity) {
                          · max {{ durationLabel(res.tableCapacity) }}
                        }
                      </span>
                    </div>
                    <div class="res-row"><mat-icon>schedule</mat-icon><span>{{ formatDateTime(res.reservationTime) }}</span></div>
                    @if (res.note) {
                      <div class="res-row note"><mat-icon>sticky_note_2</mat-icon><span>{{ res.note }}</span></div>
                    }
                  </div>

                  @if (!res.autoCancelled && res.status !== 'khach_den' && res.status !== 'khach_khong_den') {
                    <div class="res-actions">
                      <button class="noshow-btn" [disabled]="processingId() === res.id"
                        (click)="markNoShow(res)">
                        <mat-icon>person_off</mat-icon> Not Show Up
                      </button>
                      <button class="showup-btn" [disabled]="processingId() === res.id"
                        (click)="markArrived(res)">
                        <mat-icon>how_to_reg</mat-icon> Show Up
                      </button>
                    </div>
                  } @else if (res.status === 'khach_khong_den' && !res.autoCancelled) {
                    <!-- Guest didn't show up yet — waiting 15 min grace -->
                    <div class="res-actions">
                      <button class="showup-btn" [disabled]="processingId() === res.id"
                        (click)="markArrived(res)">
                        <mat-icon>how_to_reg</mat-icon> Show Up (arrived late)
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        }
      }
    </section>
  `,
  styles: [`
    .res-page { display: flex; flex-direction: column; gap: 16px; }

    .page-head {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
    }
    .page-head h2 { margin: 0; font-size: 24px; font-weight: 700; color: #1e293b; }
    .page-head p { margin: 4px 0 0; color: #64748b; font-size: 14px; }

    .head-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    /* Tab switch */
    .tab-switch { display: flex; background: #f1f5f9; border-radius: 10px; padding: 3px; gap: 2px; }
    .tab-btn {
      padding: 7px 16px; border-radius: 8px; border: none; background: transparent;
      font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.15s;
      display: flex; align-items: center; gap: 6px;
    }
    .tab-btn.active { background: #fff; color: #1e293b; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .badge {
      background: #ff6a33; color: #fff; border-radius: 10px; font-size: 11px;
      font-weight: 700; padding: 1px 7px; min-width: 18px; text-align: center;
    }
    .confirmed-badge { background: #10b981; }

    .refresh-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 10px; border: 1px solid #e2e8f0;
      background: #fff; font-size: 13px; font-weight: 600; color: #475569;
      cursor: pointer; transition: all 0.15s;
    }
    .refresh-btn:hover { border-color: #ff6a33; color: #ff6a33; }
    .refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .refresh-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .spinning { animation: spin 1s linear infinite; }

    /* States */
    .loading-state, .empty-state, .error-state {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 60px 20px; text-align: center; color: #94a3b8;
    }
    .loading-state mat-icon, .empty-state mat-icon, .error-state mat-icon {
      font-size: 48px; width: 48px; height: 48px;
    }
    .empty-state mat-icon { color: #22c55e; }
    .error-state mat-icon { color: #ef4444; }
    .error-state p { color: #ef4444; }
    .retry-btn {
      padding: 8px 16px; border-radius: 10px; border: 1px solid #e2e8f0;
      background: #fff; cursor: pointer; font-weight: 600; color: #475569;
    }

    /* List */
    .res-list { display: flex; flex-direction: column; gap: 12px; }

    .res-card {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
      padding: 18px; transition: opacity 0.3s;
    }
    .res-card.processing { opacity: 0.5; pointer-events: none; }
    .res-card.confirmed-card { border-left: 4px solid #10b981; }

    .res-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;
    }
    .res-header-right { display: flex; align-items: center; gap: 8px; }
    .res-id { font-size: 13px; font-weight: 700; color: #64748b; }
    .res-status {
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
    }
    .pending-chip { background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe; }
    .confirmed-chip { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
    .noshow-chip { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }

    .countdown-chip {
      display: flex; align-items: center; gap: 4px;
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;
    }
    .countdown-chip mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .countdown-chip.arrived { background: #ecfdf5; color: #059669; border: 1px solid #6ee7b7; }
    .countdown-chip.noshow-wait { background: #fff7ed; color: #c2410c; border: 1px solid #fdba74; animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }

    .res-body { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    .res-row {
      display: flex; align-items: center; gap: 10px;
      font-size: 14px; color: #334155;
    }
    .res-row mat-icon { font-size: 18px; width: 18px; height: 18px; color: #94a3b8; flex-shrink: 0; }
    .res-row.note { color: #64748b; font-style: italic; }
    .res-row.note mat-icon { color: #eab308; }
    .res-row.created { font-size: 12px; color: #94a3b8; }

    .res-actions { display: flex; gap: 10px; }
    .decline-btn, .accept-btn, .noshow-btn, .showup-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 12px; border-radius: 12px; border: none;
      font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s;
    }
    .decline-btn { background: #fef2f2; color: #dc2626; }
    .decline-btn:hover:not(:disabled) { background: #fee2e2; }
    .accept-btn { background: #10b981; color: #fff; }
    .accept-btn:hover:not(:disabled) { background: #059669; }
    .noshow-btn { background: #fff7ed; color: #c2410c; border: 1px solid #fdba74; }
    .noshow-btn:hover:not(:disabled) { background: #ffedd5; }
    .showup-btn { background: #10b981; color: #fff; }
    .showup-btn:hover:not(:disabled) { background: #059669; }
    .decline-btn:disabled, .accept-btn:disabled,
    .noshow-btn:disabled, .showup-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .decline-btn mat-icon, .accept-btn mat-icon,
    .noshow-btn mat-icon, .showup-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Decline form */
    .decline-form {
      border: 1px solid #fca5a5; border-radius: 12px; padding: 14px;
      background: #fef2f2; display: flex; flex-direction: column; gap: 10px;
    }
    .decline-form label { font-size: 13px; font-weight: 600; color: #dc2626; }
    .decline-form textarea {
      width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #fca5a5;
      font-size: 14px; color: #1e293b; background: #fff; resize: vertical;
      outline: none; font-family: inherit; box-sizing: border-box;
    }
    .decline-form textarea:focus { border-color: #dc2626; }
    .decline-form-actions { display: flex; gap: 10px; }
    .cancel-reason-btn {
      flex: 1; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0;
      background: #fff; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer;
    }
    .confirm-decline-btn {
      flex: 2; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px; border-radius: 10px; border: none;
      background: #dc2626; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .confirm-decline-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .confirm-decline-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffReservationsComponent implements OnInit, OnDestroy {
  private readonly reservationService = inject(ReservationService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly pendingList = signal<ReservationVM[]>([]);
  readonly confirmedList = signal<ReservationVM[]>([]);
  readonly activeTab = signal<'pending' | 'confirmed'>('pending');
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly processingId = signal<number | null>(null);
  readonly decliningId = signal<number | null>(null);
  declineReason = '';

  // Track all active timers for cleanup
  private _timerIds: ReturnType<typeof setInterval>[] = [];
  private _noShowTimerIds: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    this.loadReservations();
  }

  ngOnDestroy(): void {
    this._clearAllTimers();
  }

  private _clearAllTimers(): void {
    this._timerIds.forEach(id => clearInterval(id));
    this._noShowTimerIds.forEach(id => clearTimeout(id));
    this._timerIds = [];
    this._noShowTimerIds = [];
  }

  switchTab(tab: 'pending' | 'confirmed'): void {
    this.activeTab.set(tab);
  }

  loadReservations(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this._clearAllTimers();

    forkJoin({
      pending: this.reservationService.getPendingReservations(),
      confirmed: this.reservationService.getConfirmedReservations()
    }).subscribe({
      next: ({ pending, confirmed }) => {
        this.pendingList.set(pending as ReservationVM[]);
        this.confirmedList.set(confirmed as ReservationVM[]);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load reservations.');
        this.isLoading.set(false);
      }
    });
  }

  // ── PENDING ACTIONS ──

  startDecline(id: number): void {
    this.decliningId.set(id);
    this.declineReason = '';
  }

  confirmDecline(id: number): void {
    if (!this.declineReason.trim()) return;
    this.processingId.set(id);
    this.reservationService.declineReservation(id).subscribe({
      next: () => {
        this.pendingList.update(list => list.filter(r => r.id !== id));
        this.processingId.set(null);
        this.decliningId.set(null);
        this.declineReason = '';
      },
      error: () => this.processingId.set(null)
    });
  }

  accept(res: ReservationVM): void {
    this.processingId.set(res.id);
    this.reservationService.acceptReservation(res.id).subscribe({
      next: (updated) => {
        // Move from pending to confirmed
        this.pendingList.update(list => list.filter(r => r.id !== res.id));
        const vm: ReservationVM = { ...updated, tableCapacity: this.parseCapacity(res.tableCode) };
        this.confirmedList.update(list => [vm, ...list]);
        this.processingId.set(null);
      },
      error: () => this.processingId.set(null)
    });
  }

  // ── CONFIRMED ACTIONS ──

  markArrived(res: ReservationVM): void {
    this.processingId.set(res.id);

    // Stop any existing no-show timer for this reservation
    if (res._noShowTimerId) {
      clearTimeout(res._noShowTimerId);
    }
    if (res._timerId) {
      clearInterval(res._timerId);
    }

    this.reservationService.markArrived(res.id).subscribe({
      next: (updated) => {
        // Update table status to dang_phuc_vu
        this.reservationService.updateTableStatus(res.tableId, 'dang_phuc_vu').subscribe();

        const now = new Date();
        const cap = res.tableCapacity ?? this.parseCapacity(res.tableCode);
        const maxMins = maxDurationMinutes(cap);

        const vm: ReservationVM = {
          ...res,
          ...updated,
          tableCapacity: cap,
          arrivedAt: now,
          status: 'khach_den',
          autoCancelled: false
        };

        // Start countdown timer
        const timerId = setInterval(() => {
          const elapsed = Math.floor((Date.now() - now.getTime()) / 1000 / 60);
          const remaining = maxMins - elapsed;
          if (remaining <= 0) {
            clearInterval(timerId);
            this.confirmedList.update(list =>
              list.map(r => r.id === vm.id ? { ...r, countdown: 'Time up!' } : r)
            );
          } else {
            const h = Math.floor(remaining / 60);
            const m = remaining % 60;
            const cd = h > 0 ? `${h}h ${m}m` : `${m}m`;
            this.confirmedList.update(list =>
              list.map(r => r.id === vm.id ? { ...r, countdown: cd } : r)
            );
          }
          this.cdr.markForCheck();
        }, 60000);
        this._timerIds.push(timerId);

        vm._timerId = timerId;
        vm.countdown = `${Math.floor(maxMins / 60)}h ${maxMins % 60}m`;

        this.confirmedList.update(list =>
          list.map(r => r.id === res.id ? vm : r)
        );
        this.processingId.set(null);
      },
      error: () => this.processingId.set(null)
    });
  }

  markNoShow(res: ReservationVM): void {
    this.processingId.set(res.id);
    this.reservationService.markNoShow(res.id).subscribe({
      next: (updated) => {
        const vm: ReservationVM = {
          ...res,
          ...updated,
          status: 'khach_khong_den',
          autoCancelled: false
        };

        // Start 15-min grace countdown
        const graceMins = NOSHOW_GRACE_MINUTES;
        const startedAt = Date.now();

        const countId = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startedAt) / 1000 / 60);
          const remaining = graceMins - elapsed;
          if (remaining <= 0) {
            clearInterval(countId);
            // Auto-cancel: update to da_huy
            this.reservationService.declineReservation(vm.id).subscribe();
            this.confirmedList.update(list =>
              list.map(r => r.id === vm.id ? { ...r, countdown: undefined, autoCancelled: true, status: 'da_huy' } : r)
            );
          } else {
            this.confirmedList.update(list =>
              list.map(r => r.id === vm.id ? { ...r, countdown: `${remaining}m` } : r)
            );
          }
          this.cdr.markForCheck();
        }, 60000);
        this._timerIds.push(countId);

        vm._timerId = countId;
        vm.countdown = `${graceMins}m`;

        this.confirmedList.update(list =>
          list.map(r => r.id === res.id ? vm : r)
        );
        this.processingId.set(null);
      },
      error: () => this.processingId.set(null)
    });
  }

  // ── Helpers ──

  /** Guess table capacity from tableCode naming (B01 = 2p, B02 = 4p, etc.) 
   *  — Best effort; in production this would come from the API */
  private parseCapacity(tableCode: string): number {
    // Extract numeric part and use it to guess
    // Default fallback: 4 seats
    return 4;
  }

  durationLabel(capacity: number): string {
    const mins = maxDurationMinutes(capacity);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  formatDateTime(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
