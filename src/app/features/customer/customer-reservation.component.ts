import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import {
  CustomerReservationFlowService,
  ReservationTableOption
} from '../../core/services/customer-reservation-flow.service';

interface DateOption {
  date: Date;
  dayName: string;
  dayNum: number;
  monthName: string;
  value: string;
  isToday: boolean;
}

interface TimeSlot {
  label: string;
  value: string;
  available: boolean;
  popular?: boolean;
  sessionId: 'lunch' | 'dinner';
  sessionClosed: boolean;
}

interface SessionGroup {
  id: 'lunch' | 'dinner';
  label: string;
  closed: boolean;
  slots: TimeSlot[];
}

const SERVICE_SESSIONS = [
  { id: 'lunch' as const,  label: 'Lunch Session',  start: 10, end: 14, cutoffHour: 9,  cutoffMin: 30 },
  { id: 'dinner' as const, label: 'Dinner Session', start: 17, end: 22, cutoffHour: 16, cutoffMin: 0  }
];

@Component({
  selector: 'app-customer-reservation',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <section class="reservation-flow">
      <!-- Header -->
      <header class="heading">
        <h2>Book a Table</h2>
      </header>

      <!-- Horizontal Stepper -->
      <nav class="stepper">
        @for (step of steps; track step.id; let i = $index) {
          <button
            type="button"
            class="step-btn"
            [class.active]="currentStep() === step.id"
            [class.completed]="isStepCompleted(step.id)"
            [disabled]="!canAccessStep(step.id)"
            (click)="goToStep(step.id)">
            <span class="step-num">{{ i + 1 }}</span>
            <span class="step-label">{{ step.label }}</span>
          </button>
          @if (i < steps.length - 1) {
            <div class="step-connector" [class.completed]="isStepCompleted(step.id)"></div>
          }
        }
      </nav>

      <form [formGroup]="form" class="flow-form">

        <!-- Step 1: Guests -->
        @if (currentStep() === 'guests') {
          <mat-card class="step-card">
            <mat-card-content>
              <h3 class="card-title">How many guests?</h3>

              <!-- Stepper Control -->
              <div class="guest-stepper">
                <button
                  type="button"
                  class="stepper-btn"
                  [disabled]="form.controls.guests.value <= 1"
                  (click)="decrementGuests()"
                  aria-label="Decrease guests">
                  <mat-icon>remove</mat-icon>
                </button>
                <span class="guest-count">{{ form.controls.guests.value }} {{ form.controls.guests.value === 1 ? 'guest' : 'guests' }}</span>
                <button
                  type="button"
                  class="stepper-btn"
                  [disabled]="form.controls.guests.value >= 20"
                  (click)="incrementGuests()"
                  aria-label="Increase guests">
                  <mat-icon>add</mat-icon>
                </button>
              </div>

              <!-- Quick Select Chips -->
              <div class="quick-select">
                <span class="quick-label">Quick select:</span>
                @for (size of quickSizes; track size) {
                  <button
                    type="button"
                    class="quick-chip"
                    [class.active]="form.controls.guests.value === size"
                    (click)="selectGuests(size)">
                    {{ size }}
                  </button>
                }
              </div>

              @if (capacityWarning()) {
                <p class="capacity-warning">
                  <mat-icon>warning</mat-icon>
                  {{ capacityWarning() }}
                </p>
              }

              <button type="button" class="next-btn" (click)="goToStep('datetime')">
                Continue
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </mat-card-content>
          </mat-card>
        }

        <!-- Step 2: Date & Time -->
        @if (currentStep() === 'datetime') {
          <mat-card class="step-card">
            <mat-card-content>
              <h3 class="card-title">When would you like to dine?</h3>

              <!-- Date Selection -->
              <div class="date-section">
                <label class="section-label">Select Date</label>
                <div class="date-chips">
                  @for (d of dateOptions; track d.value) {
                    <button
                      type="button"
                      class="date-chip"
                      [class.active]="form.controls.date.value === d.value"
                      [class.today]="d.isToday"
                      (click)="selectDate(d.value)">
                      <span class="day-name">{{ d.dayName }}</span>
                      <span class="day-num">{{ d.dayNum }}</span>
                      <span class="month-name">{{ d.monthName }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Time Selection -->
              <div class="time-section">
                <label class="section-label">Select Time</label>
                @for (session of sessionedTimeSlots(); track session.id) {
                  <div class="session-group">
                    <div class="session-header">
                      <span class="session-name">{{ session.label }}</span>
                      @if (session.closed) {
                        <span class="session-closed-badge">Booking Closed</span>
                      }
                    </div>
                    <div class="time-chips">
                      @for (slot of session.slots; track slot.value) {
                        <button
                          type="button"
                          class="time-chip"
                          [class.active]="form.controls.time.value === slot.value"
                          [class.unavailable]="!slot.available"
                          [class.popular]="slot.popular"
                          [disabled]="!slot.available"
                          (click)="selectTime(slot.value)">
                          {{ slot.label }}
                          @if (slot.popular) {
                            <span class="popular-badge">Popular</span>
                          }
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>

              <button
                type="button"
                class="next-btn"
                [disabled]="!form.controls.date.value || !form.controls.time.value"
                (click)="goToStep('table')">
                Continue
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </mat-card-content>
          </mat-card>
        }

        <!-- Step 3: Table Selection -->
        @if (currentStep() === 'table') {
          <mat-card class="step-card">
            <mat-card-content>
              <h3 class="card-title">Choose your table</h3>

              <!-- Area Filter -->
              <div class="area-filter">
                @for (area of tableAreas; track area) {
                  <button
                    type="button"
                    class="filter-chip"
                    [class.active]="selectedArea() === area"
                    (click)="selectedArea.set(area)">
                    {{ area }}
                  </button>
                }
              </div>

              <!-- Floor Plan Grid -->
              <div class="floor-plan">
                @for (table of filteredTables(); track table.id) {
                  <button
                    type="button"
                    class="table-card"
                    [class.available]="isTableSelectable(table)"
                    [class.selected]="form.controls.tableId.value === table.id"
                    [class.occupied]="table.status === 'occupied'"
                    [class.disabled]="table.status === 'disabled'"
                    [disabled]="!isTableSelectable(table)"
                    (click)="selectTable(table.id)"
                    [attr.aria-label]="'Table ' + table.name + ', capacity ' + table.capacity + ', ' + tableStatusLabel(table)">
                    <div class="table-icon">
                      <mat-icon>table_restaurant</mat-icon>
                    </div>
                    <strong class="table-name">{{ table.name }}</strong>
                    <div class="table-capacity">
                      <mat-icon>people</mat-icon>
                      <span>{{ table.capacity }}</span>
                    </div>
                    <span class="table-status">{{ tableStatusLabel(table) }}</span>
                    @if (form.controls.tableId.value === table.id) {
                      <mat-icon class="check-icon">check_circle</mat-icon>
                    }
                  </button>
                }
              </div>

              @if (!hasSelectableTable()) {
                <p class="hint">
                  <mat-icon>info</mat-icon>
                  No tables for {{ form.controls.guests.value }} guests at {{ form.controls.time.value }}. Try a different time or guest count.
                </p>
              }
            </mat-card-content>
          </mat-card>
        }
      </form>

      <!-- Sticky Footer -->
      <footer class="sticky-footer" [class.visible]="showSummary()">
        <div class="summary">
          @if (form.controls.guests.value) {
            <span class="summary-item">
              <mat-icon>people</mat-icon>
              {{ form.controls.guests.value }} {{ form.controls.guests.value === 1 ? 'guest' : 'guests' }}
            </span>
          }
          @if (form.controls.date.value && form.controls.time.value) {
            <span class="summary-item">
              <mat-icon>event</mat-icon>
              {{ formatSelectedDate() }} at {{ form.controls.time.value }}
            </span>
          }
          @if (selectedTableName()) {
            <span class="summary-item">
              <mat-icon>table_restaurant</mat-icon>
              {{ selectedTableName() }}
            </span>
          }
        </div>
        <button
          type="button"
          class="confirm-btn"
          [disabled]="!canConfirm()"
          (click)="confirmReservation()">
          Confirm Reservation
        </button>
      </footer>
    </section>
  `,
  styles: [
    `
      .reservation-flow {
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: #0F0F0F;
        min-height: 100vh;
        padding: 20px;
        padding-bottom: 140px;
      }

      /* Header */
      .heading h2 {
        margin: 0;
        color: #F0F0F0;
        font-size: 28px;
        font-weight: 700;
        text-align: center;
      }

      /* Horizontal Stepper */
      .stepper {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0;
        padding: 16px 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .step-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 8px 12px;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .step-btn:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .step-num {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #242424;
        border: 2px solid #2C2C2C;
        color: #A0A0A0;
        display: grid;
        place-items: center;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.2s ease;
      }

      .step-btn.active .step-num {
        background: #C5A028;
        border-color: #C5A028;
        color: #0F0F0F;
      }

      .step-btn.completed .step-num {
        background: #2BAE66;
        border-color: #2BAE66;
        color: #FFFFFF;
      }

      .step-label {
        font-size: 12px;
        color: #A0A0A0;
        font-weight: 500;
        white-space: nowrap;
      }

      .step-btn.active .step-label {
        color: #C5A028;
      }

      .step-btn.completed .step-label {
        color: #2BAE66;
      }

      .step-connector {
        width: 40px;
        height: 2px;
        background: #2C2C2C;
        flex-shrink: 0;
      }

      .step-connector.completed {
        background: #2BAE66;
      }

      /* Step Card */
      .step-card {
        border-radius: 16px;
        background: #1A1A1A;
        border: 1px solid #2C2C2C;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .card-title {
        margin: 0 0 20px;
        font-size: 20px;
        color: #F0F0F0;
        font-weight: 600;
        text-align: center;
      }

      /* Guest Stepper */
      .guest-stepper {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
        margin-bottom: 24px;
      }

      .stepper-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #242424;
        border: 2px solid #C5A028;
        color: #C5A028;
        cursor: pointer;
        display: grid;
        place-items: center;
        transition: all 0.2s ease;
      }

      .stepper-btn:hover:not(:disabled) {
        background: #C5A028;
        color: #0F0F0F;
      }

      .stepper-btn:disabled {
        border-color: #2C2C2C;
        color: #5A5A5A;
        cursor: not-allowed;
      }

      .stepper-btn mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .guest-count {
        font-size: 24px;
        font-weight: 700;
        color: #C5A028;
        min-width: 100px;
        text-align: center;
      }

      /* Quick Select */
      .quick-select {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 24px;
      }

      .quick-label {
        font-size: 14px;
        color: #A0A0A0;
      }

      .quick-chip {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: #242424;
        border: 1px solid #2C2C2C;
        color: #F0F0F0;
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .quick-chip:hover {
        border-color: #C5A028;
      }

      .quick-chip.active {
        background: #C5A028;
        border-color: #C5A028;
        color: #0F0F0F;
      }

      .capacity-warning {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin: 0 0 16px;
        padding: 12px;
        background: rgba(224, 108, 108, 0.1);
        border: 1px solid #E06C6C;
        border-radius: 8px;
        color: #E06C6C;
        font-size: 14px;
      }

      .capacity-warning mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      /* Next Button */
      .next-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 16px;
        border-radius: 12px;
        background: #C5A028;
        border: none;
        color: #0F0F0F;
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .next-btn:hover:not(:disabled) {
        background: #D4AF37;
      }

      .next-btn:disabled {
        background: #242424;
        color: #5A5A5A;
        cursor: not-allowed;
      }

      /* Date Section */
      .section-label {
        display: block;
        font-size: 14px;
        color: #A0A0A0;
        margin-bottom: 12px;
        font-weight: 500;
      }

      .date-section {
        margin-bottom: 24px;
      }

      .date-chips {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 8px;
        -webkit-overflow-scrolling: touch;
      }

      .date-chips::-webkit-scrollbar {
        height: 4px;
      }

      .date-chips::-webkit-scrollbar-track {
        background: #1A1A1A;
      }

      .date-chips::-webkit-scrollbar-thumb {
        background: #2C2C2C;
        border-radius: 2px;
      }

      .date-chip {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 12px 16px;
        min-width: 70px;
        background: #242424;
        border: 1px solid #2C2C2C;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .date-chip:hover {
        border-color: #C5A028;
      }

      .date-chip.active {
        background: #C5A028;
        border-color: #C5A028;
      }

      .date-chip.today {
        border-color: #2BAE66;
      }

      .date-chip .day-name {
        font-size: 11px;
        color: #A0A0A0;
        text-transform: uppercase;
        font-weight: 500;
      }

      .date-chip .day-num {
        font-size: 20px;
        font-weight: 700;
        color: #F0F0F0;
      }

      .date-chip .month-name {
        font-size: 11px;
        color: #A0A0A0;
        text-transform: uppercase;
      }

      .date-chip.active .day-name,
      .date-chip.active .day-num,
      .date-chip.active .month-name {
        color: #0F0F0F;
      }

      /* Time Section */
      .time-section {
        margin-bottom: 24px;
      }

      .session-group {
        margin-bottom: 20px;
      }

      .session-group:last-child {
        margin-bottom: 0;
      }

      .session-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .session-name {
        font-size: 13px;
        font-weight: 600;
        color: #C5A028;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .session-closed-badge {
        padding: 4px 10px;
        background: rgba(224, 108, 108, 0.15);
        border: 1px solid #E06C6C;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        color: #E06C6C;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .time-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .time-chip {
        position: relative;
        padding: 12px 20px;
        background: #242424;
        border: 1px solid #2C2C2C;
        border-radius: 20px;
        color: #F0F0F0;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .time-chip:hover:not(:disabled) {
        border-color: #C5A028;
      }

      .time-chip.active {
        background: #C5A028;
        border-color: #C5A028;
        color: #0F0F0F;
      }

      .time-chip.unavailable {
        background: #1A1A1A;
        color: #5A5A5A;
        text-decoration: line-through;
        cursor: not-allowed;
      }

      .time-chip.popular {
        border-color: #C5A028;
      }

      .popular-badge {
        position: absolute;
        top: -8px;
        right: -4px;
        padding: 2px 6px;
        background: #C5A028;
        border-radius: 8px;
        font-size: 9px;
        font-weight: 600;
        color: #0F0F0F;
        text-transform: uppercase;
      }

      /* Area Filter */
      .area-filter {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
        overflow-x: auto;
        padding-bottom: 4px;
      }

      .filter-chip {
        padding: 8px 16px;
        background: #242424;
        border: 1px solid #2C2C2C;
        border-radius: 20px;
        color: #F0F0F0;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .filter-chip:hover {
        border-color: #C5A028;
      }

      .filter-chip.active {
        background: #C5A028;
        border-color: #C5A028;
        color: #0F0F0F;
      }

      /* Floor Plan */
      .floor-plan {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
      }

      .table-card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 16px;
        min-height: 140px;
        background: #242424;
        border: 2px solid #2C2C2C;
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .table-card.available {
        border-color: #2BAE66;
      }

      .table-card.available:hover {
        background: #2C2C2C;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(43, 174, 102, 0.2);
      }

      .table-card.selected {
        background: #C5A028;
        border-color: #C5A028;
      }

      .table-card.selected .table-icon,
      .table-card.selected .table-name,
      .table-card.selected .table-capacity,
      .table-card.selected .table-status {
        color: #0F0F0F;
      }

      .table-card.occupied,
      .table-card.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        border-color: #2C2C2C;
      }

      .table-icon {
        color: #A0A0A0;
      }

      .table-icon mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .table-name {
        font-size: 16px;
        font-weight: 600;
        color: #F0F0F0;
      }

      .table-capacity {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: #A0A0A0;
      }

      .table-capacity mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .table-status {
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .table-card.available .table-status {
        color: #2BAE66;
      }

      .table-card.occupied .table-status {
        color: #E06C6C;
      }

      .check-icon {
        position: absolute;
        top: 8px;
        right: 8px;
        color: #0F0F0F;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      /* Hint */
      .hint {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 16px 0 0;
        padding: 12px;
        background: rgba(224, 108, 108, 0.1);
        border-radius: 8px;
        color: #E06C6C;
        font-size: 14px;
      }

      .hint mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      /* Notes Field */
      .notes-field {
        width: 100%;
      }

      ::ng-deep .notes-field .mat-mdc-text-field-wrapper {
        background: #242424;
        border-radius: 12px;
      }

      ::ng-deep .mat-mdc-form-field-label,
      ::ng-deep .mat-mdc-input-element {
        color: #F0F0F0 !important;
      }

      ::ng-deep .mat-mdc-notch-piece {
        border-color: #2C2C2C !important;
      }

      ::ng-deep .mat-focused .mat-mdc-notch-piece {
        border-color: #C5A028 !important;
      }

      /* Sticky Footer */
      .sticky-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #1A1A1A;
        border-top: 1px solid #2C2C2C;
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        transform: translateY(100%);
        transition: transform 0.3s ease;
        z-index: 100;
      }

      .sticky-footer.visible {
        transform: translateY(0);
      }

      .summary {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: center;
      }

      .summary-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #A0A0A0;
      }

      .summary-item mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #C5A028;
      }

      .confirm-btn {
        width: 100%;
        padding: 16px;
        border-radius: 12px;
        background: #C5A028;
        border: none;
        color: #0F0F0F;
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .confirm-btn:hover:not(:disabled) {
        background: #D4AF37;
      }

      .confirm-btn:disabled {
        background: #242424;
        color: #5A5A5A;
        cursor: not-allowed;
      }

      /* Mobile Adjustments */
      @media (max-width: 640px) {
        .reservation-flow {
          padding: 16px;
          padding-bottom: 160px;
        }

        .stepper {
          justify-content: flex-start;
          padding: 12px 0;
        }

        .step-connector {
          width: 24px;
        }

        .floor-plan {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      /* Focus States */
      .step-btn:focus-visible .step-num,
      .stepper-btn:focus-visible,
      .quick-chip:focus-visible,
      .date-chip:focus-visible,
      .time-chip:focus-visible,
      .filter-chip:focus-visible,
      .table-card:focus-visible,
      .next-btn:focus-visible,
      .confirm-btn:focus-visible {
        outline: 2px solid #C5A028;
        outline-offset: 2px;
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

  readonly steps = [
    { id: 'guests', label: 'Guests' },
    { id: 'datetime', label: 'Date & Time' },
    { id: 'table', label: 'Table' }
  ] as const;

  readonly currentStep = signal<'guests' | 'datetime' | 'table'>('guests');
  readonly selectedArea = signal('All');
  readonly quickSizes = [2, 4, 6, 8];
  readonly tableAreas = ['All', 'Indoor', 'Outdoor', 'VIP'];

  readonly tableLayout = this.reservationFlow.tableLayout;

  readonly selectedDate = signal('');
  readonly dateOptions: DateOption[] = this.generateDateOptions();
  readonly sessionedTimeSlots = computed<SessionGroup[]>(() => {
    const dateStr = this.selectedDate();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const isToday = dateStr === today;
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    return SERVICE_SESSIONS.map(session => {
      const sessionClosed = isToday && (
        currentHour > session.cutoffHour ||
        (currentHour === session.cutoffHour && currentMin >= session.cutoffMin)
      );

      const slots: TimeSlot[] = [];
      for (let hour = session.start; hour < session.end; hour++) {
        for (const min of [0, 30]) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          const label = this.formatTime(hour, min);
          const isPast = isToday && (hour < currentHour || (hour === currentHour && min <= currentMin));
          const popular = session.id === 'dinner' && ['19:00', '19:30', '20:00'].includes(timeStr);
          slots.push({
            label,
            value: timeStr,
            available: !sessionClosed && !isPast,
            popular,
            sessionId: session.id,
            sessionClosed
          });
        }
      }
      return { id: session.id, label: session.label, closed: sessionClosed, slots };
    });
  });

  readonly filteredTables = computed(() => {
    const area = this.selectedArea();
    const tables = this.tableLayout();
    if (area === 'All') return tables;
    return tables.filter(t => t.area === area);
  });

  readonly hasSelectableTable = computed(() =>
    this.tableLayout().some(table => this.isTableSelectable(table))
  );

  readonly capacityWarning = computed(() => {
    const guests = this.form.controls.guests.value;
    const maxCapacity = Math.max(...this.tableLayout().map(t => t.capacity));
    if (guests > maxCapacity) {
      return `Maximum table capacity is ${maxCapacity} guests. Consider splitting into multiple tables.`;
    }
    return null;
  });

  readonly selectedTableName = computed(() => {
    const tableId = this.form.controls.tableId.value;
    const table = this.tableLayout().find(t => t.id === tableId);
    return table?.name || null;
  });

  readonly showSummary = computed(() => {
    return this.form.controls.guests.value > 0;
  });

  readonly canConfirm = computed(() => {
    return (
      this.form.controls.date.valid &&
      this.form.controls.time.valid &&
      this.form.controls.tableId.valid &&
      this.form.controls.tableId.value > 0 &&
      this.hasSelectableTable()
    );
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly reservationFlow: CustomerReservationFlowService
  ) {}

  // Step Navigation
  goToStep(step: 'guests' | 'datetime' | 'table'): void {
    if (this.canAccessStep(step)) {
      this.currentStep.set(step);
    }
  }

  canAccessStep(step: string): boolean {
    switch (step) {
      case 'guests':
        return true;
      case 'datetime':
        return this.form.controls.guests.value > 0;
      case 'table':
        return !!this.form.controls.date.value && !!this.form.controls.time.value;
      default:
        return false;
    }
  }

  isStepCompleted(step: string): boolean {
    switch (step) {
      case 'guests':
        return this.form.controls.guests.value > 0 && this.currentStep() !== 'guests';
      case 'datetime':
        return !!this.form.controls.date.value && !!this.form.controls.time.value && this.currentStep() !== 'datetime';
      case 'table':
        return this.form.controls.tableId.value > 0 && this.currentStep() !== 'table';
      default:
        return false;
    }
  }

  // Guest Selection
  selectGuests(guests: number): void {
    this.form.controls.guests.setValue(guests);
    this.validateTableSelection();
  }

  incrementGuests(): void {
    const current = this.form.controls.guests.value;
    if (current < 20) {
      this.form.controls.guests.setValue(current + 1);
      this.validateTableSelection();
    }
  }

  decrementGuests(): void {
    const current = this.form.controls.guests.value;
    if (current > 1) {
      this.form.controls.guests.setValue(current - 1);
      this.validateTableSelection();
    }
  }

  private validateTableSelection(): void {
    const selectedTableId = this.form.controls.tableId.value;
    const selectedTable = this.tableLayout().find(table => table.id === selectedTableId);
    if (selectedTable && !this.isTableSelectable(selectedTable)) {
      this.form.controls.tableId.setValue(0);
    }
  }

  // Date Selection
  selectDate(date: string): void {
    this.form.controls.date.setValue(date);
    this.selectedDate.set(date);
    this.form.controls.time.setValue('');
  }

  private generateDateOptions(): DateOption[] {
    const options: DateOption[] = [];
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const value = date.toISOString().split('T')[0];

      options.push({
        date,
        dayName: days[date.getDay()],
        dayNum: date.getDate(),
        monthName: months[date.getMonth()],
        value,
        isToday: i === 0
      });
    }
    return options;
  }

  formatSelectedDate(): string {
    const dateStr = this.form.controls.date.value;
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  }

  // Time Selection
  selectTime(time: string): void {
    this.form.controls.time.setValue(time);
  }

  private formatTime(hour: number, min: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
  }

  // Table Selection
  selectTable(tableId: number): void {
    this.form.controls.tableId.setValue(tableId);
  }

  tableStatusLabel(table: ReservationTableOption): string {
    if (table.status === 'disabled') return 'Not Available';
    if (table.status === 'occupied') return 'Occupied';
    return 'Available';
  }

  isTableSelectable(table: ReservationTableOption): boolean {
    return table.status === 'available' && table.capacity >= this.form.controls.guests.value;
  }

  // Confirmation - submits booking and navigates to Profile
  confirmReservation(): void {
    if (!this.canConfirm()) return;

    const selectedTable = this.tableLayout().find(
      table => table.id === this.form.controls.tableId.value
    );
    if (!selectedTable) return;

    this.reservationFlow.setDraft({
      guests: this.form.controls.guests.value,
      date: this.form.controls.date.value,
      time: this.form.controls.time.value,
      table: selectedTable
    });

    // Submit reservation and navigate to Profile to track status
    this.reservationFlow.submitReservation();
    this.router.navigateByUrl('/customer/profile');
  }
}
