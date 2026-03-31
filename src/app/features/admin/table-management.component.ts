import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TableService } from '../../core/services/table.service';
import { TableResponse, TableStatus, TABLE_STATUS_OPTIONS, TABLE_STATUS_LABELS } from '../../core/models/table.models';

@Component({
  selector: 'app-table-management',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  template: `
    <section class="rms-page">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Table Management</h2>
          <p class="page-sub">Configure your restaurant floor plan</p>
        </div>
        <button class="btn-add" (click)="startCreate()">
          <mat-icon>add</mat-icon>
          Add New Table
        </button>
      </div>

      <!-- Add / Edit Form -->
      @if (editingTableId() !== null) {
        <mat-card class="form-card">
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Table Code</mat-label>
                <input matInput formControlName="tableCode" placeholder="e.g. T01, T02" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Capacity</mat-label>
                <input matInput type="number" min="1" formControlName="capacity" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  @for (opt of statusOptions; track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <div class="form-actions">
                <button mat-stroked-button type="button" (click)="cancel()">Cancel</button>
                <button class="btn-add" type="submit" [disabled]="form.invalid || saving()">
                  @if (saving()) {
                    <mat-spinner diameter="18"></mat-spinner>
                  } @else {
                    Save
                  }
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <span>Loading tables...</span>
        </div>
      } @else {
        <!-- Stats Row -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-label">Total Tables</div>
            <div class="stat-value">{{ tables().length }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Capacity</div>
            <div class="stat-value">{{ totalCapacity() }} <span class="stat-unit">Seats</span></div>
          </div>
        </div>

        <!-- Table Grid -->
        <div class="table-grid">
          @for (table of tables(); track table.id) {
            <div class="table-card" [class.status-available]="table.status === 'trong'"
                 [class.status-reserved]="table.status === 'da_dat'"
                 [class.status-serving]="table.status === 'dang_phuc_vu'"
                 [class.status-maintenance]="table.status === 'bao_tri'">
              <!-- Table icon circle -->
              <div class="table-icon">
                <span class="table-abbr">{{ abbr(table.tableCode) }}</span>
              </div>

              <!-- Info -->
              <div class="table-info">
                <div class="table-name">{{ table.tableCode }}</div>
                <div class="info-row">
                  <mat-icon class="info-icon">people</mat-icon>
                  <span class="info-text accent">{{ table.capacity }} Seats</span>
                </div>
                <div class="status-badge" [class]="'status-' + table.status">
                  {{ getStatusLabel(table.status) }}
                </div>
              </div>

              <!-- Hover actions -->
              <div class="card-actions">
                <button class="action-btn edit" (click)="startEdit(table)" title="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button class="action-btn delete" (click)="remove(table.id)" title="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          } @empty {
            <div class="no-data">No tables found. Click "Add New Table" to create one.</div>
          }
        </div>
      }

    </section>
  `,
  styles: [`
    :host {
      --accent:   #ff5f2e;
      --accent-h: #e04e20;
      --green:    #22c55e;
      --red:      #ef4444;
      --border:   #e5e7eb;
      --text:     #111827;
      --muted:    #6b7280;
      --bg:       #f4f5f7;
      --surface:  #ffffff;
    }

    /* ── Page layout ── */
    .rms-page {
      display: grid;
      gap: 20px;
      padding: 28px 32px;
      background: var(--bg);
      min-height: 100%;
    }

    /* ── Page Header ── */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .page-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }
    .page-sub {
      font-size: 12.5px;
      color: var(--muted);
      margin: 4px 0 0;
    }

    /* ── Add button ── */
    .btn-add {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 10px 20px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: background .18s, transform .1s;
      font-family: inherit;
    }
    .btn-add:hover:not([disabled]) { background: var(--accent-h); transform: translateY(-1px); }
    .btn-add:active:not([disabled]) { transform: translateY(0); }
    .btn-add[disabled] { opacity: .55; cursor: not-allowed; }
    .btn-add mat-icon { font-size: 17px; width: 17px; height: 17px; line-height: 1; }

    /* ── Form card ── */
    .form-card {
      border-radius: 14px !important;
      box-shadow: 0 2px 12px rgba(0,0,0,.07) !important;
    }
    .form-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
    .form-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      align-items: center;
    }

    /* ── Stats Row ── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .stat-label {
      font-size: 12.5px;
      color: var(--muted);
      font-weight: 500;
    }
    .stat-value {
      font-size: 30px;
      font-weight: 700;
      color: var(--text);
      margin-top: 6px;
      font-variant-numeric: tabular-nums;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .stat-unit {
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
    }

    /* ── Table Grid ── */
    .table-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    /* ── Table Card ── */
    .table-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 28px 20px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      position: relative;
      transition: box-shadow .2s, transform .2s;
      cursor: default;
    }
    .table-card:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,.1);
      transform: translateY(-2px);
    }
    .table-card:hover .card-actions { opacity: 1; }

    /* ── Table icon circle ── */
    .table-icon {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      border: 2px dashed #d1d5db;
      background: #f9fafb;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .table-abbr {
      font-size: 22px;
      font-weight: 700;
      color: #9ca3af;
      letter-spacing: .02em;
    }

    /* ── Table info ── */
    .table-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      width: 100%;
    }
    .table-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
    }
    .info-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .info-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
      line-height: 1;
      color: var(--accent);
    }
    .info-text {
      font-size: 13px;
      color: var(--muted);
      font-weight: 500;
    }
    .info-text.accent { color: var(--accent); font-weight: 600; }

    /* ── Status badge ── */
    .status-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-badge.status-trong { background: #dcfce7; color: #15803d; }
    .status-badge.status-da_dat { background: #fef3c7; color: #b45309; }
    .status-badge.status-dang_phuc_vu { background: #dbeafe; color: #1d4ed8; }
    .status-badge.status-bao_tri { background: #fee2e2; color: #b91c1c; }

    /* ── Loading ── */
    .loading-container {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 16px; padding: 60px 0; color: var(--muted);
    }

    .no-data {
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px;
      color: var(--muted);
    }

    /* ── Hover action buttons ── */
    .card-actions {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity .15s;
    }
    .action-btn {
      width: 28px; height: 28px;
      border-radius: 7px; border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      background: transparent;
      transition: background .15s, transform .1s;
    }
    .action-btn mat-icon { font-size: 15px; width: 15px; height: 15px; line-height: 1; }
    .action-btn.edit { color: var(--accent); }
    .action-btn.edit:hover { background: #fff3f0; }
    .action-btn.delete { color: var(--red); }
    .action-btn.delete:hover { background: #fff1f1; }
    .action-btn:active { transform: scale(.9); }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .table-grid { grid-template-columns: repeat(3, 1fr); }
      .stats-row  { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .rms-page   { padding: 16px; }
      .table-grid { grid-template-columns: repeat(2, 1fr); }
      .stats-row  { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 12px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableManagementComponent implements OnInit {
  private readonly tableService = inject(TableService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly tables = signal<TableResponse[]>([]);
  readonly editingTableId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly statusOptions = TABLE_STATUS_OPTIONS;

  readonly form = this.fb.nonNullable.group({
    tableCode: ['', [Validators.required, Validators.maxLength(10)]],
    capacity:  [4, [Validators.required, Validators.min(1)]],
    status:    ['trong' as TableStatus, [Validators.required]]
  });

  readonly totalCapacity = computed(() =>
    this.tables().reduce((sum, t) => sum + t.capacity, 0)
  );

  ngOnInit(): void {
    this.loadTables();
  }

  private loadTables(): void {
    this.loading.set(true);
    this.tableService.getAllTables()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.tables.set(data || []);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading tables:', err);
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  /** Extract abbreviation: "T01" → "T01", "Table 1" → "T1" */
  abbr(code: string): string {
    if (!code) return '?';
    const clean = code.trim();
    if (clean.length <= 3) return clean.toUpperCase();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1]).toUpperCase().slice(0, 3);
  }

  getStatusLabel(status: TableStatus): string {
    return TABLE_STATUS_LABELS[status] || status;
  }

  startCreate(): void {
    this.editingTableId.set(0);
    this.form.reset({ tableCode: '', capacity: 4, status: 'trong' });
  }

  startEdit(table: TableResponse): void {
    this.editingTableId.set(table.id);
    this.form.reset({
      tableCode: table.tableCode,
      capacity: table.capacity,
      status: table.status
    });
  }

  save(): void {
    if (this.form.invalid || this.editingTableId() === null) return;

    const id = this.editingTableId()!;
    const raw = this.form.getRawValue();
    const request = {
      tableCode: raw.tableCode,
      capacity: Number(raw.capacity),
      status: raw.status
    };

    this.saving.set(true);

    const operation$ = id === 0
      ? this.tableService.createTable(request)
      : this.tableService.updateTable(id, request);

    operation$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.cancel();
          this.loadTables();
        },
        error: (err) => {
          console.error('Error saving table:', err);
          this.saving.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  remove(id: number): void {
    if (!confirm('Are you sure you want to delete this table?')) return;

    this.tableService.deleteTable(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.editingTableId() === id) this.cancel();
          this.loadTables();
        },
        error: (err) => {
          console.error('Error deleting table:', err);
        }
      });
  }

  cancel(): void {
    this.editingTableId.set(null);
    this.form.reset({ tableCode: '', capacity: 4, status: 'trong' });
  }
}