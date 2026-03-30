import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { DiningTable, TableStatus } from '../../core/models/app.models';
import { TableSessionService } from '../../core/services/table-session.service';
import { StaffTableService } from '../../core/services/staff-table.service';
import {
  CustomerReservationFlowService,
  CustomerReservation
} from '../../core/services/customer-reservation-flow.service';

@Component({
  selector: 'app-waiter-tables',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <section class="floor-page">
      <!-- Header -->
      <header class="floor-header">
        <div>
          <h2>Table Layout</h2>
          <p class="subtitle">View all tables and their live status from the system.</p>
        </div>
        <div class="header-right">
          <div class="header-stats">
            <span class="stat stat-open"><span class="dot dot-open"></span>{{ freeCount() }} Open</span>
            <span class="stat stat-reserved"><span class="dot dot-reserved"></span>{{ bookedCount() }} Reserved</span>
            <span class="stat stat-serving"><span class="dot dot-serving"></span>{{ servingCount() }} Serving</span>
            <span class="stat stat-disabled"><span class="dot dot-disabled"></span>{{ disabledCount() }} Maintenance</span>
          </div>
          <button class="reload-btn" (click)="loadTables()" [disabled]="isLoading()">
            <mat-icon [class.spinning]="isLoading()">refresh</mat-icon>
            Reload
          </button>
        </div>
      </header>

      <!-- Error Banner -->
      @if (loadError()) {
        <div class="error-banner">
          <mat-icon>error_outline</mat-icon>
          <span>{{ loadError() }}</span>
          <button (click)="loadTables()">Retry</button>
        </div>
      }

      <!-- Loading skeleton -->
      @if (isLoading()) {
        <div class="skeleton-grid">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="skeleton-table"></div>
          }
        </div>
      }

      <!-- Reservation Notification Banner -->
      @if (pendingReservations().length > 0) {
        <div class="reservation-banner">
          <mat-icon>notification_important</mat-icon>
          <span>{{ pendingReservations().length }} new online reservation(s) awaiting your review</span>
          <button class="banner-btn" (click)="showReservationList.set(true)">Review</button>
        </div>
      }

      <!-- Floor Plan -->
      @if (!isLoading()) {
        <div class="floor-plan-wrapper">
        <!-- Top row: Restrooms + Bar Area + Kitchen -->
        <div class="fp-top-row">
          <div class="fp-landmark">
            <mat-icon>wc</mat-icon>
            <span>Restrooms</span>
          </div>
          <div class="fp-zone bar-zone">
            <div class="zone-label"><mat-icon>local_bar</mat-icon> Bar Area</div>
            <div class="zone-tables">
              @for (table of zones().bar; track table.id) {
                <button type="button"
                  [class]="'fp-table ' + statusClass(table) + (hasReservation(table.id) ? ' has-reservation' : '')"
                  (click)="handleTableClick(table)">
                  @if (hasReservation(table.id)) { <span class="reservation-dot"></span> }
                  <mat-icon>deck</mat-icon>
                  <span class="fp-table-code">{{ table.name }}</span>
                  <span class="fp-table-cap">{{ table.capacity }}p</span>
                  @if (table.status === 'serving' && table.guests) {
                    <span class="fp-table-guests">{{ table.guests }}g</span>
                  }
                </button>
              }
              @if (zones().bar.length === 0) { <span class="zone-empty">—</span> }
            </div>
          </div>
          <div class="fp-landmark">
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
                <button type="button"
                  [class]="'fp-table booth-table ' + statusClass(table) + (hasReservation(table.id) ? ' has-reservation' : '')"
                  (click)="handleTableClick(table)">
                  @if (hasReservation(table.id)) { <span class="reservation-dot"></span> }
                  <mat-icon>weekend</mat-icon>
                  <span class="fp-table-code">{{ table.name }}</span>
                  <span class="fp-table-cap">{{ table.capacity }}p</span>
                  @if (table.status === 'serving' && table.guests) {
                    <span class="fp-table-guests">{{ table.guests }}g</span>
                  }
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
                  <button type="button"
                    [class]="'fp-table communal-table ' + statusClass(table) + (hasReservation(table.id) ? ' has-reservation' : '')"
                    (click)="handleTableClick(table)">
                    @if (hasReservation(table.id)) { <span class="reservation-dot"></span> }
                    <mat-icon>table_bar</mat-icon>
                    <span class="fp-table-code">{{ table.name }}</span>
                    <span class="fp-table-cap">{{ table.capacity }}p</span>
                    @if (table.status === 'serving' && table.guests) {
                      <span class="fp-table-guests">{{ table.guests }}g</span>
                    }
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
                  <button type="button"
                    [class]="'fp-table ' + statusClass(table) + (hasReservation(table.id) ? ' has-reservation' : '')"
                    (click)="handleTableClick(table)">
                    @if (hasReservation(table.id)) { <span class="reservation-dot"></span> }
                    <mat-icon>table_restaurant</mat-icon>
                    <span class="fp-table-code">{{ table.name }}</span>
                    <span class="fp-table-cap">{{ table.capacity }}p</span>
                    @if (table.status === 'serving' && table.guests) {
                      <span class="fp-table-guests">{{ table.guests }}g</span>
                    }
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
      }

      <!-- ═══ Guest Count Modal ═══ -->
      @if (guestModal()) {
        <div class="backdrop" (click)="guestModal.set(null)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Open {{ guestModal()!.name }}</h3>
            <p class="modal-sub">Select the number of guests (max {{ guestModal()!.capacity }})</p>

            <div class="guest-grid">
              @for (n of guestOptions(); track n) {
                <button class="guest-btn" [class.active]="guestCount() === n" (click)="guestCount.set(n)">{{ n }}</button>
              }
            </div>

            <div class="modal-actions">
              <button class="cancel-btn" (click)="guestModal.set(null)">Cancel</button>
              <button class="confirm-btn" (click)="confirmOpen()">Open Table</button>
            </div>
          </div>
        </div>
      }

      <!-- ═══ Reservation Detail Modal (Accept/Decline) ═══ -->
      @if (reservationModal()) {
        <div class="backdrop" (click)="reservationModal.set(null)">
          <div class="modal reservation-modal" (click)="$event.stopPropagation()">
            <mat-icon class="res-icon">event_available</mat-icon>
            <h3>Online Reservation</h3>
            <p class="modal-sub">A customer has booked this table online.</p>

            <div class="res-details">
              <div class="res-row">
                <mat-icon>table_restaurant</mat-icon>
                <span>{{ reservationModal()!.table.name }}</span>
              </div>
              <div class="res-row">
                <mat-icon>people</mat-icon>
                <span>{{ reservationModal()!.guests }} guests</span>
              </div>
              <div class="res-row">
                <mat-icon>event</mat-icon>
                <span>{{ reservationModal()!.date }}</span>
              </div>
              <div class="res-row">
                <mat-icon>schedule</mat-icon>
                <span>{{ reservationModal()!.time }}</span>
              </div>
            </div>

            <div class="modal-actions">
              <button class="decline-btn" (click)="declineReservation()">
                <mat-icon>close</mat-icon> Decline
              </button>
              <button class="accept-btn" (click)="acceptReservation()">
                <mat-icon>check</mat-icon> Accept
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ═══ Reservation List Popup ═══ -->
      @if (showReservationList()) {
        <div class="backdrop" (click)="showReservationList.set(false)">
          <div class="modal res-list-modal" (click)="$event.stopPropagation()">
            <h3>Pending Reservations</h3>
            <p class="modal-sub">{{ pendingReservations().length }} reservation(s) need review</p>

            <div class="res-list">
              @for (res of pendingReservations(); track res.id) {
                <div class="res-list-item">
                  <div class="res-list-info">
                    <span class="res-table">{{ res.table.name }}</span>
                    <span class="res-time">{{ res.date }} · {{ res.time }} · {{ res.guests }}p</span>
                  </div>
                  <div class="res-list-actions">
                    <button class="icon-decline" (click)="declineById(res.id)">
                      <mat-icon>close</mat-icon>
                    </button>
                    <button class="icon-accept" (click)="acceptById(res.id)">
                      <mat-icon>check</mat-icon>
                    </button>
                  </div>
                </div>
              }
            </div>

            <button class="cancel-btn full-width" (click)="showReservationList.set(false)">Close</button>
          </div>
        </div>
      }

      <!-- ═══ Reservation Notification Toast ═══ -->
      @if (newReservationToast()) {
        <div class="toast" (click)="viewReservationToast()">
          <mat-icon>notifications_active</mat-icon>
          <div class="toast-body">
            <strong>New Reservation!</strong>
            <span>{{ newReservationToast()!.table.name }} · {{ newReservationToast()!.guests }} guests · {{ newReservationToast()!.time }}</span>
          </div>
          <button class="toast-close" (click)="newReservationToast.set(null); $event.stopPropagation()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }
    </section>
  `,
  styles: [`
    .floor-page { display: flex; flex-direction: column; gap: 16px; }

    /* Header */
    .floor-header {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
    }
    .floor-header h2 { margin: 0; font-size: 24px; font-weight: 700; color: #1e293b; }
    .subtitle { margin: 4px 0 0; color: #64748b; font-size: 14px; }

    .header-right { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .header-stats { display: flex; gap: 16px; flex-wrap: wrap; }
    .stat {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600; color: #475569;
    }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .dot-open { background: #22c55e; }
    .dot-reserved { background: #3b82f6; }
    .dot-serving { background: #eab308; }
    .dot-disabled { background: #9ca3af; }

    .reload-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 10px; border: 1px solid #e2e8f0;
      background: #fff; font-size: 13px; font-weight: 600; color: #475569;
      cursor: pointer; transition: all 0.15s;
    }
    .reload-btn:hover { border-color: #ff6a33; color: #ff6a33; }
    .reload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .reload-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .spinning { animation: spin 1s linear infinite; }

    /* Error Banner */
    .error-banner {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 20px; background: #fef2f2;
      border: 1px solid #fca5a5; border-radius: 14px;
    }
    .error-banner mat-icon { color: #dc2626; }
    .error-banner span { flex: 1; font-size: 14px; color: #dc2626; }
    .error-banner button {
      padding: 6px 14px; border-radius: 8px; border: none;
      background: #dc2626; color: #fff; font-size: 13px; cursor: pointer;
    }

    /* Skeleton */
    .skeleton-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px;
      padding: 20px; background: #f1f5f9; border-radius: 20px;
    }
    .skeleton-table {
      height: 100px; border-radius: 14px;
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Reservation Banner */
    .reservation-banner {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 20px; background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border: 1px solid #93c5fd; border-radius: 14px;
    }
    .reservation-banner mat-icon { color: #3b82f6; font-size: 24px; width: 24px; height: 24px; }
    .reservation-banner span { flex: 1; font-size: 14px; font-weight: 500; color: #1e40af; }
    .banner-btn {
      padding: 8px 18px; border-radius: 10px; border: none;
      background: #3b82f6; color: #fff; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
    }
    .banner-btn:hover { background: #2563eb; }

    /* Floor Plan */
    .floor-plan-wrapper {
      background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 20px;
      padding: 20px; display: flex; flex-direction: column; gap: 16px;
    }

    .fp-top-row {
      display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: stretch;
    }

    .fp-middle-row {
      display: grid; grid-template-columns: 1fr 2fr; gap: 12px; min-height: 200px;
    }

    .fp-main-floor {
      display: flex; flex-direction: column; gap: 12px;
    }

    .fp-landmark {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; padding: 12px 16px; background: #e2e8f0; border: 1px dashed #94a3b8;
      border-radius: 12px; color: #64748b; font-size: 10px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.5px; min-width: 70px;
    }
    .fp-landmark mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .fp-entrance {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px; color: #64748b; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 1px;
      border-top: 2px dashed #94a3b8;
    }
    .fp-entrance mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .fp-zone {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
      padding: 14px; display: flex; flex-direction: column; gap: 10px;
    }
    .zone-label {
      display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;
      color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;
      padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;
    }
    .zone-label mat-icon { font-size: 16px; width: 16px; height: 16px; color: #ff6a33; }

    .zone-tables { display: flex; flex-wrap: wrap; gap: 10px; }
    .zone-empty { color: #94a3b8; font-size: 12px; padding: 8px; }

    /* Table Button */
    .fp-table {
      position: relative; display: flex; flex-direction: column; align-items: center; gap: 3px;
      padding: 12px 14px; min-width: 80px; background: #fff;
      border: 2px solid #e2e8f0; border-radius: 14px; cursor: pointer;
      transition: all 0.2s ease; color: #64748b;
    }
    .fp-table mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .fp-table-code { font-size: 12px; font-weight: 700; color: #1e293b; }
    .fp-table-cap { font-size: 10px; color: #94a3b8; }
    .fp-table-guests { font-size: 10px; font-weight: 600; color: #92400e; }

    .communal-table { min-width: 90px; }
    .booth-table { min-width: 80px; }

    /* Status colors: green=open, yellow=reserved, blue=pending reservation, grey=disabled */

    .fp-table.status-available { border-color: #22c55e; }
    .fp-table.status-available mat-icon { color: #22c55e; }
    .fp-table.status-available:hover { background: #f0fdf4; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(34,197,94,0.15); }

    /* da_dat = Đã đặt (blue/booked) */
    .fp-table.status-da_dat { border-color: #3b82f6; background: #eff6ff; }
    .fp-table.status-da_dat mat-icon { color: #3b82f6; }
    .fp-table.status-da_dat:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59,130,246,0.15); }

    /* dang_phuc_vu = Đang phục vụ (yellow) */
    .fp-table.status-serving,
    .fp-table.status-dang_phuc_vu { border-color: #eab308; background: #fefce8; }
    .fp-table.status-serving mat-icon,
    .fp-table.status-dang_phuc_vu mat-icon { color: #eab308; }
    .fp-table.status-serving:hover,
    .fp-table.status-dang_phuc_vu:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(234,179,8,0.15); }

    .fp-table.status-pending-payment { border-color: #eab308; background: #fefce8; }
    .fp-table.status-pending-payment mat-icon { color: #eab308; }
    .fp-table.status-pending-payment:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(234,179,8,0.15); }

    /* bao_tri = Bảo trì (grey) */
    .fp-table.status-disabled,
    .fp-table.status-bao_tri { border-color: #9ca3af; background: #f3f4f6; opacity: 0.55; cursor: not-allowed; }
    .fp-table.status-disabled mat-icon,
    .fp-table.status-bao_tri mat-icon { color: #9ca3af; }

    .fp-table.has-reservation { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }
    .reservation-dot {
      position: absolute; top: -4px; right: -4px;
      width: 12px; height: 12px; border-radius: 50%; background: #3b82f6;
      border: 2px solid #fff;
      animation: pulse-dot 1.5s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.3); }
    }

    /* ─── Backdrop & Modal ─── */
    .backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      display: grid; place-items: center; z-index: 1000;
    }
    .modal {
      width: min(92vw, 420px); background: #fff; border-radius: 20px;
      padding: 28px; text-align: center; color: #1e293b;
    }
    .modal h3 { margin: 0 0 4px; font-size: 20px; font-weight: 700; }
    .modal-sub { margin: 0 0 20px; color: #64748b; font-size: 14px; }

    /* Guest Grid (1-10) */
    .guest-grid {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 24px;
    }
    .guest-btn {
      width: 100%; aspect-ratio: 1; border-radius: 12px; border: 1px solid #e2e8f0;
      background: #f8fafc; font-size: 18px; font-weight: 700; color: #475569;
      cursor: pointer; transition: all 0.15s; display: grid; place-items: center;
    }
    .guest-btn:hover { border-color: #ff6a33; color: #ff6a33; }
    .guest-btn.active { background: #ff6a33; color: #fff; border-color: #ff6a33; }

    .modal-actions { display: flex; gap: 10px; }
    .cancel-btn {
      flex: 1; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;
      background: #fff; font-size: 15px; font-weight: 600; color: #64748b; cursor: pointer;
    }
    .cancel-btn.full-width { margin-top: 16px; }
    .confirm-btn {
      flex: 1; padding: 12px; border-radius: 12px; border: none;
      background: #ff6a33; font-size: 15px; font-weight: 600; color: #fff; cursor: pointer;
    }
    .confirm-btn:hover { background: #e85d2a; }

    /* Reservation Detail Modal */
    .reservation-modal { text-align: center; }
    .res-icon { font-size: 48px; width: 48px; height: 48px; color: #3b82f6; margin-bottom: 8px; }
    .res-details {
      display: flex; flex-direction: column; gap: 10px;
      margin-bottom: 24px; text-align: left;
      padding: 16px; background: #f8fafc; border-radius: 12px;
    }
    .res-row { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #334155; }
    .res-row mat-icon { font-size: 18px; width: 18px; height: 18px; color: #3b82f6; }

    .decline-btn, .accept-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 12px; border-radius: 12px; border: none;
      font-size: 15px; font-weight: 600; cursor: pointer;
    }
    .decline-btn { background: #fef2f2; color: #dc2626; }
    .decline-btn:hover { background: #fee2e2; }
    .accept-btn { background: #10b981; color: #fff; }
    .accept-btn:hover { background: #059669; }
    .decline-btn mat-icon, .accept-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Reservation List Modal */
    .res-list-modal { max-height: 80vh; display: flex; flex-direction: column; }
    .res-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; max-height: 400px; }
    .res-list-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 14px; background: #f8fafc; border-radius: 12px; gap: 10px;
    }
    .res-list-info { display: flex; flex-direction: column; gap: 2px; }
    .res-table { font-size: 14px; font-weight: 600; color: #1e293b; }
    .res-time { font-size: 12px; color: #64748b; }
    .res-list-actions { display: flex; gap: 6px; }
    .icon-decline, .icon-accept {
      width: 36px; height: 36px; border-radius: 10px; border: none;
      display: grid; place-items: center; cursor: pointer;
    }
    .icon-decline { background: #fee2e2; color: #dc2626; }
    .icon-decline:hover { background: #fecaca; }
    .icon-accept { background: #d1fae5; color: #065f46; }
    .icon-accept:hover { background: #a7f3d0; }
    .icon-decline mat-icon, .icon-accept mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Toast Notification */
    .toast {
      position: fixed; bottom: 24px; right: 24px; z-index: 1100;
      display: flex; align-items: center; gap: 12px;
      padding: 16px 20px; background: #fff; border-radius: 16px;
      border-left: 4px solid #3b82f6; box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      cursor: pointer; animation: slide-in 0.3s ease-out;
      max-width: 380px;
    }
    @keyframes slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .toast mat-icon { color: #3b82f6; font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; }
    .toast-body { display: flex; flex-direction: column; gap: 2px; }
    .toast-body strong { font-size: 14px; color: #1e293b; }
    .toast-body span { font-size: 12px; color: #64748b; }
    .toast-close {
      width: 28px; height: 28px; border-radius: 50%; border: none;
      background: #f1f5f9; color: #64748b; cursor: pointer;
      display: grid; place-items: center; flex-shrink: 0;
    }
    .toast-close mat-icon { font-size: 16px; width: 16px; height: 16px; }

    @media (max-width: 640px) {
      .floor-header { flex-direction: column; align-items: flex-start; }
      .fp-top-row { grid-template-columns: 1fr; }
      .fp-top-row .fp-landmark { display: none; }
      .fp-middle-row { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WaiterTablesComponent implements OnInit {
  private readonly tableSessionService = inject(TableSessionService);
  private readonly staffTableService = inject(StaffTableService);
  private readonly reservationFlow = inject(CustomerReservationFlowService);
  private readonly router = inject(Router);

  // Live tables from API (overrides mock)
  readonly apiTables = signal<(DiningTable & { _rawStatus: string })[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  // Merge: prefer API tables if loaded, fallback to mock
  readonly tables = computed(() =>
    this.apiTables().length > 0 ? this.apiTables() : this.tableSessionService.tables()
  );

  readonly guestModal = signal<DiningTable | null>(null);
  readonly guestCount = signal(2);
  readonly reservationModal = signal<CustomerReservation | null>(null);
  readonly showReservationList = signal(false);
  readonly newReservationToast = signal<CustomerReservation | null>(null);

  readonly pendingReservations = this.reservationFlow.pendingReservations;

  readonly freeCount = computed(() =>
    this.apiTables().filter(t => (t as any)._rawStatus === 'trong').length
  );
  readonly bookedCount = computed(() =>
    this.apiTables().filter(t => (t as any)._rawStatus === 'da_dat').length
  );
  readonly servingCount = computed(() =>
    this.apiTables().filter(t => (t as any)._rawStatus === 'dang_phuc_vu').length
  );
  readonly disabledCount = computed(() =>
    this.apiTables().filter(t => (t as any)._rawStatus === 'bao_tri').length
  );
  readonly reservedCount = computed(() => this.pendingReservations().length);

  // legacy mock counts (used when API not loaded)
  readonly occupiedCount = computed(() => this.tables().filter(t => t.status === 'serving').length);
  readonly pendingCount = computed(() => this.tables().filter(t => t.status === 'pending-payment').length);

  /** Guest options: 1 to min(10, table capacity) */
  readonly guestOptions = computed(() => {
    const cap = Math.min(this.guestModal()?.capacity ?? 10, 10);
    return Array.from({ length: cap }, (_, i) => i + 1);
  });

  /** Group tables by capacity into zones */
  readonly zones = computed(() => {
    const tables = this.apiTables().length > 0 ? this.apiTables() : this.tableSessionService.tables();
    return {
      bar: tables.filter(t => t.capacity <= 2),
      dining: tables.filter(t => t.capacity >= 3 && t.capacity <= 4),
      booth: tables.filter(t => t.capacity >= 5 && t.capacity <= 6),
      communal: tables.filter(t => t.capacity >= 7)
    };
  });

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.staffTableService.getAllTablesForStaff().subscribe({
      next: tables => {
        this.apiTables.set(tables);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.loadError.set('Không thể tải danh sách bàn. Vui lòng thử lại.');
        this.isLoading.set(false);
        console.error('StaffTableService error:', err);
      }
    });
  }

  handleTableClick(table: DiningTable): void {
    if (table.status === 'disabled') return;

    // Check if this table has a pending reservation
    const reservation = this.reservationFlow.getPendingForTable(table.id);
    if (reservation) {
      this.reservationModal.set(reservation);
      return;
    }

    if (table.status === 'available') {
      this.guestCount.set(2);
      this.guestModal.set(table);
      return;
    }

    this.router.navigate(['/staff/tables', table.id], { replaceUrl: true });
  }

  confirmOpen(): void {
    const table = this.guestModal();
    if (!table) return;
    this.tableSessionService.openTable(table.id, this.guestCount());
    this.guestModal.set(null);
    this.router.navigate(['/staff/tables', table.id], { replaceUrl: true });
  }

  acceptReservation(): void {
    const res = this.reservationModal();
    if (!res) return;
    this.reservationFlow.acceptReservation(res.id);
    this.reservationModal.set(null);
  }

  declineReservation(): void {
    const res = this.reservationModal();
    if (!res) return;
    this.reservationFlow.declineReservation(res.id);
    this.reservationModal.set(null);
  }

  acceptById(id: number): void {
    this.reservationFlow.acceptReservation(id);
  }

  declineById(id: number): void {
    this.reservationFlow.declineReservation(id);
  }

  viewReservationToast(): void {
    const res = this.newReservationToast();
    if (res) {
      this.reservationModal.set(res);
      this.newReservationToast.set(null);
    }
  }

  hasReservation(tableId: number): boolean {
    return !!this.reservationFlow.getPendingForTable(tableId);
  }

  /** Build class string using rawStatus when available for accurate styling */
  statusClass(table: DiningTable): string {
    const raw = (table as any)._rawStatus;
    if (raw) return 'status-' + raw;
    return 'status-' + table.status;
  }

  statusLabel(status: TableStatus | string): string {
    // Handle backend enum values
    if (status === 'trong') return 'Trống';
    if (status === 'da_dat') return 'Đã đặt';
    if (status === 'dang_phuc_vu') return 'Đang phục vụ';
    if (status === 'bao_tri') return 'Bảo trì';
    // Handle frontend values
    if (status === 'available') return 'Trống';
    if (status === 'serving') return 'Phục vụ';
    if (status === 'pending-payment') return 'Chờ thanh toán';
    return 'Vô hiệu';
  }
}
