import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  CustomerReservationFlowService,
  CustomerReservation
} from '../../core/services/customer-reservation-flow.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, RouterLink],
  template: `
    <section class="profile-page">
      <header class="section-title">My Profile</header>

      <!-- Profile Info Card -->
      <mat-card class="profile-card">
        <mat-card-content>
          <div class="profile-head">
            <div class="avatar"><mat-icon>person</mat-icon></div>
            <div>
              <h2>{{ authService.fullName() ?? 'Guest' }}</h2>
              <p>Member</p>
            </div>
          </div>

          <ul class="contact-list">
            <li><mat-icon>mail</mat-icon> {{ authService.fullName() ?? 'N/A' }}</li>
          </ul>
        </mat-card-content>
      </mat-card>

      <!-- Active Reservations Card -->
      <mat-card>
        <mat-card-content>
          <h3><mat-icon>table_restaurant</mat-icon> My Reservations</h3>

          @if (reservations().length === 0) {
            <div class="empty-reservations">
              <p>No active reservations</p>
              <button mat-flat-button class="book-btn" routerLink="/customer/reservation">
                <mat-icon>add</mat-icon>
                Book a Table
              </button>
            </div>
          } @else {
            <div class="reservations-list">
              @for (reservation of reservations(); track reservation.id) {
                <div class="reservation-item" [class]="reservation.status">
                  <div class="reservation-info">
                    <div class="reservation-main">
                      <strong>{{ reservation.table.name }}</strong>
                      <span class="status-badge" [class]="reservation.status">
                        @switch (reservation.status) {
                          @case ('pending') { Pending }
                          @case ('accepted') { Accepted }
                          @case ('denied') { Denied }
                        }
                      </span>
                    </div>
                    <div class="reservation-details">
                      <span><mat-icon>event</mat-icon> {{ formatDate(reservation.date) }}</span>
                      <span><mat-icon>schedule</mat-icon> {{ reservation.time }}</span>
                      <span><mat-icon>people</mat-icon> {{ reservation.guests }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
            <button mat-stroked-button class="new-reservation-btn" routerLink="/customer/reservation">
              <mat-icon>add</mat-icon>
              New Reservation
            </button>
          }
        </mat-card-content>
      </mat-card>

      <!-- Reservation History Card -->
      <mat-card>
        <mat-card-content>
          <h3><mat-icon>history</mat-icon> Reservation History</h3>

          <div class="history-item">
            <div>
              <p>March 10, 2026</p>
              <small>7:00 PM · 2 guests</small>
            </div>
            <button mat-flat-button color="primary">Book Again</button>
          </div>

          <div class="history-item">
            <div>
              <p>February 25, 2026</p>
              <small>8:30 PM · 4 guests</small>
            </div>
            <button mat-flat-button color="primary">Book Again</button>
          </div>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .profile-page {
        display: grid;
        gap: 16px;
        background: #0F0F0F;
        min-height: 100vh;
        padding: 20px;
      }

      .section-title {
        background: #1A1A1A;
        border: 1px solid #2C2C2C;
        border-radius: 16px;
        padding: 16px;
        font-size: 28px;
        color: #F0F0F0;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      mat-card {
        border-radius: 16px;
        background: #1A1A1A;
        border: 1px solid #2C2C2C;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .profile-head {
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .avatar {
        width: 88px;
        height: 88px;
        border-radius: 12px;
        background: #C5A028;
        color: #0F0F0F;
        display: grid;
        place-items: center;
      }

      .avatar mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #0F0F0F;
      }

      .profile-head h2 {
        color: #F0F0F0;
        margin: 0;
        font-weight: 600;
      }

      .profile-head p {
        margin: 4px 0 0;
        color: #A0A0A0;
        font-size: 14px;
      }

      .contact-list {
        list-style: none;
        padding: 0;
        margin: 16px 0 0;
        display: grid;
        gap: 12px;
      }

      .contact-list li {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #F0F0F0;
        font-size: 14px;
      }

      .contact-list mat-icon {
        color: #C5A028;
      }

      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #F0F0F0;
        font-weight: 600;
        margin: 0 0 16px;
      }

      h3 mat-icon {
        color: #C5A028;
      }

      /* Active Reservations */
      .empty-reservations {
        text-align: center;
        padding: 24px;
      }

      .empty-reservations p {
        color: #A0A0A0;
        margin: 0 0 16px;
      }

      .book-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #C5A028;
        color: #0F0F0F;
        border-radius: 12px;
        font-weight: 600;
        padding: 12px 24px;
      }

      .reservations-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .reservation-item {
        border-radius: 12px;
        background: #242424;
        border: 1px solid #2C2C2C;
        padding: 14px;
        transition: all 0.2s ease;
      }

      .reservation-item.pending {
        border-left: 4px solid #C5A028;
      }

      .reservation-item.accepted {
        border-left: 4px solid #2BAE66;
      }

      .reservation-item.denied {
        border-left: 4px solid #E06C6C;
      }

      .reservation-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .reservation-main strong {
        color: #F0F0F0;
        font-size: 16px;
      }

      .status-badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
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

      .reservation-details {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
      }

      .reservation-details span {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #A0A0A0;
        font-size: 13px;
      }

      .reservation-details mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .new-reservation-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        margin-top: 16px;
        padding: 12px;
        border-radius: 12px;
        border: 1px solid #C5A028;
        color: #C5A028;
        font-weight: 600;
      }

      .new-reservation-btn:hover {
        background: rgba(197, 160, 40, 0.1);
      }

      /* History */
      .history-item {
        border-radius: 12px;
        background: #242424;
        border: 1px solid #2C2C2C;
        padding: 14px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        transition: all 0.2s ease;
        margin-bottom: 12px;
      }

      .history-item:last-child {
        margin-bottom: 0;
      }

      .history-item:hover {
        border-color: #C5A028;
      }

      .history-item p {
        margin: 0;
        color: #F0F0F0;
        font-weight: 600;
      }

      .history-item small {
        color: #A0A0A0;
        font-size: 14px;
      }

      .history-item button {
        background: #C5A028;
        color: #0F0F0F;
        font-weight: 600;
        border-radius: 12px;
        transition: all 0.2s ease;
      }

      .history-item button:hover {
        background: #D4AF37;
      }

      @media (max-width: 640px) {
        .profile-page {
          padding: 16px;
        }

        .history-item {
          flex-direction: column;
          align-items: flex-start;
        }

        .history-item button {
          width: 100%;
        }

        .reservation-details {
          flex-direction: column;
          gap: 8px;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerProfileComponent {
  readonly authService = inject(AuthService);
  readonly reservations = this.reservationFlow.myReservations;

  constructor(private readonly reservationFlow: CustomerReservationFlowService) {}

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
}
