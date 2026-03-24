import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { InventoryItem } from '../../core/models/app.models';
import { MockDataService } from '../../core/services/mock-data.service';

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
    MatFormFieldModule
  ],
  template: `
    <section class="rms-page">
      <div class="page-header">
        <div>
          <h2>Quản lý kho</h2>
          <p>Quản lý danh sách nguyên liệu và mức cảnh báo tồn kho.</p>
        </div>
        <button mat-flat-button color="primary" (click)="startCreate()">
          <mat-icon>add</mat-icon>
          Thêm nguyên liệu
        </button>
      </div>

      @if (editingId() !== null) {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Tên</mat-label>
                <input matInput formControlName="name" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Đơn vị</mat-label>
                <input matInput formControlName="unit" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tồn kho</mat-label>
                <input matInput type="number" min="0" formControlName="stock" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Mức cảnh báo</mat-label>
                <input matInput type="number" min="0" formControlName="alertLevel" />
              </mat-form-field>

              <div class="actions">
                <button mat-stroked-button type="button" (click)="cancel()">Hủy</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Lưu</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="items()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Tên</th>
              <td mat-cell *matCellDef="let row">{{ row.name }}</td>
            </ng-container>

            <ng-container matColumnDef="unit">
              <th mat-header-cell *matHeaderCellDef>Đơn vị</th>
              <td mat-cell *matCellDef="let row">{{ row.unit }}</td>
            </ng-container>

            <ng-container matColumnDef="stock">
              <th mat-header-cell *matHeaderCellDef>Tồn kho</th>
              <td mat-cell *matCellDef="let row" [class.low-stock]="row.stock < row.alertLevel">{{ row.stock }}</td>
            </ng-container>

            <ng-container matColumnDef="alertLevel">
              <th mat-header-cell *matHeaderCellDef>Mức cảnh báo</th>
              <td mat-cell *matCellDef="let row">{{ row.alertLevel }}</td>
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
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }

      .page-header p {
        margin: 4px 0 0;
        color: #6b7280;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
      }

      .actions {
        grid-column: 1 / -1;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .full-width {
        width: 100%;
      }

      .low-stock {
        color: #dc2626;
        font-weight: 700;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryManagementComponent {
  private readonly mockData = inject(MockDataService);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<InventoryItem[]>(this.mockData.getInventoryItems());
  readonly editingId = signal<number | null>(null);
  readonly displayedColumns = ['name', 'unit', 'stock', 'alertLevel', 'actions'];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    unit: ['', [Validators.required]],
    stock: [0, [Validators.required, Validators.min(0)]],
    alertLevel: [0, [Validators.required, Validators.min(0)]]
  });

  startCreate(): void {
    this.editingId.set(0);
    this.form.reset({ name: '', unit: '', stock: 0, alertLevel: 0 });
  }

  startEdit(item: InventoryItem): void {
    this.editingId.set(item.id);
    this.form.reset(item);
  }

  save(): void {
    if (this.form.invalid || this.editingId() === null) {
      return;
    }

    const raw = this.form.getRawValue();
    const editingId = this.editingId();

    if (editingId === 0) {
      const nextId = Math.max(...this.items().map(item => item.id), 0) + 1;
      this.items.update(items => [{ id: nextId, ...raw }, ...items]);
    } else {
      this.items.update(items => items.map(item => (item.id === editingId ? { id: editingId, ...raw } : item)));
    }

    this.cancel();
  }

  remove(id: number): void {
    this.items.update(items => items.filter(item => item.id !== id));
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', unit: '', stock: 0, alertLevel: 0 });
  }
}
