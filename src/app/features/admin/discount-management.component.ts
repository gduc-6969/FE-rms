import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { DiscountItem } from '../../core/models/app.models';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-discount-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  template: `
    <section class="rms-page">
      <div class="page-header">
        <div>
          <h2>Quản lý giảm giá</h2>
          <p>Quản lý mã giảm giá và điều kiện áp dụng.</p>
        </div>
        <button mat-flat-button color="primary" (click)="startCreate()">
          <mat-icon>add</mat-icon>
          Thêm mã
        </button>
      </div>

      @if (editingId() !== null) {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Mã</mat-label>
                <input matInput formControlName="code" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Loại</mat-label>
                <mat-select formControlName="type">
                  <mat-option value="percent">%</mat-option>
                  <mat-option value="amount">Số tiền</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Giá trị</mat-label>
                <input matInput type="number" formControlName="value" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Đơn tối thiểu</mat-label>
                <input matInput type="number" formControlName="minOrder" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Hạn dùng</mat-label>
                <input matInput type="date" formControlName="expiresAt" />
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
            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>Mã</th>
              <td mat-cell *matCellDef="let row">{{ row.code }}</td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Loại</th>
              <td mat-cell *matCellDef="let row">{{ row.type === 'percent' ? '%' : 'Số tiền' }}</td>
            </ng-container>

            <ng-container matColumnDef="value">
              <th mat-header-cell *matHeaderCellDef>Giá trị</th>
              <td mat-cell *matCellDef="let row">{{ row.value }}</td>
            </ng-container>

            <ng-container matColumnDef="minOrder">
              <th mat-header-cell *matHeaderCellDef>Đơn tối thiểu</th>
              <td mat-cell *matCellDef="let row">{{ row.minOrder }}</td>
            </ng-container>

            <ng-container matColumnDef="expiresAt">
              <th mat-header-cell *matHeaderCellDef>Hạn dùng</th>
              <td mat-cell *matCellDef="let row">{{ row.expiresAt }}</td>
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
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscountManagementComponent {
  private readonly mockData = inject(MockDataService);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<DiscountItem[]>(this.mockData.getDiscountItems());
  readonly editingId = signal<number | null>(null);
  readonly displayedColumns = ['code', 'type', 'value', 'minOrder', 'expiresAt', 'actions'];

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    type: ['percent' as DiscountItem['type'], [Validators.required]],
    value: [10, [Validators.required, Validators.min(1)]],
    minOrder: [0, [Validators.required, Validators.min(0)]],
    expiresAt: ['', [Validators.required]]
  });

  startCreate(): void {
    this.editingId.set(0);
    this.form.reset({ code: '', type: 'percent', value: 10, minOrder: 0, expiresAt: '' });
  }

  startEdit(item: DiscountItem): void {
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
    this.form.reset({ code: '', type: 'percent', value: 10, minOrder: 0, expiresAt: '' });
  }
}
