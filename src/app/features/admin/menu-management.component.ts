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
    MatSelectModule
  ],
  template: `
    <section class="rms-page">
      <div class="page-header">
        <div>
          <h2>Quản lý thực đơn</h2>
          <p>CRUD mô phỏng món ăn cho UI admin.</p>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Tìm món</mat-label>
            <input matInput [value]="keyword()" (input)="setKeyword($event)" />
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="startCreate()">
            <mat-icon>add</mat-icon>
            Thêm món
          </button>
        </div>
      </div>

      @if (editingItemId() !== null) {
        <mat-card class="form-card">
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Tên món</mat-label>
                <input matInput formControlName="name" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Danh mục</mat-label>
                <input matInput formControlName="category" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Giá</mat-label>
                <input matInput type="number" formControlName="price" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Trạng thái</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="available">Còn hàng</mat-option>
                  <mat-option value="out-of-stock">Hết hàng</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="form-actions">
                <button mat-stroked-button type="button" (click)="cancel()">Hủy</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Lưu</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <mat-card class="table-card">
        <mat-card-content>
          <table mat-table [dataSource]="filteredMenuItems()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Tên món</th>
            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
          </ng-container>

          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Danh mục</th>
            <td mat-cell *matCellDef="let row">{{ row.category }}</td>
          </ng-container>

          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Giá</th>
            <td mat-cell *matCellDef="let row">{{ row.price | currency : 'VND' : 'symbol' : '1.0-0' }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
            <td mat-cell *matCellDef="let row">
              <span class="status-chip" [class.out]="row.status === 'out-of-stock'">
                {{ row.status === 'available' ? 'Còn hàng' : 'Hết hàng' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Hành động</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button (click)="startEdit(row)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="remove(row.id)"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .rms-page {
        display: grid;
        gap: 16px;
      }

      .page-header {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: space-between;
      }

      .page-header p {
        margin: 4px 0 0;
        color: #6b7280;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .search-field {
        width: 240px;
      }

      .full-width {
        width: 100%;
      }

      .form-card,
      .table-card {
        border-radius: 18px;
        box-shadow: 0 12px 30px rgba(16, 24, 40, 0.08);
      }

      .form-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }

      .form-actions {
        grid-column: 1 / -1;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .status-chip {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        background: #dcfce7;
        color: #166534;
        font-size: 12px;
        font-weight: 600;
      }

      .status-chip.out {
        background: #fee2e2;
        color: #991b1b;
      }

      @media (max-width: 720px) {
        .header-actions {
          width: 100%;
          flex-wrap: wrap;
        }

        .search-field {
          width: 100%;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuManagementComponent {
  private readonly mockData = inject(MockDataService);
  private readonly fb = inject(FormBuilder);

  readonly menuItems = signal<MenuItem[]>(this.mockData.getMenuItems());
  readonly keyword = signal('');
  readonly editingItemId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    category: ['', [Validators.required]],
    price: [50000, [Validators.required, Validators.min(1000)]],
    status: ['available' as MenuItem['status'], [Validators.required]]
  });

  readonly filteredMenuItems = computed(() => {
    const keyword = this.keyword().trim().toLowerCase();
    const items = this.menuItems();
    if (!keyword) {
      return items;
    }

    return items.filter(
      item => item.name.toLowerCase().includes(keyword) || item.category.toLowerCase().includes(keyword)
    );
  });

  readonly displayedColumns = ['name', 'category', 'price', 'status', 'actions'];

  setKeyword(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.keyword.set(value);
  }

  startCreate(): void {
    this.editingItemId.set(0);
    this.form.reset({
      name: '',
      category: '',
      price: 50000,
      status: 'available'
    });
  }

  startEdit(item: MenuItem): void {
    this.editingItemId.set(item.id);
    this.form.reset({
      name: item.name,
      category: item.category,
      price: item.price,
      status: item.status
    });
  }

  save(): void {
    if (this.form.invalid || this.editingItemId() === null) {
      return;
    }

    const raw = this.form.getRawValue();
    const id = this.editingItemId();

    if (id === 0) {
      const nextId = Math.max(...this.menuItems().map(item => item.id), 0) + 1;
      this.menuItems.update(items => [
        {
          id: nextId,
          name: raw.name,
          category: raw.category,
          price: Number(raw.price),
          status: raw.status
        },
        ...items
      ]);
    } else {
      this.menuItems.update(items =>
        items.map(item =>
          item.id === id
            ? {
                ...item,
                name: raw.name,
                category: raw.category,
                price: Number(raw.price),
                status: raw.status
              }
            : item
        )
      );
    }

    this.cancel();
  }

  remove(id: number): void {
    this.menuItems.update(items => items.filter(item => item.id !== id));
    if (this.editingItemId() === id) {
      this.cancel();
    }
  }

  cancel(): void {
    this.editingItemId.set(null);
    this.form.reset({
      name: '',
      category: '',
      price: 50000,
      status: 'available'
    });
  }
}
