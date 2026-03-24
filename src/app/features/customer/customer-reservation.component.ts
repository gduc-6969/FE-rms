import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import {
  CustomerReservationFlowService,
  ReservationTableOption
} from '../../core/services/customer-reservation-flow.service';

@Component({
  selector: 'app-customer-reservation',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <section class="reservation-flow">
      <header class="heading">
        <h2>Đặt bàn theo 3 bước</h2>
        <p>Chọn theo thứ tự từ trên xuống: Số khách → Ngày/Giờ → Bàn.</p>
      </header>

      <form [formGroup]="form" class="flow-form">

        <mat-card>
          <mat-card-content>
            <div class="step-title">
              <span>01</span>
              <h3>Chọn số người</h3>
            </div>

            <div class="guest-options">
              @for (guest of guestOptions; track guest) {
                <button
                  mat-stroked-button
                  type="button"
                  class="guest-chip"
                  [class.active-chip]="form.controls.guests.value === guest"
                  (click)="selectGuests(guest)">
                  {{ guest }} người
                </button>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <div class="step-title">
              <span>02</span>
              <h3>Chọn ngày & giờ</h3>
            </div>

            <div class="time-grid">
              <mat-form-field appearance="outline">
                <mat-label>Ngày</mat-label>
                <input matInput type="date" formControlName="date" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Giờ</mat-label>
                <input matInput type="time" formControlName="time" />
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <div class="step-title">
              <span>03</span>
              <h3>Chọn bàn trên layout</h3>
            </div>

            <div class="table-layout">
              @for (table of tableLayout(); track table.id) {
                <button
                  type="button"
                  class="table-tile"
                  [class.selected-table]="form.controls.tableId.value === table.id"
                  [class.blocked-table]="!isTableSelectable(table)"
                  [disabled]="!isTableSelectable(table)"
                  (click)="selectTable(table.id)">
                  <strong>{{ table.name }}</strong>
                  <small>{{ table.area }}</small>
                  <span>Sức chứa: {{ table.capacity }}</span>
                  <em>{{ tableStatusLabel(table) }}</em>
                </button>
              }
            </div>

            @if (!hasSelectableTable()) {
              <p class="hint">Không có bàn phù hợp với số khách đã chọn. Vui lòng đổi số người.</p>
            }
          </mat-card-content>
        </mat-card>

        <div class="confirm-bar">
          <button mat-flat-button type="button" [disabled]="!canConfirm()" (click)="goToSecureReservation()">
            Confirm & đi tới Secure Reservation
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [
    `
      .reservation-flow {
        display: grid;
        gap: 14px;
      }

      .flow-form {
        display: grid;
        gap: 14px;
      }

      .heading h2 {
        margin: 0;
      }

      .heading p {
        margin: 6px 0 0;
        color: #64748b;
      }

      .step-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }

      .step-title span {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        background: #ffedd5;
        color: #c2410c;
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 13px;
      }

      .step-title h3 {
        margin: 0;
        font-size: 17px;
      }

      .guest-options {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .guest-chip {
        border-radius: 999px;
      }

      .active-chip {
        background: #ffedd5;
        border-color: #fdba74;
        color: #9a3412;
      }

      .time-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
      }

      .table-layout {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
      }

      .table-tile {
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        background: #ffffff;
        padding: 12px;
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 4px;
        cursor: pointer;
      }

      .table-tile strong {
        font-size: 16px;
      }

      .table-tile small,
      .table-tile span,
      .table-tile em {
        color: #64748b;
        font-style: normal;
        font-size: 12px;
      }

      .selected-table {
        border-color: #fb923c;
        background: #fff7ed;
      }

      .blocked-table {
        opacity: 0.52;
        cursor: not-allowed;
      }

      .hint {
        margin: 12px 0 0;
        color: #b45309;
        font-size: 13px;
      }

      .confirm-bar {
        display: flex;
        justify-content: center;
      }

      .confirm-bar button {
        min-width: 280px;
        border-radius: 999px;
        background: #1f2937;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerReservationComponent {
  readonly form = this.fb.nonNullable.group({
    guests: [2, [Validators.required, Validators.min(1), Validators.max(20)]],
    date: ['', [Validators.required]],
    time: ['', [Validators.required]],
    tableId: [0, [Validators.required, Validators.min(1)]]
  });

  readonly guestOptions = [1, 2, 3, 4, 5, 6, 8, 10];
  readonly tableLayout = this.reservationFlow.tableLayout;

  readonly hasSelectableTable = computed(() => this.tableLayout().some(table => this.isTableSelectable(table)));

  readonly canConfirm = computed(() => {
    return (
      this.form.controls.date.valid &&
      this.form.controls.time.valid &&
      this.form.controls.tableId.valid &&
      this.hasSelectableTable()
    );
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly reservationFlow: CustomerReservationFlowService
  ) {}

  selectGuests(guests: number): void {
    this.form.controls.guests.setValue(guests);

    const selectedTableId = this.form.controls.tableId.value;
    const selectedTable = this.tableLayout().find(table => table.id === selectedTableId);

    if (selectedTable && !this.isTableSelectable(selectedTable)) {
      this.form.controls.tableId.setValue(0);
    }
  }

  selectTable(tableId: number): void {
    this.form.controls.tableId.setValue(tableId);
  }

  tableStatusLabel(table: ReservationTableOption): string {
    if (table.status === 'disabled') {
      return 'Không khả dụng';
    }

    if (table.status === 'occupied') {
      return 'Đang được sử dụng';
    }

    return 'Sẵn sàng';
  }

  isTableSelectable(table: ReservationTableOption): boolean {
    return table.status === 'available' && table.capacity >= this.form.controls.guests.value;
  }

  goToSecureReservation(): void {
    if (!this.canConfirm()) {
      return;
    }

    const selectedTable = this.tableLayout().find(table => table.id === this.form.controls.tableId.value);
    if (!selectedTable) {
      return;
    }

    this.reservationFlow.setDraft({
      guests: this.form.controls.guests.value,
      date: this.form.controls.date.value,
      time: this.form.controls.time.value,
      table: selectedTable
    });

    this.router.navigateByUrl('/customer/reservation/secure');
  }
}
