import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ReservationService } from '../../core/services/reservation.service';
import { ReservationResponse } from '../../core/models/app.models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, RouterLink],
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
          <div class="header-refresh">
            <h3><mat-icon>table_restaurant</mat-icon> My Reservations</h3>
            <button mat-icon-button class="refresh-btn" (click)="loadMyReservations()" [disabled]="isLoading()" title="Reload data">
              <mat-icon [class.spinning]="isLoading()">refresh</mat-icon>
            </button>
          </div>

          @if (isLoading()) {
            <div class="empty-reservations">
              <p>Loading reservations...</p>
            </div>
          } @else if (activeReservations().length === 0) {
            <div class="empty-reservations">
              <p>No active reservations</p>
              <button mat-flat-button class="book-btn" routerLink="/customer/reservation">
                <mat-icon>add</mat-icon>
                Book a Table
              </button>
            </div>
          } @else {
            <div class="reservations-list">
              @for (reservation of activeReservations(); track reservation.id) {
                <div class="reservation-item" [class]="getStatusBadgeClass(reservation.status)">
                  <div class="reservation-info">
                    <div class="reservation-main">
                      <strong>Table {{ reservation.tableCode }}</strong>
                      <span class="status-badge" [class]="getStatusBadgeClass(reservation.status)">
                        {{ getStatusLabel(reservation.status) }}
                      </span>
                    </div>
                    <div class="reservation-details">
                      <span><mat-icon>event</mat-icon> {{ formatDate(reservation.reservationTime) }}</span>
                      <span><mat-icon>schedule</mat-icon> {{ formatTime(reservation.reservationTime) }}</span>
                      <span><mat-icon>people</mat-icon> {{ reservation.numberOfGuests }} guests</span>
                    </div>
                    <!-- Status message -->
                    <div class="status-message" [class]="getStatusBadgeClass(reservation.status)">
                      <mat-icon>{{ getStatusIcon(reservation.status) }}</mat-icon>
                      <span>{{ getStatusMessage(reservation.status) }}</span>
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
          
          @if (isLoading()) {
            <p style="color:#A0A0A0">Loading history...</p>
          } @else if (historyReservations().length === 0) {
            <p style="color:#A0A0A0">No past reservations.</p>
          } @else {
            @for (reservation of historyReservations(); track reservation.id) {
              <div class="history-item">
                <div>
                  <p>{{ formatDate(reservation.reservationTime) }}</p>
                  <small>{{ formatTime(reservation.reservationTime) }} · {{ reservation.numberOfGuests }} guests</small>
                  <span class="status-badge history-badge" [class]="getStatusBadgeClass(reservation.status)">
                    {{ getStatusLabel(reservation.status) }}
                  </span>
                </div>
                <!-- Re-book functionality can potentially pre-fill the form later -->
                <button mat-flat-button color="primary" routerLink="/customer/reservation">Book Again</button>
              </div>
            }
          }
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

      .header-refresh {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .header-refresh h3 {
        margin: 0;
      }
      .refresh-btn {
        color: #C5A028;
      }
      @keyframes spin { 100% { transform: rotate(360deg); } }
      .spinning { animation: spin 1s linear infinite; }

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
      .book-btn:hover { background: #D4AF37; }

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
      
      .history-badge {
        margin-left: 10px;
        display: inline-block;
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

      .status-message {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 12px;
        padding: 10px 12px;
        border-radius: 10px;
        font-size: 13px;
        line-height: 1.5;
      }

      .status-message.pending {
        background: rgba(197, 160, 40, 0.08);
        color: #C5A028;
        border: 1px solid rgba(197, 160, 40, 0.2);
      }

      .status-message.accepted {
        background: rgba(43, 174, 102, 0.08);
        color: #2BAE66;
        border: 1px solid rgba(43, 174, 102, 0.2);
      }

      .status-message mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        margin-top: 1px;
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
        background: transparent;
        cursor: pointer;
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
        margin: 0 0 6px 0;
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
        padding: 8px 16px;
        border: none;
        cursor: pointer;
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
export class CustomerProfileComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly reservationService = inject(ReservationService);

  activeReservations = signal<ReservationResponse[]>([]);
  historyReservations = signal<ReservationResponse[]>([]);
  isLoading = signal(true);

  private focusHandler = () => this.loadMyReservations();
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.loadMyReservations();
    window.addEventListener('focus', this.focusHandler);
    this.refreshInterval = setInterval(() => this.loadMyReservations(), 30_000);
  }

  ngOnDestroy() {
    window.removeEventListener('focus', this.focusHandler);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadMyReservations() {
    this.isLoading.set(true);
    
    const userIdStr = localStorage.getItem('rms-user-id');
    const customerId = userIdStr && !isNaN(Number(userIdStr)) ? Number(userIdStr) : null;
    if (!customerId) {
      this.isLoading.set(false);
      this.activeReservations.set([]);
      this.historyReservations.set([]);
      return;
    }

    const key = `rms-my-reservation-ids-${customerId}`;
    let idsJson = localStorage.getItem(key);

    // MIGRATION: khôi phục tạm từ key cũ nếu key mới chưa có
    if (!idsJson) {
      const oldJson = localStorage.getItem('rms-my-reservation-ids');
      if (oldJson) {
        localStorage.setItem(key, oldJson);
        idsJson = oldJson;
      }
    }

    if (!idsJson) {
      this.isLoading.set(false);
      this.activeReservations.set([]);
      this.historyReservations.set([]);
      return;
    }

    let idsArray: number[] = [];
    try {
      idsArray = JSON.parse(idsJson);
    } catch {
      this.isLoading.set(false);
      this.activeReservations.set([]);
      this.historyReservations.set([]);
      return;
    }

    if (idsArray.length === 0) {
      this.isLoading.set(false);
      this.activeReservations.set([]);
      this.historyReservations.set([]);
      return;
    }

    // Load each reservation ID individually
    const requests = idsArray.map(id =>
      this.reservationService.getReservationById(id).pipe(
        catchError(() => of(null)) // Ignore errors for deleted or invalid reservations
      )
    );

    forkJoin(requests).subscribe(results => {
      // Filter out nulls and ensure reservation belongs to current customer (phòng khi type string/number)
      const validReservations = results.filter((r): r is ReservationResponse => r !== null && Number(r.customerId) === customerId);
      
      // Categorize into Active (cho_xac_nhan, da_xac_nhan, khach_den) and History (others)
      const active = validReservations.filter(r =>
        r.status === 'cho_xac_nhan' || r.status === 'da_xac_nhan' || r.status === 'khach_den'
      );
      const history = validReservations.filter(r => r.status === 'da_huy' || r.status === 'khach_khong_den');

      // Sort by newest reservation time (descending)
      active.sort((a, b) => new Date(b.reservationTime).getTime() - new Date(a.reservationTime).getTime());
      history.sort((a, b) => new Date(b.reservationTime).getTime() - new Date(a.reservationTime).getTime());

      this.activeReservations.set(active);
      this.historyReservations.set(history);
      this.isLoading.set(false);
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'cho_xac_nhan': return 'pending';
      case 'da_xac_nhan': return 'accepted';
      case 'khach_den': return 'accepted';
      case 'da_huy': return 'denied';
      case 'khach_khong_den': return 'denied';
      default: return 'pending';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'cho_xac_nhan': return 'Pending';
      case 'da_xac_nhan': return 'Confirmed ✓';
      case 'khach_den': return 'Seated';
      case 'da_huy': return 'Cancelled';
      case 'khach_khong_den': return 'No Show';
      default: return 'Pending';
    }
  }

  getStatusMessage(status: string): string {
    switch (status) {
      case 'cho_xac_nhan': return 'Your booking is being reviewed by our staff. We will confirm soon!';
      case 'da_xac_nhan': return 'Great news! Your table has been confirmed. See you soon!';
      case 'khach_den': return 'Welcome! Enjoy your meal.';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'cho_xac_nhan': return 'hourglass_top';
      case 'da_xac_nhan': return 'check_circle';
      case 'khach_den': return 'restaurant';
      default: return 'info';
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    let h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    return `${h}:${m} ${ampm}`;
  }
}
