import { ChangeDetectionStrategy, Component, computed, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import {
  CustomerReservationFlowService,
  ReservationTableOption
} from '../../core/services/customer-reservation-flow.service';
import { AuthService } from '../../core/services/auth.service';

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
}

@Component({
  selector: 'app-public-reservation',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterLink
  ],
  template: `
    <div class="public-reservation-page">
      <!-- Navigation Bar -->
      <nav class="top-nav">
        <div class="nav-brand">
          <img class="nav-logo" src="/assets/logo.jpg" alt="Desinare logo" />
          <span class="nav-name">Desinare</span>
        </div>
        <div class="nav-links">
          <a class="nav-link" routerLink="/">Home</a>
          <a class="nav-link" routerLink="/menu">Menu</a>
          <a class="nav-link active">Reservation</a>
        </div>
        <a class="nav-login" routerLink="/login">
          <mat-icon>person_outline</mat-icon>
          Sign In
        </a>
      </nav>

      <!-- Content -->
      <div class="reservation-wrap">
        <section class="reservation-flow">
          <header class="heading">
            <h2>Book a Table</h2>
            <p class="heading-sub">Select your preferences and we'll find the perfect table for you.</p>
          </header>

          <!-- Stepper -->
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
                  <div class="guest-stepper">
                    <button type="button" class="stepper-btn"
                      [disabled]="form.controls.guests.value <= 1"
                      (click)="decrementGuests()">
                      <mat-icon>remove</mat-icon>
                    </button>
                    <span class="guest-count">{{ form.controls.guests.value }} {{ form.controls.guests.value === 1 ? 'guest' : 'guests' }}</span>
                    <button type="button" class="stepper-btn"
                      [disabled]="form.controls.guests.value >= 20"
                      (click)="incrementGuests()">
                      <mat-icon>add</mat-icon>
                    </button>
                  </div>
                  <div class="quick-select">
                    <span class="quick-label">Quick select:</span>
                    @for (size of quickSizes; track size) {
                      <button type="button" class="quick-chip"
                        [class.active]="form.controls.guests.value === size"
                        (click)="selectGuests(size)">
                        {{ size }}
                      </button>
                    }
                  </div>
                  <button type="button" class="next-btn" (click)="goToStep('datetime')">
                    Continue <mat-icon>arrow_forward</mat-icon>
                  </button>
                </mat-card-content>
              </mat-card>
            }

            <!-- Step 2: Date & Time -->
            @if (currentStep() === 'datetime') {
              <mat-card class="step-card">
                <mat-card-content>
                  <h3 class="card-title">When would you like to dine?</h3>
                  <div class="date-section">
                    <label class="section-label">Select Date</label>
                    <div class="date-chips">
                      @for (d of dateOptions; track d.value) {
                        <button type="button" class="date-chip"
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
                  <div class="time-section">
                    <label class="section-label">Select Time</label>
                    <div class="time-chips">
                      @for (slot of timeSlots; track slot.value) {
                        <button type="button" class="time-chip"
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
                  <button type="button" class="next-btn"
                    [disabled]="!form.controls.date.value || !form.controls.time.value"
                    (click)="goToStep('table')">
                    Continue <mat-icon>arrow_forward</mat-icon>
                  </button>
                </mat-card-content>
              </mat-card>
            }

            <!-- Step 3: Table Selection -->
            @if (currentStep() === 'table') {
              <mat-card class="step-card">
                <mat-card-content>
                  <h3 class="card-title">Choose your table</h3>
                  <div class="area-filter">
                    @for (area of tableAreas; track area) {
                      <button type="button" class="filter-chip"
                        [class.active]="selectedArea() === area"
                        (click)="selectedArea.set(area)">
                        {{ area }}
                      </button>
                    }
                  </div>
                  <div class="floor-plan">
                    @for (table of filteredTables(); track table.id) {
                      <button type="button" class="table-card"
                        [class.available]="isTableSelectable(table)"
                        [class.selected]="form.controls.tableId.value === table.id"
                        [class.occupied]="table.status === 'occupied'"
                        [class.disabled]="table.status === 'disabled'"
                        [disabled]="!isTableSelectable(table)"
                        (click)="selectTable(table.id)">
                        <div class="table-icon"><mat-icon>table_restaurant</mat-icon></div>
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
                  <button type="button" class="next-btn"
                    [disabled]="!form.controls.tableId.value || form.controls.tableId.value === 0"
                    (click)="goToStep('confirm')">
                    Continue <mat-icon>arrow_forward</mat-icon>
                  </button>
                </mat-card-content>
              </mat-card>
            }

            <!-- Step 4: Confirm — Sign In or Guest -->
            @if (currentStep() === 'confirm') {
              <mat-card class="step-card confirm-card">
                <mat-card-content>
                  <h3 class="card-title">Confirm Your Reservation</h3>

                  <!-- Booking Summary -->
                  <div class="booking-summary">
                    <div class="summary-row">
                      <mat-icon>people</mat-icon>
                      <span>{{ form.controls.guests.value }} {{ form.controls.guests.value === 1 ? 'guest' : 'guests' }}</span>
                    </div>
                    <div class="summary-row">
                      <mat-icon>event</mat-icon>
                      <span>{{ formatSelectedDate() }}</span>
                    </div>
                    <div class="summary-row">
                      <mat-icon>schedule</mat-icon>
                      <span>{{ form.controls.time.value }}</span>
                    </div>
                    <div class="summary-row">
                      <mat-icon>table_restaurant</mat-icon>
                      <span>{{ selectedTableName() }}</span>
                    </div>
                  </div>

                  <!-- Guest Info Form -->
                  <div class="guest-info-section">
                    <h4>Your Contact Details</h4>
                    <div class="input-group">
                      <input formControlName="guestName" placeholder="Full Name" />
                    </div>
                    <div class="input-group">
                      <input formControlName="guestEmail" placeholder="Email Address" type="email" />
                    </div>
                    <div class="input-group">
                      <input formControlName="guestPhone" placeholder="Phone Number" type="tel" />
                    </div>
                  </div>

                  @if (confirmError()) {
                    <p class="error">{{ confirmError() }}</p>
                  }

                  <!-- Two Action Options -->
                  <div class="confirm-actions">
                    <button type="button" class="confirm-btn primary"
                      [disabled]="!canConfirmGuest()"
                      (click)="confirmAsGuest()">
                      <mat-icon>check_circle</mat-icon>
                      Complete as Guest
                    </button>
                    <div class="divider-row">
                      <span class="divider-line"></span>
                      <span class="divider-text">or</span>
                      <span class="divider-line"></span>
                    </div>
                    <button type="button" class="confirm-btn secondary" (click)="signInToConfirm()">
                      <mat-icon>login</mat-icon>
                      Sign In to Save Reservation
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            }

            <!-- Success State -->
            @if (currentStep() === 'success') {
              <mat-card class="step-card success-card">
                <mat-card-content>
                  <div class="success-content">
                    <div class="success-icon-wrap">
                      <mat-icon>check_circle</mat-icon>
                    </div>
                    <h3>Reservation Confirmed!</h3>
                    <p>Your table has been booked. We look forward to welcoming you.</p>
                    <div class="booking-summary">
                      <div class="summary-row">
                        <mat-icon>people</mat-icon>
                        <span>{{ form.controls.guests.value }} guests</span>
                      </div>
                      <div class="summary-row">
                        <mat-icon>event</mat-icon>
                        <span>{{ formatSelectedDate() }} at {{ form.controls.time.value }}</span>
                      </div>
                      <div class="summary-row">
                        <mat-icon>table_restaurant</mat-icon>
                        <span>{{ selectedTableName() }}</span>
                      </div>
                    </div>
                    <p class="success-hint">A confirmation will be sent to your email. You can create an account to manage your reservations.</p>
                    <div class="success-actions">
                      <a class="cta-primary" routerLink="/">
                        <mat-icon>home</mat-icon>
                        Back to Home
                      </a>
                      <a class="cta-secondary" routerLink="/login">
                        Create Account
                      </a>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </form>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .public-reservation-page {
      background: #0F0F0F;
      color: #F0F0F0;
      min-height: 100dvh;
    }

    /* Nav */
    .top-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 32px;
      background: rgba(15, 15, 15, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(44, 44, 44, 0.5);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-logo {
      width: 36px;
      height: 36px;
      object-fit: contain;
      border-radius: 8px;
    }

    .nav-name {
      font-family: 'Playfair Display', 'Times New Roman', serif;
      font-size: 26px;
      font-weight: 700;
      font-style: italic;
      color: #C5A028;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 32px;
    }

    .nav-link {
      color: #A0A0A0;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .nav-link:hover, .nav-link.active { color: #C5A028; }

    .nav-login {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #F0F0F0;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 10px 20px;
      border: 1px solid #2C2C2C;
      border-radius: 10px;
      background: rgba(26, 26, 26, 0.7);
      transition: all 0.2s ease;
    }

    .nav-login:hover { border-color: #C5A028; color: #C5A028; }
    .nav-login mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Content wrapper */
    .reservation-wrap {
      max-width: 640px;
      margin: 0 auto;
      padding: 80px 20px 40px;
    }

    .reservation-flow {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .heading {
      text-align: center;
      padding-top: 16px;
    }

    .heading h2 {
      margin: 0;
      color: #F0F0F0;
      font-size: 28px;
      font-weight: 700;
    }

    .heading-sub {
      margin: 8px 0 0;
      font-size: 15px;
      color: #A0A0A0;
    }

    /* Stepper */
    .stepper {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 0;
      overflow-x: auto;
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

    .step-btn:disabled { cursor: not-allowed; opacity: 0.5; }

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

    .step-btn.active .step-num { background: #C5A028; border-color: #C5A028; color: #0F0F0F; }
    .step-btn.completed .step-num { background: #2BAE66; border-color: #2BAE66; color: #FFFFFF; }

    .step-label { font-size: 12px; color: #A0A0A0; font-weight: 500; white-space: nowrap; }
    .step-btn.active .step-label { color: #C5A028; }
    .step-btn.completed .step-label { color: #2BAE66; }

    .step-connector { width: 40px; height: 2px; background: #2C2C2C; flex-shrink: 0; }
    .step-connector.completed { background: #2BAE66; }

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

    /* Guest stepper */
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

    .stepper-btn:hover:not(:disabled) { background: #C5A028; color: #0F0F0F; }
    .stepper-btn:disabled { border-color: #2C2C2C; color: #5A5A5A; cursor: not-allowed; }
    .stepper-btn mat-icon { font-size: 28px; width: 28px; height: 28px; }

    .guest-count {
      font-size: 24px;
      font-weight: 700;
      color: #C5A028;
      min-width: 100px;
      text-align: center;
    }

    .quick-select {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .quick-label { font-size: 14px; color: #A0A0A0; }

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

    .quick-chip:hover { border-color: #C5A028; }
    .quick-chip.active { background: #C5A028; border-color: #C5A028; color: #0F0F0F; }

    /* Next button */
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

    .next-btn:hover:not(:disabled) { background: #D4AF37; }
    .next-btn:disabled { background: #242424; color: #5A5A5A; cursor: not-allowed; }

    /* Date section */
    .section-label {
      display: block;
      font-size: 14px;
      color: #A0A0A0;
      margin-bottom: 12px;
      font-weight: 500;
    }

    .date-section { margin-bottom: 24px; }

    .date-chips {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 8px;
      -webkit-overflow-scrolling: touch;
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

    .date-chip:hover { border-color: #C5A028; }
    .date-chip.active { background: #C5A028; border-color: #C5A028; }
    .date-chip.today { border-color: #2BAE66; }

    .date-chip .day-name { font-size: 11px; color: #A0A0A0; text-transform: uppercase; font-weight: 500; }
    .date-chip .day-num { font-size: 20px; font-weight: 700; color: #F0F0F0; }
    .date-chip .month-name { font-size: 11px; color: #A0A0A0; text-transform: uppercase; }

    .date-chip.active .day-name,
    .date-chip.active .day-num,
    .date-chip.active .month-name { color: #0F0F0F; }

    /* Time section */
    .time-section { margin-bottom: 24px; }

    .time-chips { display: flex; flex-wrap: wrap; gap: 10px; }

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

    .time-chip:hover:not(:disabled) { border-color: #C5A028; }
    .time-chip.active { background: #C5A028; border-color: #C5A028; color: #0F0F0F; }
    .time-chip.unavailable { background: #1A1A1A; color: #5A5A5A; text-decoration: line-through; cursor: not-allowed; }
    .time-chip.popular { border-color: #C5A028; }

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

    /* Area filters */
    .area-filter {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      overflow-x: auto;
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

    .filter-chip:hover { border-color: #C5A028; }
    .filter-chip.active { background: #C5A028; border-color: #C5A028; color: #0F0F0F; }

    /* Floor plan */
    .floor-plan {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
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

    .table-card.available { border-color: #2BAE66; }
    .table-card.available:hover { background: #2C2C2C; transform: translateY(-2px); }
    .table-card.selected { background: #C5A028; border-color: #C5A028; }
    .table-card.selected .table-icon,
    .table-card.selected .table-name,
    .table-card.selected .table-capacity,
    .table-card.selected .table-status { color: #0F0F0F; }
    .table-card.occupied, .table-card.disabled { opacity: 0.4; cursor: not-allowed; }

    .table-icon { color: #A0A0A0; }
    .table-icon mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .table-name { font-size: 16px; font-weight: 600; color: #F0F0F0; }
    .table-capacity { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #A0A0A0; }
    .table-capacity mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .table-status { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .table-card.available .table-status { color: #2BAE66; }
    .table-card.occupied .table-status { color: #E06C6C; }
    .check-icon { position: absolute; top: 8px; right: 8px; color: #0F0F0F; font-size: 20px; width: 20px; height: 20px; }

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

    .hint mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }

    /* ===== Confirmation Step ===== */
    .booking-summary {
      background: #242424;
      border: 1px solid #2C2C2C;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .summary-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      font-size: 15px;
      color: #F0F0F0;
    }

    .summary-row:not(:last-child) {
      border-bottom: 1px solid #2C2C2C;
    }

    .summary-row mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #C5A028;
    }

    /* Guest info form */
    .guest-info-section {
      margin-bottom: 24px;
    }

    .guest-info-section h4 {
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 600;
      color: #F0F0F0;
    }

    .input-group {
      margin-bottom: 12px;
    }

    .input-group input {
      width: 100%;
      height: 50px;
      background: #242424;
      border: 1px solid #2C2C2C;
      border-radius: 12px;
      padding: 0 18px;
      font-size: 15px;
      color: #F0F0F0;
      font-weight: 500;
      outline: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .input-group input::placeholder {
      color: #A0A0A0;
      font-weight: 400;
    }

    .input-group input:focus {
      background: #2C2C2C;
      border-color: #C5A028;
      box-shadow: 0 0 0 3px rgba(197, 160, 40, 0.15);
    }

    .error {
      color: #E06C6C;
      font-size: 14px;
      margin: -8px 0 16px;
    }

    .confirm-actions {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .confirm-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 16px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .confirm-btn.primary {
      background: #C5A028;
      color: #0F0F0F;
    }

    .confirm-btn.primary:hover:not(:disabled) { background: #D4AF37; }
    .confirm-btn.primary:disabled { background: #242424; color: #5A5A5A; cursor: not-allowed; }

    .confirm-btn.secondary {
      background: transparent;
      border: 1.5px solid #C5A028;
      color: #C5A028;
    }

    .confirm-btn.secondary:hover {
      background: rgba(197, 160, 40, 0.08);
    }

    .confirm-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .divider-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: #2C2C2C;
    }

    .divider-text {
      font-size: 13px;
      color: #A0A0A0;
      font-weight: 500;
    }

    /* ===== Success State ===== */
    .success-content {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .success-icon-wrap {
      width: 72px;
      height: 72px;
      background: rgba(43, 174, 102, 0.1);
      border: 2px solid #2BAE66;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }

    .success-icon-wrap mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #2BAE66;
    }

    .success-content h3 {
      margin: 0;
      font-size: 24px;
      color: #F0F0F0;
      font-weight: 700;
    }

    .success-content > p {
      margin: 8px 0 24px;
      font-size: 15px;
      color: #A0A0A0;
    }

    .success-card .booking-summary {
      width: 100%;
    }

    .success-hint {
      margin: 16px 0 24px;
      font-size: 13px;
      color: #A0A0A0;
      font-style: italic;
    }

    .success-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .cta-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #C5A028;
      color: #0F0F0F;
      border: none;
      border-radius: 12px;
      padding: 14px 24px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .cta-primary:hover { background: #D4AF37; }
    .cta-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .cta-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #C5A028;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      padding: 14px 24px;
      border: 1.5px solid rgba(197, 160, 40, 0.4);
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .cta-secondary:hover {
      border-color: #C5A028;
      background: rgba(197, 160, 40, 0.08);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .nav-links { display: none; }
      .reservation-wrap { padding: 80px 16px 32px; }
      .floor-plan { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 480px) {
      .success-actions { flex-direction: column; width: 100%; }
      .cta-primary, .cta-secondary { width: 100%; justify-content: center; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicReservationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly reservationFlow = inject(CustomerReservationFlowService);
  private readonly authService = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    guests: [2, [Validators.required, Validators.min(1), Validators.max(20)]],
    date: ['', [Validators.required]],
    time: ['', [Validators.required]],
    tableId: [0, [Validators.required, Validators.min(1)]],
    guestName: ['', [Validators.required]],
    guestEmail: ['', [Validators.required, Validators.email]],
    guestPhone: ['', [Validators.required]]
  });

  readonly steps = [
    { id: 'guests', label: 'Guests' },
    { id: 'datetime', label: 'Date & Time' },
    { id: 'table', label: 'Table' },
    { id: 'confirm', label: 'Confirm' }
  ] as const;

  readonly currentStep = signal<'guests' | 'datetime' | 'table' | 'confirm' | 'success'>('guests');
  readonly selectedArea = signal('All');
  readonly confirmError = signal('');
  readonly quickSizes = [2, 4, 6];
  readonly tableAreas = ['All', 'Indoor', 'Outdoor', 'VIP'];

  readonly tableLayout = this.reservationFlow.tableLayout;
  readonly dateOptions: DateOption[] = this.generateDateOptions();
  readonly timeSlots: TimeSlot[] = this.generateTimeSlots();

  readonly filteredTables = computed(() => {
    const area = this.selectedArea();
    const tables = this.tableLayout();
    if (area === 'All') return tables;
    return tables.filter(t => t.area === area);
  });

  readonly hasSelectableTable = computed(() =>
    this.tableLayout().some(table => this.isTableSelectable(table))
  );

  readonly selectedTableName = computed(() => {
    const tableId = this.form.controls.tableId.value;
    const table = this.tableLayout().find(t => t.id === tableId);
    return table?.name || null;
  });

  canConfirmGuest(): boolean {
    const { guestName, guestEmail, guestPhone } = this.form.controls;
    return guestName.valid && guestEmail.valid && guestPhone.valid;
  }

  // Step navigation
  goToStep(step: 'guests' | 'datetime' | 'table' | 'confirm' | 'success'): void {
    if (this.canAccessStep(step)) {
      this.currentStep.set(step);
    }
  }

  canAccessStep(step: string): boolean {
    switch (step) {
      case 'guests': return true;
      case 'datetime': return this.form.controls.guests.value > 0;
      case 'table': return !!this.form.controls.date.value && !!this.form.controls.time.value;
      case 'confirm': return this.form.controls.tableId.value > 0;
      case 'success': return false;
      default: return false;
    }
  }

  isStepCompleted(step: string): boolean {
    const cur = this.currentStep();
    const order = ['guests', 'datetime', 'table', 'confirm', 'success'];
    const stepIdx = order.indexOf(step);
    const curIdx = order.indexOf(cur);
    if (curIdx <= stepIdx) return false;

    switch (step) {
      case 'guests': return this.form.controls.guests.value > 0;
      case 'datetime': return !!this.form.controls.date.value && !!this.form.controls.time.value;
      case 'table': return this.form.controls.tableId.value > 0;
      case 'confirm': return cur === 'success';
      default: return false;
    }
  }

  // Guest controls
  selectGuests(guests: number): void { this.form.controls.guests.setValue(guests); }
  incrementGuests(): void { const c = this.form.controls.guests.value; if (c < 20) this.form.controls.guests.setValue(c + 1); }
  decrementGuests(): void { const c = this.form.controls.guests.value; if (c > 1) this.form.controls.guests.setValue(c - 1); }

  // Date/Time
  selectDate(date: string): void { this.form.controls.date.setValue(date); }
  selectTime(time: string): void { this.form.controls.time.setValue(time); }

  // Table
  selectTable(tableId: number): void { this.form.controls.tableId.setValue(tableId); }

  isTableSelectable(table: ReservationTableOption): boolean {
    return table.status === 'available' && table.capacity >= this.form.controls.guests.value;
  }

  tableStatusLabel(table: ReservationTableOption): string {
    if (table.status === 'disabled') return 'Not Available';
    if (table.status === 'occupied') return 'Occupied';
    return 'Available';
  }

  formatSelectedDate(): string {
    const dateStr = this.form.controls.date.value;
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  }

  // Confirmation
  confirmAsGuest(): void {
    if (!this.canConfirmGuest()) return;

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

    this.reservationFlow.submitReservation();
    this.currentStep.set('success');
  }

  signInToConfirm(): void {
    // Save booking selections to session storage so user doesn't lose choices
    const draft = {
      guests: this.form.controls.guests.value,
      date: this.form.controls.date.value,
      time: this.form.controls.time.value,
      tableId: this.form.controls.tableId.value
    };
    sessionStorage.setItem('pending-reservation', JSON.stringify(draft));
    this.router.navigate(['/login']);
  }

  // Generators
  private generateDateOptions(): DateOption[] {
    const options: DateOption[] = [];
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      options.push({
        date,
        dayName: days[date.getDay()],
        dayNum: date.getDate(),
        monthName: months[date.getMonth()],
        value: date.toISOString().split('T')[0],
        isToday: i === 0
      });
    }
    return options;
  }

  private generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const popularTimes = ['19:00', '19:30', '20:00'];

    for (let hour = 11; hour <= 21; hour++) {
      for (const min of ['00', '30']) {
        if (hour === 21 && min === '30') continue;
        const time = `${hour.toString().padStart(2, '0')}:${min}`;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        slots.push({
          label: `${displayHour}:${min} ${period}`,
          value: time,
          available: Math.random() > 0.2,
          popular: popularTimes.includes(time)
        });
      }
    }
    return slots;
  }
}
