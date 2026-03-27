import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MenuItem } from '../../core/models/app.models';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    CurrencyPipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule
  ],
  template: `
    <section class="rms-page">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Menu Management</h2>
          <p class="page-sub">Manage menu items and categories</p>
        </div>
        <button class="btn-add" (click)="startCreate()">
          <mat-icon>add</mat-icon>
          Add Dish
        </button>
      </div>

      <!-- Add / Edit Form -->
      @if (editingItemId() !== null) {
        <mat-card class="form-card">
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Category</mat-label>
                <mat-select formControlName="category">
                  @for (cat of categoryList; track cat) {
                    <mat-option [value]="cat">{{ cat }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Price (vnd)</mat-label>
                <input matInput type="number" formControlName="price" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="available">Available</mat-option>
                  <mat-option value="out-of-stock">Unavailable</mat-option>
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

      <!-- Main Table Card -->
      <div class="table-card">

        <!-- Category Filter Tabs -->
        <div class="filter-row">
          @for (tab of filterTabs; track tab) {
            <button
              class="filter-btn"
              [class.active]="activeFilter() === tab"
              (click)="activeFilter.set(tab)"
            >{{ tab }}</button>
          }
        </div>

        <!-- Table -->
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (item of filteredMenuItems(); track item.id) {
              <tr>
                <td class="td-name">{{ item.name }}</td>
                <td>
                  <span class="category-tag">{{ item.category }}</span>
                </td>
                <td class="td-price">{{ item.price | currency:'VND' }}</td>
                <td>
                  <div class="status-cell">
                    <label class="toggle">
                      <input
                        type="checkbox"
                        [checked]="item.status === 'available'"
                        (change)="toggleStatus(item)"
                      />
                      <span class="track"></span>
                      <span class="thumb"></span>
                    </label>
                    <span
                      class="status-label"
                      [class.available]="item.status === 'available'"
                      [class.unavailable]="item.status !== 'available'"
                    >
                      {{ item.status === 'available' ? 'Available' : 'Unavailable' }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="actions">
                    <button class="action-btn edit" (click)="startEdit(item)" title="Edit">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button class="action-btn delete" (click)="remove(item.id)" title="Delete">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </tr>
            }
            @empty {
              <tr>
                <td colspan="5" class="empty-row">No items found.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Total Items</div>
          <div class="stat-value">{{ menuItems().length }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Available</div>
          <div class="stat-value green">{{ availableCount() }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Unavailable</div>
          <div class="stat-value red">{{ unavailableCount() }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Categories</div>
          <div class="stat-value accent">{{ categoryCount() }}</div>
        </div>
      </div>

    </section>
  `,
  styles: [`
    /* ── Reset & variables ── */
    :host {
      --accent:    #ff5f2e;
      --accent-h:  #e04e20;
      --green:     #22c55e;
      --red:       #ef4444;
      --border:    #e5e7eb;
      --text:      #111827;
      --muted:     #6b7280;
      --bg:        #f4f5f7;
      --surface:   #ffffff;
      --tag-bg:    #fff3f0;
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

    /* ── Table card ── */
    .table-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 1px 6px rgba(0,0,0,.05);
    }

    /* ── Filter tabs ── */
    .filter-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
    }
    .filter-btn {
      padding: 7px 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: transparent;
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
      color: var(--muted);
      cursor: pointer;
      transition: all .15s;
    }
    .filter-btn:hover { border-color: #d1d5db; color: var(--text); }
    .filter-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

    /* ── Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead tr { border-bottom: 1px solid var(--border); }
    th {
      text-align: left;
      padding: 12px 20px;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: .05em;
      white-space: nowrap;
    }
    .th-actions { text-align: right; }

    tbody tr {
      border-bottom: 1px solid var(--border);
      transition: background .12s;
    }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: #fafafa; }

    td {
      padding: 14px 20px;
      font-size: 13.5px;
      color: var(--text);
    }

    .td-name { font-weight: 600; }
    .td-price { font-weight: 600; color: var(--accent); font-variant-numeric: tabular-nums; }

    .category-tag {
      display: inline-block;
      background: var(--tag-bg);
      color: var(--accent);
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .empty-row {
      text-align: center;
      color: var(--muted);
      padding: 32px !important;
    }

    /* ── Toggle switch ── */
    .status-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toggle {
      position: relative;
      width: 36px;
      height: 20px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .track {
      position: absolute;
      inset: 0;
      border-radius: 20px;
      background: #d1d5db;
      transition: background .2s;
    }
    .thumb {
      position: absolute;
      top: 3px; left: 3px;
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,.2);
      transition: transform .2s;
    }
    .toggle input:checked ~ .track { background: var(--green); }
    .toggle input:checked ~ .thumb { transform: translateX(16px); }

    .status-label { font-size: 13px; font-weight: 500; }
    .status-label.available { color: var(--green); }
    .status-label.unavailable { color: var(--muted); }

    /* ── Action buttons ── */
    .actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
    .action-btn {
      width: 30px; height: 30px;
      border-radius: 7px; border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      background: transparent;
      transition: background .15s, transform .1s;
    }
    .action-btn mat-icon { font-size: 16px; width: 16px; height: 16px; line-height: 1; }
    .action-btn.edit { color: var(--accent); }
    .action-btn.edit:hover { background: #fff3f0; }
    .action-btn.delete { color: var(--red); }
    .action-btn.delete:hover { background: #fff1f1; }
    .action-btn:active { transform: scale(.91); }

    /* ── Stats Row ── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .stat-label {
      font-size: 12px;
      color: var(--muted);
      font-weight: 500;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      margin-top: 4px;
      color: var(--text);
      font-variant-numeric: tabular-nums;
    }
    .stat-value.green  { color: var(--green); }
    .stat-value.red    { color: var(--red); }
    .stat-value.accent { color: var(--accent); }

    /* ── Responsive ── */
    @media (max-width: 720px) {
      .rms-page { padding: 16px; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .page-header { flex-direction: column; gap: 12px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuManagementComponent {
  private readonly mockData = inject(MockDataService);
  private readonly fb = inject(FormBuilder);

  readonly categoryList = ['Appetizers', 'Mains', 'Desserts', 'Drinks'];
  readonly filterTabs = ['All', ...this.categoryList];

  readonly menuItems = signal<MenuItem[]>(this.mockData.getMenuItems());
  readonly activeFilter = signal<string>('All');
  readonly editingItemId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name:     ['', [Validators.required]],
    category: ['', [Validators.required]],
    price:    [14, [Validators.required, Validators.min(1)]],
    status:   ['available' as MenuItem['status'], [Validators.required]]
  });

  readonly filteredMenuItems = computed(() => {
    const filter = this.activeFilter();
    const items = this.menuItems();
    return filter === 'All' ? items : items.filter(i => i.category === filter);
  });

  readonly availableCount   = computed(() => this.menuItems().filter(i => i.status === 'available').length);
  readonly unavailableCount = computed(() => this.menuItems().filter(i => i.status !== 'available').length);
  readonly categoryCount    = computed(() => new Set(this.menuItems().map(i => i.category)).size);

  startCreate(): void {
    this.editingItemId.set(0);
    this.form.reset({ name: '', category: '', price: 14, status: 'available' });
  }

  startEdit(item: MenuItem): void {
    this.editingItemId.set(item.id);
    this.form.reset({ name: item.name, category: item.category, price: item.price, status: item.status });
  }

  toggleStatus(item: MenuItem): void {
    this.menuItems.update(items =>
      items.map(i =>
        i.id === item.id
          ? { ...i, status: i.status === 'available' ? 'out-of-stock' : 'available' }
          : i
      )
    );
  }

  save(): void {
    if (this.form.invalid || this.editingItemId() === null) return;

    const raw = this.form.getRawValue();
    const id  = this.editingItemId()!;

    if (id === 0) {
      const nextId = Math.max(...this.menuItems().map(i => i.id), 0) + 1;
      this.menuItems.update(items => [
        { id: nextId, name: raw.name, category: raw.category, price: Number(raw.price), status: raw.status },
        ...items
      ]);
    } else {
      this.menuItems.update(items =>
        items.map(i =>
          i.id === id
            ? { ...i, name: raw.name, category: raw.category, price: Number(raw.price), status: raw.status }
            : i
        )
      );
    }
    this.cancel();
  }

  remove(id: number): void {
    this.menuItems.update(items => items.filter(i => i.id !== id));
    if (this.editingItemId() === id) this.cancel();
  }

  cancel(): void {
    this.editingItemId.set(null);
    this.form.reset({ name: '', category: '', price: 14, status: 'available' });
  }
}