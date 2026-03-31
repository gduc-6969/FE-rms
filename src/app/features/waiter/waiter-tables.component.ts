import {
  ChangeDetectionStrategy, Component, OnInit,
  computed, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { DiningTable } from '../../core/models/app.models';
import { StaffTableService } from '../../core/services/staff-table.service';

@Component({
  selector: 'app-waiter-tables',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <section class="floor-page">
      <!-- Header -->
      <header class="floor-header">
        <div>
          <h2>Table Layout</h2>
          <p class="subtitle">View and manage all tables in real time.</p>
        </div>
        <div class="header-right">
          <div class="header-stats">
            <span class="stat"><span class="dot dot-open"></span>{{ freeCount() }} Open</span>
            <span class="stat"><span class="dot dot-serving"></span>{{ servingCount() }} Serving</span>
            <span class="stat"><span class="dot dot-reserved"></span>{{ bookedCount() }} Reserved</span>
            <span class="stat"><span class="dot dot-disabled"></span>{{ disabledCount() }} Maintenance</span>
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
                    [class]="'fp-table ' + statusClass(table)"
                    (click)="handleTableClick(table)">
                    <mat-icon>deck</mat-icon>
                    <span class="fp-table-code">{{ table.name }}</span>
                    <span class="fp-table-cap">{{ table.capacity }}p</span>
                    <span class="fp-table-status-label">{{ statusLabel(table) }}</span>
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
                    [class]="'fp-table booth-table ' + statusClass(table)"
                    (click)="handleTableClick(table)">
                    <mat-icon>weekend</mat-icon>
                    <span class="fp-table-code">{{ table.name }}</span>
                    <span class="fp-table-cap">{{ table.capacity }}p</span>
                    <span class="fp-table-status-label">{{ statusLabel(table) }}</span>
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
                      [class]="'fp-table communal-table ' + statusClass(table)"
                      (click)="handleTableClick(table)">
                      <mat-icon>table_bar</mat-icon>
                      <span class="fp-table-code">{{ table.name }}</span>
                      <span class="fp-table-cap">{{ table.capacity }}p</span>
                      <span class="fp-table-status-label">{{ statusLabel(table) }}</span>
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
                      [class]="'fp-table ' + statusClass(table)"
                      (click)="handleTableClick(table)">
                      <mat-icon>table_restaurant</mat-icon>
                      <span class="fp-table-code">{{ table.name }}</span>
                      <span class="fp-table-cap">{{ table.capacity }}p</span>
                      <span class="fp-table-status-label">{{ statusLabel(table) }}</span>
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

      <!-- ═══ Guest Count Modal (Open Table) ═══ -->
      @if (guestModal()) {
        <div class="backdrop" (click)="guestModal.set(null)">
          <div class="modal" (click)="$event.stopPropagation()">
            <mat-icon class="modal-icon open-icon">table_restaurant</mat-icon>
            <h3>Open {{ guestModal()!.name }}</h3>
            <p class="modal-sub">Select number of guests (max {{ guestModal()!.capacity }})</p>

            <div class="guest-grid">
              @for (n of guestOptions(); track n) {
                <button class="guest-btn" [class.active]="guestCount() === n" (click)="guestCount.set(n)">{{ n }}</button>
              }
            </div>

            <div class="modal-actions">
              <button class="cancel-btn" (click)="guestModal.set(null)">Cancel</button>
              <button class="confirm-btn" (click)="confirmOpenTable()">
                Open Table
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ═══ Success Toast ═══ -->
      @if (successToast()) {
        <div class="toast success">
          <mat-icon>check_circle</mat-icon>
          <span>{{ successToast() }}</span>
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
    .stat { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #475569; }
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
      height: 110px; border-radius: 14px;
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Floor Plan */
    .floor-plan-wrapper {
      background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 20px;
      padding: 20px; display: flex; flex-direction: column; gap: 16px;
    }
    .fp-top-row { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: stretch; }
    .fp-middle-row { display: grid; grid-template-columns: 1fr 2fr; gap: 12px; min-height: 200px; }
    .fp-main-floor { display: flex; flex-direction: column; gap: 12px; }

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
      position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 12px 14px; min-width: 86px; background: #fff;
      border: 2px solid #e2e8f0; border-radius: 14px; cursor: pointer;
      transition: all 0.2s ease; color: #64748b;
    }
    .fp-table mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .fp-table-code { font-size: 12px; font-weight: 700; color: #1e293b; }
    .fp-table-cap { font-size: 10px; color: #94a3b8; }
    .fp-table-status-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 1px; }

    .communal-table { min-width: 90px; }
    .booth-table { min-width: 80px; }

    /* STATUS: trong = green/available */
    .fp-table.status-trong { border-color: #22c55e; }
    .fp-table.status-trong mat-icon { color: #22c55e; }
    .fp-table.status-trong .fp-table-status-label { color: #16a34a; }
    .fp-table.status-trong:hover { background: #f0fdf4; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(34,197,94,0.2); }

    /* STATUS: da_dat = blue */
    .fp-table.status-da_dat { border-color: #3b82f6; background: #eff6ff; }
    .fp-table.status-da_dat mat-icon { color: #3b82f6; }
    .fp-table.status-da_dat .fp-table-status-label { color: #2563eb; }
    .fp-table.status-da_dat:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59,130,246,0.15); }

    /* STATUS: dang_phuc_vu = yellow/serving */
    .fp-table.status-dang_phuc_vu { border-color: #eab308; background: #fefce8; }
    .fp-table.status-dang_phuc_vu mat-icon { color: #eab308; }
    .fp-table.status-dang_phuc_vu .fp-table-status-label { color: #ca8a04; }
    .fp-table.status-dang_phuc_vu:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(234,179,8,0.2); }

    /* STATUS: bao_tri = grey/disabled */
    .fp-table.status-bao_tri { border-color: #9ca3af; background: #f3f4f6; opacity: 0.55; cursor: not-allowed; }
    .fp-table.status-bao_tri mat-icon { color: #9ca3af; }
    .fp-table.status-bao_tri .fp-table-status-label { color: #6b7280; }

    /* Backdrop & Modal */
    .backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      display: grid; place-items: center; z-index: 1000;
      animation: fade-in 0.15s ease;
    }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    .modal {
      width: min(92vw, 420px); background: #fff; border-radius: 20px;
      padding: 28px; text-align: center; color: #1e293b;
      animation: scale-in 0.2s ease;
    }
    @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .modal-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 8px; }
    .open-icon { color: #22c55e; }
    .modal h3 { margin: 0 0 4px; font-size: 20px; font-weight: 700; }
    .modal-sub { margin: 0 0 20px; color: #64748b; font-size: 14px; }

    .guest-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 24px; }
    .guest-btn {
      width: 100%; aspect-ratio: 1; border-radius: 12px; border: 1px solid #e2e8f0;
      background: #f8fafc; font-size: 18px; font-weight: 700; color: #475569;
      cursor: pointer; transition: all 0.15s; display: grid; place-items: center;
    }
    .guest-btn:hover { border-color: #22c55e; color: #22c55e; }
    .guest-btn.active { background: #22c55e; color: #fff; border-color: #22c55e; }

    .modal-actions { display: flex; gap: 10px; }
    .cancel-btn {
      flex: 1; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;
      background: #fff; font-size: 15px; font-weight: 600; color: #64748b; cursor: pointer;
    }
    .confirm-btn {
      flex: 1; padding: 12px; border-radius: 12px; border: none;
      background: #22c55e; font-size: 15px; font-weight: 600; color: #fff; cursor: pointer;
      transition: background 0.15s;
    }
    .confirm-btn:hover:not(:disabled) { background: #16a34a; }
    .confirm-btn:disabled { background: #86efac; cursor: not-allowed; }

    /* Toast */
    .toast {
      position: fixed; bottom: 24px; right: 24px; z-index: 1100;
      display: flex; align-items: center; gap: 10px;
      padding: 14px 20px; border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      animation: slide-in 0.3s ease-out;
      font-size: 14px; font-weight: 600;
    }
    .toast.success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    .toast mat-icon { font-size: 20px; width: 20px; height: 20px; }
    @keyframes slide-in { from { transform: translateX(120%); } to { transform: translateX(0); } }

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
  private readonly staffTableService = inject(StaffTableService);
  private readonly router = inject(Router);

  readonly apiTables = signal<(DiningTable & { _rawStatus: string })[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  /** Modal để chọn số khách (open table) */
  readonly guestModal = signal<DiningTable | null>(null);
  readonly guestCount = signal(2);

  /** Toast thông báo thành công */
  readonly successToast = signal<string | null>(null);

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

  readonly guestOptions = computed(() => {
    const cap = Math.min(this.guestModal()?.capacity ?? 10, 10);
    return Array.from({ length: cap }, (_, i) => i + 1);
  });

  readonly zones = computed(() => {
    const tables = this.apiTables();
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
    const raw = (table as any)._rawStatus as string;

    // Bàn bảo trì → không làm gì
    if (raw === 'bao_tri') return;

    // Bàn trống → mở modal chọn số khách
    if (raw === 'trong') {
      this.guestCount.set(Math.min(2, table.capacity));
      this.guestModal.set(table);
      return;
    }

    // Bàn đang phục vụ hoặc đã đặt → vào workspace
    if (raw === 'dang_phuc_vu' || raw === 'da_dat') {
      this.router.navigate(['/staff/tables', table.id]);
      return;
    }
  }

  confirmOpenTable(): void {
    const table = this.guestModal();
    if (!table) return;
    // Navigate to workspace — workspace will create the invoice which sets table → dang_phuc_vu
    this.guestModal.set(null);
    this.router.navigate(['/staff/tables', table.id]);
  }

  /** Build CSS class from raw backend status */
  statusClass(table: DiningTable): string {
    const raw = (table as any)._rawStatus;
    return raw ? 'status-' + raw : 'status-trong';
  }

  statusLabel(table: DiningTable): string {
    const raw = (table as any)._rawStatus as string;
    switch (raw) {
      case 'trong': return 'Available';
      case 'da_dat': return 'Reserved';
      case 'dang_phuc_vu': return 'Serving';
      case 'bao_tri': return 'Maintenance';
      default: return '';
    }
  }

  private showToast(msg: string): void {
    this.successToast.set(msg);
    setTimeout(() => this.successToast.set(null), 3000);
  }
}
