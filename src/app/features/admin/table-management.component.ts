import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DiningTable, TableStatus } from '../../core/models/app.models';
import { MockDataService } from '../../core/services/mock-data.service';

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
    MatSelectModule
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
                <mat-label>Table Name</mat-label>
                <input matInput formControlName="name" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Capacity</mat-label>
                <input matInput type="number" min="1" formControlName="capacity" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Area</mat-label>
                <input matInput formControlName="area" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="available">Available</mat-option>
                  <mat-option value="serving">Serving</mat-option>
                  <mat-option value="pending-payment">Pending Payment</mat-option>
                  <mat-option value="disabled">Disabled</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="form-actions">
                <button mat-stroked-button type="button" (click)="cancel()">Cancel</button>
                <button class="btn-add" type="submit" [disabled]="form.invalid">Save</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

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
          <div class="table-card">
            <!-- Table icon circle -->
            <div class="table-icon">
              <span class="table-abbr">{{ abbr(table.name) }}</span>
            </div>

            <!-- Info -->
            <div class="table-info">
              <div class="info-row">
                <mat-icon class="info-icon">people</mat-icon>
                <span class="info-text accent">{{ table.capacity }} Seats</span>
              </div>
              <div class="info-row">
                <mat-icon class="info-icon location">location_on</mat-icon>
                <span class="info-text">{{ table.area }}</span>
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
        }
      </div>

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
      gap: 4px;
      width: 100%;
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
    .info-icon.location { color: var(--accent); }
    .info-text {
      font-size: 13px;
      color: var(--muted);
      font-weight: 500;
    }
    .info-text.accent { color: var(--accent); font-weight: 600; }

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
export class TableManagementComponent {
  private readonly mockData = inject(MockDataService);
  private readonly fb = inject(FormBuilder);

  readonly tables = signal<DiningTable[]>(this.mockData.getDiningTables());
  readonly editingTableId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name:     ['', [Validators.required]],
    capacity: [4, [Validators.required, Validators.min(1)]],
    area:     ['', [Validators.required]],
    status:   ['available' as TableStatus, [Validators.required]]
  });

  readonly totalCapacity = computed(() =>
    this.tables().reduce((sum, t) => sum + t.capacity, 0)
  );

  /** Extract abbreviation: "Table 1" → "T1", "T2" → "T2" */
  abbr(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1]).toUpperCase().slice(0, 3);
  }

  startCreate(): void {
    this.editingTableId.set(0);
    this.form.reset({ name: '', capacity: 4, area: '', status: 'available' });
  }

  startEdit(table: DiningTable): void {
    this.editingTableId.set(table.id);
    this.form.reset({
      name: table.name, capacity: table.capacity,
      area: table.area, status: table.status
    });
  }

  save(): void {
    if (this.form.invalid || this.editingTableId() === null) return;

    const id  = this.editingTableId()!;
    const raw = this.form.getRawValue();

    if (id === 0) {
      const nextId = Math.max(...this.tables().map(t => t.id), 0) + 1;
      this.tables.update(items => [
        { id: nextId, name: raw.name, capacity: Number(raw.capacity),
          area: raw.area, status: raw.status, guests: 0, elapsedMinutes: 0 },
        ...items
      ]);
    } else {
      this.tables.update(items =>
        items.map(item =>
          item.id === id
            ? { ...item, name: raw.name, capacity: Number(raw.capacity),
                area: raw.area, status: raw.status }
            : item
        )
      );
    }
    this.cancel();
  }

  remove(id: number): void {
    this.tables.update(items => items.filter(i => i.id !== id));
    if (this.editingTableId() === id) this.cancel();
  }

  cancel(): void {
    this.editingTableId.set(null);
    this.form.reset({ name: '', capacity: 4, area: '', status: 'available' });
  }

  statusLabel(status: TableStatus): string {
    const map: Record<TableStatus, string> = {
      'available': 'Available',
      'serving': 'Serving',
      'pending-payment': 'Pending Payment',
      'disabled': 'Disabled'
    };
    return map[status] ?? status;
  }
}