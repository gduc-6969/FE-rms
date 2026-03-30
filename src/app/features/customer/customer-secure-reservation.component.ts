import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CustomerReservationFlowService } from '../../core/services/customer-reservation-flow.service';

@Component({
  selector: 'app-customer-secure-reservation',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <section class="secure-page">
      <header class="secure-header">
        <button mat-icon-button type="button" (click)="goBack()" aria-label="Back to edit">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <h2>Confirm Booking</h2>
        <span class="placeholder" aria-hidden="true"></span>
      </header>

      <mat-card class="secure-card">
        <mat-card-content>
          @if (draft()) {
            <h3 class="summary-title">Secure Reservation Summary</h3>

            <div class="info-block">
              <span>DATE & TIME</span>
              <strong>{{ draft()!.date }}</strong>
              <strong class="time">{{ draft()!.time }}</strong>
            </div>

            <div class="split-row">
              <div class="info-block">
                <span>TABLE</span>
                <strong>{{ draft()!.table.name }}</strong>
                <small>{{ draft()!.table.area }}</small>
              </div>

              <div class="info-block">
                <span>GUESTS</span>
                <strong>{{ draft()!.guests }}</strong>
                <small>Capacity: {{ draft()!.table.capacity }}</small>
              </div>
            </div>

            <div class="address-block">
              <mat-icon>place</mat-icon>
              <div>
                <strong>123 Gourmet Street, Downtown</strong>
                <p>Please arrive 10 mins early.</p>
              </div>
            </div>

            <button class="secure-btn" mat-flat-button type="button" (click)="submitReservation()">
              CONFIRM RESERVATION
            </button>
          } @else {
            <div class="empty-state">
              <p>No reservation information. Please go back to select again.</p>
              <button mat-flat-button type="button" (click)="goBack()">Back to Reservation</button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .secure-page {
        display: grid;
        gap: 12px;
        background: #0F0F0F;
        min-height: 100vh;
        padding: 20px;
      }

      .secure-header {
        display: grid;
        grid-template-columns: 42px 1fr 42px;
        align-items: center;
      }

      .secure-header button {
        color: #F0F0F0;
      }

      .secure-header button:hover {
        color: #C5A028;
      }

      .secure-header h2 {
        margin: 0;
        text-align: center;
        color: #F0F0F0;
        font-weight: 600;
        font-size: 24px;
      }

      .placeholder {
        width: 42px;
        height: 42px;
      }

      .secure-card {
        border-radius: 16px;
        background: #1A1A1A;
        border: 1px solid #2C2C2C;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .summary-title {
        margin: 0 0 16px;
        font-size: 18px;
        color: #F0F0F0;
        font-weight: 600;
      }

      .info-block {
        background: #242424;
        border: 1px solid #2C2C2C;
        border-radius: 12px;
        padding: 14px;
        display: grid;
        gap: 4px;
      }

      .info-block span {
        font-size: 11px;
        letter-spacing: 0.1em;
        color: #A0A0A0;
        font-weight: 600;
        text-transform: uppercase;
      }

      .info-block strong {
        font-size: 32px;
        line-height: 1.12;
        color: #F0F0F0;
        font-weight: 600;
      }

      .info-block .time {
        color: #C5A028;
        font-size: 28px;
      }

      .info-block small {
        color: #A0A0A0;
        font-size: 14px;
      }

      .split-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 12px;
      }

      .address-block {
        margin-top: 12px;
        border-radius: 12px;
        padding: 14px;
        background: #242424;
        border: 1px solid #2C2C2C;
        color: #F0F0F0;
        display: flex;
        gap: 10px;
      }

      .address-block mat-icon {
        color: #C5A028;
      }

      .address-block strong {
        color: #F0F0F0;
        font-weight: 600;
      }

      .address-block p {
        margin: 4px 0 0;
        color: #A0A0A0;
        font-size: 14px;
      }

      .secure-btn {
        margin-top: 18px;
        width: 100%;
        border-radius: 12px;
        min-height: 52px;
        background: #C5A028;
        color: #0F0F0F;
        letter-spacing: 0.05em;
        font-weight: 600;
        font-size: 16px;
        text-transform: uppercase;
        transition: all 0.2s ease;
      }

      .secure-btn:hover {
        background: #D4AF37;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(197, 160, 40, 0.3);
      }

      .empty-state {
        display: grid;
        gap: 10px;
        text-align: center;
        padding: 20px;
      }

      .empty-state p {
        color: #A0A0A0;
        font-size: 15px;
      }

      .empty-state button {
        background: #C5A028;
        color: #0F0F0F;
        font-weight: 600;
        border-radius: 12px;
        transition: all 0.2s ease;
      }

      .empty-state button:hover {
        background: #D4AF37;
      }

      @media (max-width: 640px) {
        .secure-page {
          padding: 16px;
        }

        .split-row {
          grid-template-columns: 1fr;
        }

        .info-block strong {
          font-size: 26px;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerSecureReservationComponent {
  readonly draft = computed(() => this.reservationFlow.selectedDraft());

  constructor(
    private readonly reservationFlow: CustomerReservationFlowService,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router
  ) {}

  goBack(): void {
    this.router.navigateByUrl('/customer/reservation');
  }

  submitReservation(): void {
    if (!this.draft()) {
      return;
    }

    this.reservationFlow.submitReservation();
    this.snackBar.open('✅ Reservation request submitted!', 'Close', { duration: 2500 });
    this.router.navigateByUrl('/customer/home');
  }
}
