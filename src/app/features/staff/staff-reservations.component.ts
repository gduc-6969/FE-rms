import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ReservationService } from '../../core/services/reservation.service';
import { ReservationResponse } from '../../core/models/app.models';

@Component({
  selector: 'app-staff-reservations',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <section class="res-page">
      <div class="page-head">
        <div>
          <h2>Reservations</h2>
          <p>Review and manage customer booking requests.</p>
        </div>
        <button class="refresh-btn" (click)="loadReservations()">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
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
      } @else if (reservations().length === 0) {
        <div class="empty-state">
          <mat-icon>event_available</mat-icon>
          <p>No pending reservations</p>
          <small>All caught up! New bookings will appear here.</small>
        </div>
      } @else {
        <div class="res-list">
          @for (res of reservations(); track res.id) {
            <div class="res-card" [class.processing]="processingId() === res.id">
              <div class="res-header">
                <span class="res-id">#{{ res.id }}</span>
                <span class="res-status">Pending</span>
              </div>

              <div class="res-body">
                <div class="res-row">
                  <mat-icon>person</mat-icon>
                  <span>{{ res.customerName }}</span>
                </div>
                <div class="res-row">
                  <mat-icon>table_restaurant</mat-icon>
                  <span>{{ res.tableCode }} · {{ res.numberOfGuests }} guests</span>
                </div>
                <div class="res-row">
                  <mat-icon>schedule</mat-icon>
                  <span>{{ formatDateTime(res.reservationTime) }}</span>
                </div>
                @if (res.note) {
                  <div class="res-row note">
                    <mat-icon>sticky_note_2</mat-icon>
                    <span>{{ res.note }}</span>
                  </div>
                }
                <div class="res-row created">
                  <mat-icon>history</mat-icon>
                  <span>Booked {{ formatDateTime(res.createdAt) }}</span>
                </div>
              </div>

              <div class="res-actions">
                <button class="decline-btn" [disabled]="processingId() === res.id"
                  (click)="decline(res.id)">
                  <mat-icon>close</mat-icon> Decline
                </button>
                <button class="accept-btn" [disabled]="processingId() === res.id"
                  (click)="accept(res.id)">
                  <mat-icon>check</mat-icon> Accept
                </button>
              </div>
            </div>
          }
        </div>
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

    .refresh-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 18px; border-radius: 12px; border: 1px solid #e2e8f0;
      background: #fff; font-size: 14px; font-weight: 600; color: #475569;
      cursor: pointer; transition: all 0.15s;
    }
    .refresh-btn:hover { border-color: #ff6a33; color: #ff6a33; }
    .refresh-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

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

    .res-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;
    }
    .res-id { font-size: 13px; font-weight: 700; color: #64748b; }
    .res-status {
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
      background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe;
    }

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
    .decline-btn, .accept-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 12px; border-radius: 12px; border: none;
      font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.15s;
    }
    .decline-btn {
      background: #fef2f2; color: #dc2626;
    }
    .decline-btn:hover:not(:disabled) { background: #fee2e2; }
    .accept-btn {
      background: #10b981; color: #fff;
    }
    .accept-btn:hover:not(:disabled) { background: #059669; }
    .decline-btn:disabled, .accept-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .decline-btn mat-icon, .accept-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffReservationsComponent implements OnInit {
  private readonly reservationService = inject(ReservationService);

  readonly reservations = signal<ReservationResponse[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly processingId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.reservationService.getPendingReservations().subscribe({
      next: (data) => {
        this.reservations.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load reservations.');
        this.isLoading.set(false);
      }
    });
  }

  accept(id: number): void {
    this.processingId.set(id);
    this.reservationService.acceptReservation(id).subscribe({
      next: () => {
        this.reservations.update(list => list.filter(r => r.id !== id));
        this.processingId.set(null);
      },
      error: () => this.processingId.set(null)
    });
  }

  decline(id: number): void {
    this.processingId.set(id);
    this.reservationService.declineReservation(id).subscribe({
      next: () => {
        this.reservations.update(list => list.filter(r => r.id !== id));
        this.processingId.set(null);
      },
      error: () => this.processingId.set(null)
    });
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
