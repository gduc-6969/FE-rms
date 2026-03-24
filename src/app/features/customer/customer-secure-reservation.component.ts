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
        <button mat-icon-button type="button" (click)="goBack()" aria-label="Quay lại chỉnh sửa">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <h2>Confirm Booking</h2>
        <span class="placeholder" aria-hidden="true"></span>
      </header>

      <mat-card class="secure-card">
        <mat-card-content>
          @if (draft()) {
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
              SECURE RESERVATION
            </button>
          } @else {
            <div class="empty-state">
              <p>Không có thông tin đặt bàn. Vui lòng quay lại để chọn lại.</p>
              <button mat-flat-button type="button" (click)="goBack()">Quay lại đặt bàn</button>
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
      }

      .secure-header {
        display: grid;
        grid-template-columns: 42px 1fr 42px;
        align-items: center;
      }

      .secure-header h2 {
        margin: 0;
        text-align: center;
      }

      .placeholder {
        width: 42px;
        height: 42px;
      }

      .secure-card {
        border-radius: 22px;
      }

      .info-block {
        background: #f1f5f9;
        border-radius: 18px;
        padding: 14px;
        display: grid;
        gap: 2px;
      }

      .info-block span {
        font-size: 12px;
        letter-spacing: 1px;
        color: #64748b;
        font-weight: 700;
      }

      .info-block strong {
        font-size: 32px;
        line-height: 1.12;
      }

      .info-block .time {
        color: #ea580c;
        font-size: 28px;
      }

      .info-block small {
        color: #64748b;
      }

      .split-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 12px;
      }

      .address-block {
        margin-top: 12px;
        border-radius: 16px;
        padding: 14px;
        background: #fff7ed;
        color: #9a3412;
        display: flex;
        gap: 10px;
      }

      .address-block p {
        margin: 4px 0 0;
        color: #64748b;
      }

      .secure-btn {
        margin-top: 14px;
        width: 100%;
        border-radius: 999px;
        min-height: 52px;
        background: #1f2937;
        letter-spacing: 1.5px;
      }

      .empty-state {
        display: grid;
        gap: 10px;
      }

      @media (max-width: 640px) {
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

    this.snackBar.open('✅ Yêu cầu đặt bàn đã được gửi (mock)!', 'Đóng', { duration: 2500 });
    this.reservationFlow.clearDraft();
    this.router.navigateByUrl('/customer/home');
  }
}
