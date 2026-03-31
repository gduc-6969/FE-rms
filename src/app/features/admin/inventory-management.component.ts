import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  DestroyRef, inject, OnInit, signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { IngredientRequest, IngredientResponse, IngredientStatus } from '../../core/models/ingredient.models';
import { IngredientService } from '../../core/services/ingredient.service';

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatPaginatorModule
  ],
  template: `
    <section class="rms-page">
      <div class="page-header">
        <div>
          <h2>Inventory Management</h2>
          <p>Manage ingredients and low stock alerts.</p>
        </div>
        <button mat-flat-button color="primary" (click)="startCreate()">
          <mat-icon>add</mat-icon>
          Add Ingredient
        </button>
      </div>

      <!-- Low stock warning -->
      @if (lowStockItems().length > 0) {
        <mat-card class="warning-card">
          <mat-card-content>
            <div class="warning-header">
              <mat-icon>warning</mat-icon>
              <span>Low Stock Alert ({{ lowStockItems().length }} ingredients)</span>
            </div>
            <div class="warning-items">
              @for (item of lowStockItems(); track item.id) {
                <span class="warning-item">{{ item.name }}: {{ item.stockQuantity }}/{{ item.minStockQuantity }} {{ item.unit }}</span>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      @if (editingId() !== null) {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Unit</mat-label>
                <input matInput formControlName="unit" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Stock Quantity</mat-label>
                <input matInput type="number" min="0" formControlName="stockQuantity" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Min Stock Level</mat-label>
                <input matInput type="number" min="0" formControlName="minStockQuantity" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="hoat_dong">Active</mat-option>
                  <mat-option value="ngung_hoat_dong">Inactive</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="actions">
                <button mat-stroked-button type="button" (click)="cancel()">Cancel</button>
                <button mat-flat-button color="primary" type="submit" 
                  [disabled]="form.invalid || loading()">
                  {{ loading() ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <mat-card>
        <mat-card-content>
          @if (loading() && items().length === 0) {
            <div class="loading-wrapper">
              <mat-spinner diameter="40" />
            </div>
          } @else {
            <table mat-table [dataSource]="items()" class="full-width">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let row">{{ row.name }}</td>
              </ng-container>

              <ng-container matColumnDef="unit">
                <th mat-header-cell *matHeaderCellDef>Unit</th>
                <td mat-cell *matCellDef="let row">{{ row.unit }}</td>
              </ng-container>

              <ng-container matColumnDef="stockQuantity">
                <th mat-header-cell *matHeaderCellDef>Stock</th>
                <td mat-cell *matCellDef="let row" 
                  [class.low-stock]="row.stockQuantity <= row.minStockQuantity">
                  {{ row.stockQuantity }}
                </td>
              </ng-container>

              <ng-container matColumnDef="minStockQuantity">
                <th mat-header-cell *matHeaderCellDef>Min Level</th>
                <td mat-cell *matCellDef="let row">{{ row.minStockQuantity }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">{{ statusLabel(row.status) }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button (click)="startEdit(row)" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="remove(row.id)" matTooltip="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>

            <mat-paginator
              [length]="totalElements()"
              [pageSize]="pageSize()"
              [pageIndex]="currentPage()"
              [pageSizeOptions]="[5, 10, 20, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          }
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [`
    .rms-page { display: grid; gap: 16px; }
    .page-header { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    .page-header p { margin: 4px 0 0; color: #6b7280; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 8px; }
    .full-width { width: 100%; }
    .low-stock { color: #dc2626; font-weight: 700; }
    .loading-wrapper { display: flex; justify-content: center; padding: 40px; }
    .warning-card { background: #fef3c7; border: 1px solid #f59e0b; }
    .warning-header { display: flex; align-items: center; gap: 8px; color: #b45309; font-weight: 600; }
    .warning-items { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .warning-item { background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 13px; color: #92400e; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryManagementComponent implements OnInit {
  private readonly ingredientService = inject(IngredientService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly items = signal<IngredientResponse[]>([]);
  readonly lowStockItems = signal<IngredientResponse[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly loading = signal(false);
  
  // Pagination
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);

  readonly displayedColumns = ['name', 'unit', 'stockQuantity', 'minStockQuantity', 'status', 'actions'];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    unit: ['', [Validators.required]],
    stockQuantity: [0, [Validators.required, Validators.min(0)]],
    minStockQuantity: [0, [Validators.required, Validators.min(0)]],
    status: ['hoat_dong' as IngredientStatus, [Validators.required]]
  });

  statusLabel(status: IngredientStatus): string {
    return status === 'hoat_dong' ? 'Active' : 'Inactive';
  }

  ngOnInit(): void {
    this.loadIngredients();
  }

  private loadIngredients(): void {
    this.loading.set(true);
    this.ingredientService.getAll(this.currentPage(), this.pageSize())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          this.items.set(page.content);
          this.totalElements.set(page.totalElements);
          this.lowStockItems.set(
            page.content.filter((i: IngredientResponse) => 
              i.stockQuantity <= i.minStockQuantity && i.status === 'hoat_dong'
            )
          );
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.showError('Failed to load ingredients');
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadIngredients();
  }

  startCreate(): void {
    this.editingId.set(0);
    this.form.reset({ name: '', unit: '', stockQuantity: 0, minStockQuantity: 0, status: 'hoat_dong' });
  }

  startEdit(item: IngredientResponse): void {
    this.editingId.set(item.id);
    this.form.reset({
      name: item.name,
      unit: item.unit,
      stockQuantity: item.stockQuantity,
      minStockQuantity: item.minStockQuantity,
      status: item.status
    });
  }

  save(): void {
    const id = this.editingId();
    if (this.form.invalid || id === null) return;

    const request: IngredientRequest = this.form.getRawValue();
    this.loading.set(true);

    const api$ = id === 0
      ? this.ingredientService.create(request)
      : this.ingredientService.update(id, request);

    api$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        if (id === 0) {
          this.items.update(list => [result, ...list]);
        } else {
          this.items.update(list => list.map(i => i.id === id ? result : i));
        }
        this.cancel();
        this.loading.set(false);
        this.cdr.markForCheck();
        this.showSuccess(id === 0 ? 'Ingredient added successfully' : 'Updated successfully');
      },
      error: () => {
        this.showError(id === 0 ? 'Failed to add ingredient' : 'Update failed');
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  remove(id: number): void {
    this.loading.set(true);
    this.ingredientService.delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.items.update(list => list.filter(i => i.id !== id));
          this.loading.set(false);
          this.cdr.markForCheck();
          this.showSuccess('Ingredient deleted successfully');
        },
        error: () => {
          this.showError('Failed to delete ingredient');
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', unit: '', stockQuantity: 0, minStockQuantity: 0, status: 'hoat_dong' });
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: 'snack-error' });
  }
}
