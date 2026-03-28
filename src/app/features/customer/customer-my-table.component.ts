import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import {
  CustomerReservationFlowService,
  CustomerReservation
} from '../../core/services/customer-reservation-flow.service';

@Component({
  selector: 'app-customer-my-table',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, RouterLink],
  template: `
    <section class="my-table-page">
      <header class="page-header">
        <h1>My Reservations</h1>
        <p class="subtitle">Track your booking status</p>
      </header>

      @if (reservations().length === 0) {
        <div class="empty-state">
          <mat-icon>table_restaurant</mat-icon>
          <h3>No reservations yet</h3>
          <p>Book a table to see your reservations here</p>
          <button mat-flat-button class="book-btn" routerLink="/customer/reservation">
            <mat-icon>add</mat-icon>
            Book a Table
          </button>
        </div>
      } @else {
        <div class="reservations-list">
          @for (reservation of reservations(); track reservation.id) {
            <mat-card class="reservation-card" [class]="reservation.status">
              <div class="status-badge" [class]="reservation.status">
                @switch (reservation.status) {
                  @case ('pending') {
                    <mat-icon>schedule</mat-icon>
                    <span>Pending</span>
                  }
                  @case ('accepted') {
                    <mat-icon>check_circle</mat-icon>
                    <span>Accepted</span>
                  }
                  @case ('denied') {
                    <mat-icon>cancel</mat-icon>
                    <span>Denied</span>
                  }
                }
              </div>

              <div class="reservation-details">
                <div class="detail-row">
                  <mat-icon>table_restaurant</mat-icon>
                  <span>{{ reservation.table.name }}</span>
                </div>
                <div class="detail-row">
                  <mat-icon>event</mat-icon>
                  <span>{{ formatDate(reservation.date) }}</span>
                </div>
                <div class="detail-row">
                  <mat-icon>schedule</mat-icon>
                  <span>{{ reservation.time }}</span>
                </div>
                <div class="detail-row">
                  <mat-icon>people</mat-icon>
                  <span>{{ reservation.guests }} {{ reservation.guests === 1 ? 'guest' : 'guests' }}</span>
                </div>
              </div>

              <div class="reservation-footer">
                <span class="area-tag">{{ reservation.table.area }}</span>
                <span class="created-at">Booked {{ formatCreatedAt(reservation.createdAt) }}</span>
              </div>
            </mat-card>
          }
        </div>

        <button mat-flat-button class="new-booking-btn" routerLink="/customer/reservation">
          <mat-icon>add</mat-icon>
          New Reservation
        </button>
      }
    </section>
  `,
  styles: [`
    .my-table-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
      background: #0F0F0F;
      min-height: 100vh;
      padding: 20px;
    }

    .page-header {
      text-align: center;
      padding: 8px 0 16px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #F0F0F0;
    }

    .subtitle {
      margin: 8px 0 0;
      color: #A0A0A0;
      font-size: 14px;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #2C2C2C;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #F0F0F0;
    }

    .empty-state p {
      margin: 8px 0 24px;
      color: #A0A0A0;
      font-size: 14px;
    }

    .book-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 24px;
      background: #C5A028;
      color: #0F0F0F;
      border-radius: 12px;
      font-weight: 600;
      border: none;
      cursor: pointer;
    }

    /* Reservations List */
    .reservations-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .reservation-card {
      background: #1A1A1A;
      border: 1px solid #2C2C2C;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: all 0.2s ease;
    }

    .reservation-card.pending {
      border-left: 4px solid #C5A028;
    }

    .reservation-card.accepted {
      border-left: 4px solid #2BAE66;
    }

    .reservation-card.denied {
      border-left: 4px solid #E06C6C;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      width: fit-content;
      font-weight: 600;
      font-size: 14px;
    }

    .status-badge.pending {
      background: rgba(197, 160, 40, 0.15);
      color: #C5A028;
    }

    .status-badge.accepted {
      background: rgba(43, 174, 102, 0.15);
      color: #2BAE66;
    }

    .status-badge.denied {
      background: rgba(224, 108, 108, 0.15);
      color: #E06C6C;
    }

    .status-badge mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .reservation-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #F0F0F0;
      font-size: 14px;
    }

    .detail-row mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #A0A0A0;
    }

    .reservation-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #2C2C2C;
    }

    .area-tag {
      padding: 4px 12px;
      background: #242424;
      border-radius: 12px;
      font-size: 12px;
      color: #A0A0A0;
    }

    .created-at {
      font-size: 12px;
      color: #5A5A5A;
    }

    .new-booking-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 16px;
      background: #C5A028;
      color: #0F0F0F;
      border-radius: 12px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      margin-top: 8px;
    }

    .new-booking-btn:hover {
      background: #D4AF37;
    }

    @media (max-width: 480px) {
      .reservation-details {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerMyTableComponent {
  readonly reservations = this.reservationFlow.myReservations;

  constructor(private readonly reservationFlow: CustomerReservationFlowService) {}

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  }

  formatCreatedAt(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
