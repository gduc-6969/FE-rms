import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservationService } from '../../core/services/reservation.service';
import { TableResponse } from '../../core/models/app.models';

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
  value: string;       // HH:mm
  shift: 'morning' | 'evening';
}

// Seat duration rules (minutes)
function maxDurationMinutes(capacity: number): number {
  if (capacity <= 3) return 90;
  if (capacity <= 6) return 120;
  return 165;
}

// Generate slots for a shift
function buildShiftSlots(startH: number, endH: number, shiftKey: 'morning' | 'evening'): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = startH; h < endH; h++) {
    for (const m of [0, 30]) {
      const label = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      slots.push({ label, value: label, shift: shiftKey });
    }
  }
  return slots;
}

const MORNING_SLOTS = buildShiftSlots(10, 14, 'morning');
const EVENING_SLOTS = buildShiftSlots(17, 22, 'evening');
const ALL_SLOTS: TimeSlot[] = [...MORNING_SLOTS, ...EVENING_SLOTS];

const SERVICE_SESSIONS = {
  morning: { cutoffHour: 9,  cutoffMin: 30, endHour: 14 },
  evening: { cutoffHour: 16, cutoffMin: 0,  endHour: 22 }
};

@Component({
  selector: 'app-customer-reservation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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

      <!-- ───── STEP 1: TABLE SELECTION ───── -->
      @if (currentStep() === 'table') {
        <mat-card class="step-card">
          <mat-card-content>
            <h3 class="card-title">Choose your table</h3>

            <!-- Capacity filter -->
            <div class="capacity-filter-row">
              <span class="section-label">Filter by capacity (min. guests):</span>
              <div class="cap-chips">
                @for (opt of capacityOptions; track opt) {
                  <button
                    type="button"
                    class="filter-chip"
                    [class.active]="minCapacity() === opt"
                    (click)="minCapacity.set(opt)">
                    {{ opt }}+
                  </button>
                }
              </div>
            </div>

            <!-- Status legend -->
            <div class="legend-row">
              <span class="legend-item available"><span class="legend-dot"></span>Trống</span>
              <span class="legend-item booked"><span class="legend-dot"></span>Đã đặt</span>
              <span class="legend-item selected-legend"><span class="legend-dot"></span>Đã chọn</span>
            </div>

            <!-- Loading skeleton -->
            @if (isLoading()) {
              <div class="floor-plan-skeleton">
                @for (i of [1,2,3,4]; track i) {
                  <div class="skeleton-zone"></div>
                }
              </div>
            }

            <!-- Floor Plan Layout -->
            @if (!isLoading()) {
              <div class="floor-plan-wrapper">
                <!-- Top row: Restrooms + Bar Area + Kitchen -->
                <div class="fp-top-row">
                  <div class="fp-landmark restrooms">
                    <mat-icon>wc</mat-icon>
                    <span>Restrooms</span>
                  </div>
                  <div class="fp-zone bar-zone">
                    <div class="zone-label"><mat-icon>local_bar</mat-icon> Bar Area</div>
                    <div class="zone-tables">
                      @for (table of zones().bar; track table.id) {
                        <button type="button" class="fp-table" [class.available]="table.status === 'trong'" [class.booked]="table.status === 'da_dat'" [class.selected]="selectedTableId() === table.id" [disabled]="table.status !== 'trong'" (click)="selectTable(table)">
                          <mat-icon>deck</mat-icon>
                          <span class="fp-table-code">{{ table.tableCode }}</span>
                          <span class="fp-table-cap">{{ table.capacity }}p</span>
                          @if (selectedTableId() === table.id) { <mat-icon class="fp-check">check_circle</mat-icon> }
                        </button>
                      }
                      @if (zones().bar.length === 0) { <span class="zone-empty">—</span> }
                    </div>
                  </div>
                  <div class="fp-landmark kitchen">
                    <mat-icon>soup_kitchen</mat-icon>
                    <span>Kitchen</span>
                  </div>
                </div>

                <!-- Middle row: Booth Alcoves + Main floor -->
                <div class="fp-middle-row">
                  <div class="fp-zone booth-zone">
                    <div class="zone-label"><mat-icon>weekend</mat-icon> Booth Alcoves</div>
                    <div class="zone-tables">
                      @for (table of zones().booth; track table.id) {
                        <button type="button" class="fp-table booth-table" [class.available]="table.status === 'trong'" [class.booked]="table.status === 'da_dat'" [class.selected]="selectedTableId() === table.id" [disabled]="table.status !== 'trong'" (click)="selectTable(table)">
                          <mat-icon>weekend</mat-icon>
                          <span class="fp-table-code">{{ table.tableCode }}</span>
                          <span class="fp-table-cap">{{ table.capacity }}p</span>
                          @if (selectedTableId() === table.id) { <mat-icon class="fp-check">check_circle</mat-icon> }
                        </button>
                      }
                      @if (zones().booth.length === 0) { <span class="zone-empty">—</span> }
                    </div>
                  </div>

                  <div class="fp-main-floor">
                    <!-- Communal Tables -->
                    <div class="fp-zone communal-zone">
                      <div class="zone-label"><mat-icon>table_bar</mat-icon> Communal Tables</div>
                      <div class="zone-tables">
                        @for (table of zones().communal; track table.id) {
                          <button type="button" class="fp-table communal-table" [class.available]="table.status === 'trong'" [class.booked]="table.status === 'da_dat'" [class.selected]="selectedTableId() === table.id" [disabled]="table.status !== 'trong'" (click)="selectTable(table)">
                            <mat-icon>table_bar</mat-icon>
                            <span class="fp-table-code">{{ table.tableCode }}</span>
                            <span class="fp-table-cap">{{ table.capacity }}p</span>
                            @if (selectedTableId() === table.id) { <mat-icon class="fp-check">check_circle</mat-icon> }
                          </button>
                        }
                        @if (zones().communal.length === 0) { <span class="zone-empty">—</span> }
                      </div>
                    </div>

                    <!-- Main Dining -->
                    <div class="fp-zone dining-zone">
                      <div class="zone-label"><mat-icon>restaurant</mat-icon> Main Dining</div>
                      <div class="zone-tables">
                        @for (table of zones().dining; track table.id) {
                          <button type="button" class="fp-table" [class.available]="table.status === 'trong'" [class.booked]="table.status === 'da_dat'" [class.selected]="selectedTableId() === table.id" [disabled]="table.status !== 'trong'" (click)="selectTable(table)">
                            <mat-icon>table_restaurant</mat-icon>
                            <span class="fp-table-code">{{ table.tableCode }}</span>
                            <span class="fp-table-cap">{{ table.capacity }}p</span>
                            @if (selectedTableId() === table.id) { <mat-icon class="fp-check">check_circle</mat-icon> }
                          </button>
                        }
                        @if (zones().dining.length === 0) { <span class="zone-empty">—</span> }
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Bottom: Entrance -->
                <div class="fp-entrance">
                  <mat-icon>door_front</mat-icon>
                  <span>Entrance</span>
                </div>
              </div>

              @if (filteredTables().length === 0) {
                <p class="hint">
                  <mat-icon>info</mat-icon>
                  Không có bàn trống phù hợp với bộ lọc hiện tại.
                </p>
              }

              <button
                type="button"
                class="next-btn"
                [disabled]="!selectedTableId()"
                (click)="goToStep('datetime')">
                Tiếp tục
                <mat-icon>arrow_forward</mat-icon>
              </button>
            }
          </mat-card-content>
        </mat-card>
      }

      <!-- ───── STEP 2: DATE & TIME ───── -->
      @if (currentStep() === 'datetime') {
        <mat-card class="step-card">
          <mat-card-content>
            <h3 class="card-title">Chọn ngày và giờ</h3>

            <!-- Selected table recap -->
            @if (selectedTable()) {
              <div class="selected-recap">
                <mat-icon>table_restaurant</mat-icon>
                <span>{{ selectedTable()!.tableCode }} · {{ selectedTable()!.capacity }} người · tối đa {{ durationLabel() }}</span>
              </div>
            }

            <!-- Date picker -->
            <div class="date-section">
              <label class="section-label">Chọn ngày</label>
              <div class="date-chips">
                @for (d of dateOptions; track d.value) {
                  <button
                    type="button"
                    class="date-chip"
                    [class.active]="selectedDate() === d.value"
                    [class.today]="d.isToday"
                    (click)="selectedDate.set(d.value)">
                    <span class="day-name">{{ d.dayName }}</span>
                    <span class="day-num">{{ d.dayNum }}</span>
                    <span class="month-name">{{ d.monthName }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Shift tabs -->
            <div class="shift-tabs">
              <button
                type="button"
                class="shift-tab"
                [class.active]="activeShift() === 'morning'"
                [class.shift-closed]="shiftStatus().morning.closed"
                (click)="activeShift.set('morning')">
                <mat-icon>wb_sunny</mat-icon>
                Ca Sáng (10:00 – 14:00)
                @if (shiftStatus().morning.closed) {
                  <span class="shift-closed-badge">Closed</span>
                }
              </button>
              <button
                type="button"
                class="shift-tab"
                [class.active]="activeShift() === 'evening'"
                [class.shift-closed]="shiftStatus().evening.closed"
                (click)="activeShift.set('evening')">
                <mat-icon>nights_stay</mat-icon>
                Ca Tối (17:00 – 22:00)
                @if (shiftStatus().evening.closed) {
                  <span class="shift-closed-badge">Closed</span>
                }
              </button>
            </div>

            <!-- Time slots -->
            <div class="time-chips">
              @for (slot of currentShiftSlots(); track slot.value) {
                <button
                  type="button"
                  class="time-chip"
                  [class.active]="selectedTime() === slot.value"
                  [class.unavailable]="isSlotPast(slot.value)"
                  [disabled]="isSlotPast(slot.value)"
                  (click)="selectedTime.set(slot.value)">
                  {{ slot.label }}
                </button>
              }
            </div>

            <!-- Number of guests -->
            <div class="guests-row">
              <label class="section-label">Số khách</label>
              <div class="guest-stepper">
                <button
                  type="button"
                  class="stepper-btn"
                  [disabled]="numberOfGuests() <= 2"
                  (click)="numberOfGuests.set(numberOfGuests() - 1)">
                  <mat-icon>remove</mat-icon>
                </button>
                <span class="guest-count">{{ numberOfGuests() }} người</span>
                <button
                  type="button"
                  class="stepper-btn"
                  [disabled]="numberOfGuests() >= (selectedTable()?.capacity ?? 2)"
                  (click)="numberOfGuests.set(numberOfGuests() + 1)">
                  <mat-icon>add</mat-icon>
                </button>
              </div>
            </div>

            <!-- Note -->
            <mat-form-field class="notes-field" appearance="outline">
              <mat-label>Ghi chú (tùy chọn)</mat-label>
              <textarea matInput rows="2" [(ngModel)]="note" [ngModelOptions]="{standalone: true}"></textarea>
            </mat-form-field>

            <button
              type="button"
              class="next-btn"
              [disabled]="!selectedDate() || !selectedTime()"
              (click)="confirmReservation()">
              @if (isSubmitting()) {
                Đang đặt bàn...
              } @else {
                Xác nhận đặt bàn
              }
              <mat-icon>check</mat-icon>
            </button>

            @if (submitError()) {
              <p class="error-msg">
                <mat-icon>error_outline</mat-icon>
                {{ submitError() }}
              </p>
            }
          </mat-card-content>
        </mat-card>
      }

      <!-- ───── SUCCESS STATE ───── -->
      @if (currentStep() === 'success') {
        <mat-card class="step-card success-card">
          <mat-card-content>
            <div class="success-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <h3 class="card-title">Đặt bàn thành công!</h3>
            <div class="success-details">
              <div class="detail-row">
                <mat-icon>table_restaurant</mat-icon>
                <span>{{ selectedTable()?.tableCode }}</span>
              </div>
              <div class="detail-row">
                <mat-icon>event</mat-icon>
                <span>{{ formatConfirmedDateTime() }}</span>
              </div>
              <div class="detail-row">
                <mat-icon>people</mat-icon>
                <span>{{ numberOfGuests() }} người</span>
              </div>
              <div class="detail-row">
                <mat-icon>timer</mat-icon>
                <span>Thời gian tối đa: {{ durationLabel() }}</span>
              </div>
            </div>
            <p class="success-note">Nhà hàng sẽ xác nhận đặt bàn sớm nhất có thể. Cảm ơn bạn!</p>
            <button type="button" class="next-btn" (click)="resetFlow()">
              Đặt bàn khác
              <mat-icon>refresh</mat-icon>
            </button>
          </mat-card-content>
        </mat-card>
      }

      <!-- Sticky Summary Footer -->
      @if (currentStep() === 'datetime' && selectedTable()) {
        <footer class="sticky-footer visible">
          <div class="summary">
            <span class="summary-item">
              <mat-icon>table_restaurant</mat-icon>
              {{ selectedTable()!.tableCode }}
            </span>
            @if (selectedDate() && selectedTime()) {
              <span class="summary-item">
                <mat-icon>event</mat-icon>
                {{ selectedDate() }} lúc {{ selectedTime() }}
              </span>
            }
          </div>
        </footer>
      }
    </section>
  `,
  styles: [`
    .reservation-flow {
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #0F0F0F;
      min-height: 100vh;
      padding: 20px;
      padding-bottom: 120px;
    }

    /* Header */
    .heading h2 {
      margin: 0;
      color: #F0F0F0;
      font-size: 28px;
      font-weight: 700;
      text-align: center;
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
    .step-btn.completed .step-num { background: #2BAE66; border-color: #2BAE66; color: #fff; }

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
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .card-title {
      margin: 0 0 20px;
      font-size: 20px;
      color: #F0F0F0;
      font-weight: 600;
      text-align: center;
    }

    /* Capacity filter */
    .capacity-filter-row {
      margin-bottom: 16px;
    }

    .cap-chips {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    /* Legend */
    .legend-row {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #A0A0A0;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .legend-item.available .legend-dot { background: #2BAE66; }
    .legend-item.booked .legend-dot { background: #E06C6C; }

    .legend-item.selected-legend .legend-dot { background: #C5A028; }

    /* Floor Plan Layout */
    .floor-plan-wrapper {
      background: #181818;
      border: 1px solid #2C2C2C;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .fp-top-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: stretch;
    }

    .fp-middle-row {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 12px;
      min-height: 260px;
    }

    .fp-main-floor {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Landmarks */
    .fp-landmark {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 10px 14px;
      background: #1E1E1E;
      border: 1px dashed #3A3A3A;
      border-radius: 10px;
      color: #5A5A5A;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-width: 70px;
    }
    .fp-landmark mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .fp-entrance {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      color: #5A5A5A;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-top: 2px dashed #3A3A3A;
    }
    .fp-entrance mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Zone */
    .fp-zone {
      background: #1A1A1A;
      border: 1px solid #2C2C2C;
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .zone-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #8A8A8A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding-bottom: 6px;
      border-bottom: 1px solid #2C2C2C;
    }
    .zone-label mat-icon { font-size: 16px; width: 16px; height: 16px; color: #C5A028; }

    .zone-tables {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .zone-empty {
      color: #3A3A3A;
      font-size: 12px;
      padding: 8px;
    }

    /* Table button */
    .fp-table {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 10px 12px;
      min-width: 72px;
      background: #242424;
      border: 2px solid #2C2C2C;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #A0A0A0;
    }
    .fp-table mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .fp-table-code { font-size: 11px; font-weight: 700; color: #F0F0F0; }
    .fp-table-cap { font-size: 10px; color: #777; }

    .fp-table.available { border-color: #2BAE66; }
    .fp-table.available:hover { background: #2C2C2C; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(43,174,102,0.2); }
    .fp-table.booked { opacity: 0.4; cursor: not-allowed; border-color: #E06C6C; }
    .fp-table.selected { background: #C5A028; border-color: #C5A028; color: #0F0F0F; }
    .fp-table.selected .fp-table-code { color: #0F0F0F; }
    .fp-table.selected .fp-table-cap { color: #0F0F0F; }

    .fp-check { position: absolute; top: -4px; right: -4px; font-size: 14px; width: 14px; height: 14px; color: #0F0F0F; background: #C5A028; border-radius: 50%; }

    .communal-table { min-width: 90px; }
    .booth-table { min-width: 80px; }

    /* Section label */
    .section-label { display: block; font-size: 13px; color: #A0A0A0; margin-bottom: 8px; font-weight: 500; }

    /* Filter / shift chips */
    .filter-chip, .shift-tab {
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
    }
    .filter-chip:hover, .shift-tab:hover { border-color: #C5A028; }
    .filter-chip.active, .shift-tab.active { background: #C5A028; border-color: #C5A028; color: #0F0F0F; }

    /* Shift tabs */
    .shift-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .shift-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      border-radius: 12px;
      padding: 10px 16px;
    }

    .shift-tab mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .shift-tab.shift-closed {
      border-color: #E06C6C;
      color: #E06C6C;
      opacity: 0.7;
    }

    .shift-closed-badge {
      margin-left: 6px;
      padding: 2px 8px;
      background: rgba(224,108,108,0.15);
      border: 1px solid #E06C6C;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 700;
      color: #E06C6C;
      text-transform: uppercase;
    }

    .time-chip.unavailable {
      background: #1A1A1A;
      color: #5A5A5A;
      text-decoration: line-through;
      cursor: not-allowed;
    }

    /* Selected recap */
    .selected-recap {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: rgba(197,160,40,0.1);
      border: 1px solid #C5A028;
      border-radius: 10px;
      color: #C5A028;
      font-size: 14px;
      margin-bottom: 20px;
    }

    /* Date chips */
    .date-section { margin-bottom: 20px; }
    .date-chips { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; }
    .date-chip {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 12px 14px; min-width: 64px; background: #242424;
      border: 1px solid #2C2C2C; border-radius: 12px; cursor: pointer;
      transition: all 0.2s ease; flex-shrink: 0;
    }
    .date-chip:hover { border-color: #C5A028; }
    .date-chip.active { background: #C5A028; border-color: #C5A028; }
    .date-chip.today { border-color: #2BAE66; }
    .date-chip .day-name { font-size: 10px; color: #A0A0A0; text-transform: uppercase; }
    .date-chip .day-num { font-size: 20px; font-weight: 700; color: #F0F0F0; }
    .date-chip .month-name { font-size: 10px; color: #A0A0A0; text-transform: uppercase; }
    .date-chip.active .day-name, .date-chip.active .day-num, .date-chip.active .month-name { color: #0F0F0F; }

    /* Time chips */
    .time-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
    .time-chip {
      padding: 10px 18px; background: #242424; border: 1px solid #2C2C2C;
      border-radius: 20px; color: #F0F0F0; font-weight: 500; font-size: 14px;
      cursor: pointer; transition: all 0.2s ease;
    }
    .time-chip:hover { border-color: #C5A028; }
    .time-chip.active { background: #C5A028; border-color: #C5A028; color: #0F0F0F; }

    /* Guest stepper */
    .guests-row { margin-bottom: 20px; }
    .guest-stepper { display: flex; align-items: center; gap: 20px; margin-top: 8px; }
    .stepper-btn {
      width: 44px; height: 44px; border-radius: 50%; background: #242424;
      border: 2px solid #C5A028; color: #C5A028; cursor: pointer;
      display: grid; place-items: center; transition: all 0.2s ease;
    }
    .stepper-btn:hover:not(:disabled) { background: #C5A028; color: #0F0F0F; }
    .stepper-btn:disabled { border-color: #2C2C2C; color: #5A5A5A; cursor: not-allowed; }
    .stepper-btn mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .guest-count { font-size: 20px; font-weight: 700; color: #C5A028; min-width: 80px; text-align: center; }

    /* Notes */
    .notes-field { width: 100%; margin-bottom: 4px; }
    ::ng-deep .notes-field .mat-mdc-text-field-wrapper { background: #242424; border-radius: 12px; }
    ::ng-deep .mat-mdc-form-field-label, ::ng-deep .mat-mdc-input-element { color: #F0F0F0 !important; }
    ::ng-deep .mat-mdc-notch-piece { border-color: #2C2C2C !important; }
    ::ng-deep .mat-focused .mat-mdc-notch-piece { border-color: #C5A028 !important; }

    /* Buttons */
    .next-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 16px; border-radius: 12px; background: #C5A028;
      border: none; color: #0F0F0F; font-weight: 600; font-size: 16px;
      cursor: pointer; transition: all 0.2s ease; margin-top: 8px;
    }
    .next-btn:hover:not(:disabled) { background: #D4AF37; }
    .next-btn:disabled { background: #242424; color: #5A5A5A; cursor: not-allowed; }

    /* Error */
    .error-msg {
      display: flex; align-items: center; gap: 8px; margin-top: 12px;
      padding: 12px; background: rgba(224,108,108,0.1);
      border: 1px solid #E06C6C; border-radius: 8px; color: #E06C6C; font-size: 14px;
    }

    /* Hint */
    .hint {
      display: flex; align-items: center; gap: 8px; padding: 12px;
      background: rgba(224,108,108,0.1); border-radius: 8px;
      color: #E06C6C; font-size: 14px; margin-bottom: 16px;
    }

    /* Success card */
    .success-card { text-align: center; }
    .success-icon mat-icon { font-size: 64px; width: 64px; height: 64px; color: #2BAE66; }
    .success-details { display: flex; flex-direction: column; gap: 12px; margin: 20px 0; text-align: left; }
    .detail-row { display: flex; align-items: center; gap: 10px; color: #F0F0F0; font-size: 15px; }
    .detail-row mat-icon { color: #C5A028; flex-shrink: 0; }
    .success-note { color: #A0A0A0; font-size: 14px; margin-bottom: 20px; }

    /* Skeleton */
    .floor-plan-skeleton {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .skeleton-zone {
      height: 140px; border-radius: 12px;
      background: linear-gradient(90deg, #242424 25%, #2C2C2C 50%, #242424 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Sticky Footer */
    .sticky-footer {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #1A1A1A; border-top: 1px solid #2C2C2C;
      padding: 12px 20px; z-index: 100;
    }
    .summary { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
    .summary-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #A0A0A0; }
    .summary-item mat-icon { font-size: 16px; width: 16px; height: 16px; color: #C5A028; }

    @media (max-width: 640px) {
      .reservation-flow { padding: 16px; padding-bottom: 120px; }
      .fp-top-row { grid-template-columns: 1fr; }
      .fp-top-row .fp-landmark { display: none; }
      .fp-middle-row { grid-template-columns: 1fr; }
      .shift-tabs { flex-direction: column; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerReservationComponent implements OnInit {

  // ── State ──
  currentStep = signal<'table' | 'datetime' | 'success'>('table');
  isLoading = signal(true);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);

  allTables = signal<TableResponse[]>([]);
  selectedTableId = signal<number | null>(null);
  selectedTable = signal<TableResponse | null>(null);

  minCapacity = signal<number>(2);
  selectedDate = signal<string>('');
  selectedTime = signal<string>('');
  numberOfGuests = signal<number>(2);
  activeShift = signal<'morning' | 'evening'>('morning');
  note = '';

  readonly capacityOptions = [2, 4, 6, 8, 10];

  readonly steps = [
    { id: 'table', label: 'Chọn bàn' },
    { id: 'datetime', label: 'Thời gian' },
  ] as const;

  readonly dateOptions: DateOption[] = this.generateDateOptions();

  // ── Computed ──

  readonly filteredTables = computed(() => {
    const min = this.minCapacity();
    return this.allTables().filter(t => t.capacity >= min);
  });

  readonly zones = computed(() => {
    const tables = this.filteredTables();
    return {
      bar: tables.filter(t => t.capacity <= 2),
      dining: tables.filter(t => t.capacity >= 3 && t.capacity <= 4),
      booth: tables.filter(t => t.capacity >= 5 && t.capacity <= 6),
      communal: tables.filter(t => t.capacity >= 7)
    };
  });

  readonly currentShiftSlots = computed((): TimeSlot[] =>
    this.activeShift() === 'morning' ? MORNING_SLOTS : EVENING_SLOTS
  );

  readonly shiftStatus = computed(() => {
    const isToday = this.selectedDate() === new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMin = isToday ? now.getHours() * 60 + now.getMinutes() : -1;
    const isClosed = (s: typeof SERVICE_SESSIONS.morning) =>
      currentMin >= 0 && (currentMin >= s.cutoffHour * 60 + s.cutoffMin || currentMin >= s.endHour * 60);
    return {
      morning: { closed: isClosed(SERVICE_SESSIONS.morning) },
      evening: { closed: isClosed(SERVICE_SESSIONS.evening) }
    };
  });

  readonly durationLabel = computed(() => {
    const cap = this.selectedTable()?.capacity ?? 0;
    const mins = maxDurationMinutes(cap);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} tiếng ${m} phút` : `${h} tiếng`;
  });

  constructor(
    private readonly reservationService: ReservationService,
    private readonly router: Router,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Guard: chỉ cho phép truy cập nếu đã đăng nhập
    const token = localStorage.getItem('rms-token');
    if (!token) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.reservationService.getAvailableTables().subscribe({
      next: tables => {
        this.allTables.set(tables);
        this.isLoading.set(false);
      },
      error: (err) => {
        // Token hết hạn hoặc không hợp lệ → redirect về login
        if (err?.status === 401 || err?.status === 403) {
          localStorage.removeItem('rms-token');
          this.router.navigateByUrl('/login');
        }
        this.isLoading.set(false);
      }
    });
  }

  // ── Helpers ──

  isSlotPast(slotValue: string): boolean {
    const isToday = this.selectedDate() === new Date().toISOString().split('T')[0];
    if (!isToday) return false;
    const [h, m] = slotValue.split(':').map(Number);
    const now = new Date();
    return h < now.getHours() || (h === now.getHours() && m <= now.getMinutes());
  }

  // ── Navigation ──

  goToStep(step: 'table' | 'datetime' | 'success'): void {
    this.currentStep.set(step);
  }

  isStepCompleted(stepId: string): boolean {
    if (stepId === 'table') return !!this.selectedTableId() && this.currentStep() !== 'table';
    if (stepId === 'datetime') return !!this.selectedDate() && !!this.selectedTime() && this.currentStep() === 'success';
    return false;
  }

  canAccessStep(stepId: string): boolean {
    if (stepId === 'table') return true;
    if (stepId === 'datetime') return !!this.selectedTableId();
    return false;
  }

  // ── Table Selection ──

  selectTable(table: TableResponse): void {
    if (table.status !== 'trong') return;
    this.selectedTableId.set(table.id);
    this.selectedTable.set(table);
    // Ensure guests don't exceed capacity
    if (this.numberOfGuests() > table.capacity) {
      this.numberOfGuests.set(table.capacity);
    }
  }

  // ── Date helpers ──

  private generateDateOptions(): DateOption[] {
    const options: DateOption[] = [];
    const today = new Date();
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const months = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      options.push({
        date: d,
        dayName: days[d.getDay()],
        dayNum: d.getDate(),
        monthName: months[d.getMonth()],
        value: d.toISOString().split('T')[0],
        isToday: i === 0
      });
    }
    return options;
  }

  formatConfirmedDateTime(): string {
    if (!this.selectedDate() || !this.selectedTime()) return '';
    return `${this.selectedDate()} lúc ${this.selectedTime()}`;
  }

  // ── Submit Reservation ──

  confirmReservation(): void {
    if (!this.selectedTable() || !this.selectedDate() || !this.selectedTime()) return;

    const userIdStr = localStorage.getItem('rms-user-id');
    const customerId = userIdStr && !isNaN(Number(userIdStr)) ? Number(userIdStr) : null;

    if (!customerId) {
      this.submitError.set('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      this.router.navigateByUrl('/login');
      return;
    }

    // Build ISO datetime: YYYY-MM-DDTHH:mm:00
    const reservationTime = `${this.selectedDate()}T${this.selectedTime()}:00`;

    const payload = {
      tableId: this.selectedTable()!.id,
      customerId,
      numberOfGuests: this.numberOfGuests(),
      reservationTime,
      note: this.note.trim() || undefined
    };

    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.reservationService.createReservation(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.currentStep.set('success');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.submitError.set(err?.message ?? 'Đặt bàn thất bại. Vui lòng thử lại.');
      }
    });
  }

  // ── Reset ──

  resetFlow(): void {
    this.selectedTableId.set(null);
    this.selectedTable.set(null);
    this.selectedDate.set('');
    this.selectedTime.set('');
    this.numberOfGuests.set(2);
    this.note = '';
    this.submitError.set(null);
    this.currentStep.set('table');
  }
}
