import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  computed, DestroyRef, inject, OnInit, signal
} from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MenuItemResponse, MenuItemStatus } from '../../core/models/menu-item.models';
import { CategoryResponse } from '../../core/models/category.models';
import { MenuItemService } from '../../core/services/menu-item.service';

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
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatPaginatorModule
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
                <mat-select formControlName="categoryId">
                  @for (cat of categories(); track cat.id) {
                    <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Price (VND)</mat-label>
                <input matInput type="number" formControlName="price" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Image URL</mat-label>
                <input matInput formControlName="imageUrl" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="con_ban">Available</mat-option>
                  <mat-option value="het_mon">Out of stock</mat-option>
                  <mat-option value="ngung_ban">Unavailable</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="form-actions">
                <button mat-stroked-button type="button" (click)="cancel()">Cancel</button>
                <button class="btn-add" type="submit" [disabled]="form.invalid || loading()">
                  {{ loading() ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <!-- Main Table Card -->
      <div class="table-card">

        <!-- Category Filter Tabs -->
        <div class="filter-row">
          <button
            class="filter-btn"
            [class.active]="selectedCategoryId() === null"
            (click)="filterByCategory(null)">All</button>
          @for (cat of categories(); track cat.id) {
            <button
              class="filter-btn"
              [class.active]="selectedCategoryId() === cat.id"
              (click)="filterByCategory(cat.id)">{{ cat.name }}</button>
          }
        </div>

        @if (loading() && menuItems().length === 0) {
          <div class="loading-wrapper">
            <mat-spinner diameter="40" />
          </div>
        } @else {
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
                    <span class="category-tag">{{ item.categoryName }}</span>
                  </td>
                  <td class="td-price">{{ item.price | currency:'USD' }}</td>
                  <td>
                    <div class="status-cell">
                      <label class="toggle">
                        <input
                          type="checkbox"
                          [checked]="item.status === 'con_ban'"
                          (change)="toggleStatus(item)"
                        />
                        <span class="track"></span>
                        <span class="thumb"></span>
                      </label>
                      <span
                        class="status-label"
                        [class.available]="item.status === 'con_ban'"
                        [class.unavailable]="item.status !== 'con_ban'">
                        {{ statusLabel(item.status) }}
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

          <!-- Paginator -->
          <mat-paginator
            [length]="totalElements()"
            [pageSize]="pageSize()"
            [pageIndex]="currentPage()"
            [pageSizeOptions]="[5, 10, 20, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        }
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Total Items</div>
          <div class="stat-value">{{ totalElements() }}</div>
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
          <div class="stat-value accent">{{ categories().length }}</div>
        </div>
      </div>

    </section>
  `,
  styles: [`
    :host {
      --accent: #ff5f2e; --accent-h: #e04e20; --green: #22c55e; --red: #ef4444;
      --border: #e5e7eb; --text: #111827; --muted: #6b7280; --bg: #f4f5f7;
      --surface: #ffffff; --tag-bg: #fff3f0;
    }
    .rms-page { display: grid; gap: 20px; padding: 28px 32px; background: var(--bg); min-height: 100%; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .page-title { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; }
    .page-sub { font-size: 12.5px; color: var(--muted); margin: 4px 0 0; }
    .btn-add { display: inline-flex; align-items: center; gap: 5px; background: var(--accent); color: #fff; border: none; border-radius: 10px; padding: 10px 20px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background .18s, transform .1s; font-family: inherit; }
    .btn-add:hover:not([disabled]) { background: var(--accent-h); transform: translateY(-1px); }
    .btn-add:active:not([disabled]) { transform: translateY(0); }
    .btn-add[disabled] { opacity: .55; cursor: not-allowed; }
    .btn-add mat-icon { font-size: 17px; width: 17px; height: 17px; line-height: 1; }
    .form-card { border-radius: 14px !important; box-shadow: 0 2px 12px rgba(0,0,0,.07) !important; }
    .form-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
    .form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 8px; align-items: center; }
    .table-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,.05); }
    .filter-row { display: flex; align-items: center; gap: 8px; padding: 16px 20px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
    .filter-btn { padding: 7px 16px; border-radius: 8px; border: 1px solid var(--border); background: transparent; font-size: 13px; font-weight: 500; font-family: inherit; color: var(--muted); cursor: pointer; transition: all .15s; }
    .filter-btn:hover { border-color: #d1d5db; color: var(--text); }
    .filter-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { border-bottom: 1px solid var(--border); }
    th { text-align: left; padding: 12px 20px; font-size: 11.5px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; white-space: nowrap; }
    .th-actions { text-align: right; }
    tbody tr { border-bottom: 1px solid var(--border); transition: background .12s; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: #fafafa; }
    td { padding: 14px 20px; font-size: 13.5px; color: var(--text); }
    .td-name { font-weight: 600; }
    .td-price { font-weight: 600; color: var(--accent); font-variant-numeric: tabular-nums; }
    .category-tag { display: inline-block; background: var(--tag-bg); color: var(--accent); padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
    .empty-row { text-align: center; color: var(--muted); padding: 32px !important; }
    .loading-wrapper { display: flex; justify-content: center; padding: 40px; }
    .status-cell { display: flex; align-items: center; gap: 8px; }
    .toggle { position: relative; width: 36px; height: 20px; cursor: pointer; flex-shrink: 0; }
    .toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .track { position: absolute; inset: 0; border-radius: 20px; background: #d1d5db; transition: background .2s; }
    .thumb { position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.2); transition: transform .2s; }
    .toggle input:checked ~ .track { background: var(--green); }
    .toggle input:checked ~ .thumb { transform: translateX(16px); }
    .status-label { font-size: 13px; font-weight: 500; }
    .status-label.available { color: var(--green); }
    .status-label.unavailable { color: var(--muted); }
    .actions { display: flex; gap: 6px; justify-content: flex-end; }
    .action-btn { width: 30px; height: 30px; border-radius: 7px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; background: transparent; transition: background .15s, transform .1s; }
    .action-btn mat-icon { font-size: 16px; width: 16px; height: 16px; line-height: 1; }
    .action-btn.edit { color: var(--accent); }
    .action-btn.edit:hover { background: #fff3f0; }
    .action-btn.delete { color: var(--red); }
    .action-btn.delete:hover { background: #fff1f1; }
    .action-btn:active { transform: scale(.91); }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; box-shadow: 0 1px 4px rgba(0,0,0,.04); }
    .stat-label { font-size: 12px; color: var(--muted); font-weight: 500; }
    .stat-value { font-size: 28px; font-weight: 700; margin-top: 4px; color: var(--text); font-variant-numeric: tabular-nums; }
    .stat-value.green { color: var(--green); }
    .stat-value.red { color: var(--red); }
    .stat-value.accent { color: var(--accent); }
    @media (max-width: 720px) {
      .rms-page { padding: 16px; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .page-header { flex-direction: column; gap: 12px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuManagementComponent implements OnInit {
  private readonly menuItemService = inject(MenuItemService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly menuItems = signal<MenuItemResponse[]>([]);
  readonly categories = signal<CategoryResponse[]>([]);
  readonly editingItemId = signal<number | null>(null);
  readonly selectedCategoryId = signal<number | null>(null);
  readonly loading = signal(false);
  
  // Pagination
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);

  readonly form = this.fb.nonNullable.group({
    categoryId: [0, Validators.required],
    name:       ['', [Validators.required, Validators.maxLength(150)]],
    price:      [0, [Validators.required, Validators.min(1)]],
    imageUrl:   ['', Validators.maxLength(500)],
    status:     ['con_ban' as MenuItemStatus, Validators.required]
  });

  readonly filteredMenuItems = computed(() => {
    const id = this.selectedCategoryId();
    return id === null
      ? this.menuItems()
      : this.menuItems().filter(i => i.categoryId === id);
  });

  readonly availableCount   = computed(() => this.menuItems().filter(i => i.status === 'con_ban').length);
  readonly unavailableCount = computed(() => this.menuItems().filter(i => i.status !== 'con_ban').length);

  statusLabel(status: MenuItemStatus): string {
    const map: Record<MenuItemStatus, string> = {
      con_ban:   'Available',
      het_mon:   'Out of stock',
      ngung_ban: 'Unavailable'
    };
    return map[status] ?? status;
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadMenuItems();
  }

  private loadCategories(): void {
    this.menuItemService.getAllCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.categories.set(data.filter(c => c.status === 'hoat_dong'));
          this.cdr.markForCheck();
        },
        error: () => this.showError('Cannot load categories')
      });
  }

  private loadMenuItems(): void {
    this.loading.set(true);
    this.menuItemService.getAll(this.currentPage(), this.pageSize())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          this.menuItems.set(page.content);
          this.totalElements.set(page.totalElements);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.showError('Cannot load menu items');
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadMenuItems();
  }

  filterByCategory(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId);
    this.cdr.markForCheck();
  }

  startCreate(): void {
    this.editingItemId.set(0);
    this.form.reset({ categoryId: 0, name: '', price: 0, imageUrl: '', status: 'con_ban' });
  }

  startEdit(item: MenuItemResponse): void {
    this.editingItemId.set(item.id);
    this.form.reset({
      categoryId: item.categoryId,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      status: item.status
    });
  }

  toggleStatus(item: MenuItemResponse): void {
    const newStatus: MenuItemStatus = item.status === 'con_ban' ? 'het_mon' : 'con_ban';
    this.menuItemService.updateStatus(item.id, newStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.menuItems.update(list => list.map(i => i.id === item.id ? updated : i));
          this.cdr.markForCheck();
        },
        error: () => this.showError('Failed to update status')
      });
  }

  save(): void {
    const id = this.editingItemId();
    if (this.form.invalid || id === null) return;

    const request = this.form.getRawValue();
    this.loading.set(true);

    const api$ = id === 0
      ? this.menuItemService.create(request)
      : this.menuItemService.update(id, request);

    api$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        if (id === 0) {
          this.menuItems.update(list => [result, ...list]);
        } else {
          this.menuItems.update(list => list.map(i => i.id === id ? result : i));
        }
        this.cancel();
        this.loading.set(false);
        this.cdr.markForCheck();
        this.showSuccess(id === 0 ? 'Added successfully' : 'Updated successfully');
      },
      error: () => {
        this.showError(id === 0 ? 'Failed to add' : 'Failed to update');
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  remove(id: number): void {
    this.loading.set(true);
    this.menuItemService.delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.menuItems.update(list => list.filter(i => i.id !== id));
          if (this.editingItemId() === id) this.cancel();
          this.loading.set(false);
          this.cdr.markForCheck();
          this.showSuccess('Deleted successfully');
        },
        error: () => {
          this.showError('Failed to delete');
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  cancel(): void {
    this.editingItemId.set(null);
    this.form.reset({ categoryId: 0, name: '', price: 0, imageUrl: '', status: 'con_ban' });
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: 'snack-error' });
  }
}