import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
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
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <section class="rms-page">
      <div class="page-header">
        <div>
          <h2>Quản lý bàn ăn</h2>
          <p>CRUD mô phỏng bàn ăn và trạng thái phục vụ.</p>
        </div>
        <button mat-flat-button color="primary" (click)="startCreate()">
          <mat-icon>add</mat-icon>
          Thêm bàn
        </button>
      </div>

      @if (editingTableId() !== null) {
        <mat-card class="form-card">
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Tên bàn</mat-label>
                <input matInput formControlName="name" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Sức chứa</mat-label>
                <input matInput type="number" min="1" formControlName="capacity" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Khu vực</mat-label>
                <input matInput formControlName="area" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Trạng thái</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="available">Trống</mat-option>
                  <mat-option value="serving">Đang phục vụ</mat-option>
                  <mat-option value="pending-payment">Chờ thanh toán</mat-option>
                  <mat-option value="disabled">Hủy</mat-option>
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

      <section class="table-grid">
        @for (table of tables(); track table.id) {
          <mat-card class="table-card">
            <mat-card-content>
              <div class="title-row">
                <h3>{{ table.name }}</h3>
                <mat-chip [class]="table.status">{{ statusLabel(table.status) }}</mat-chip>
              </div>
              <p>Khu vực: {{ table.area }}</p>
              <p>Sức chứa: {{ table.capacity }} khách</p>
              <p>Khách hiện tại: {{ table.guests ?? 0 }}</p>
              <div class="card-actions">
                <button mat-button (click)="startEdit(table)">Sửa</button>
                <button mat-button color="warn" (click)="remove(table.id)">Xóa</button>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </section>
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
        align-items: center;
        justify-content: space-between;
      }

      .page-header p {
        margin: 4px 0 0;
        color: #6b7280;
      }

      .form-card {
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

      .table-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .table-card {
        border-radius: 18px;
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
      }

      .title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .card-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
      }

      .available {
        background: #dcfce7;
        color: #166534;
      }

      .serving {
        background: #fef3c7;
        color: #92400e;
      }

      .pending-payment {
        background: #fee2e2;
        color: #991b1b;
      }

      .disabled {
        background: #e5e7eb;
        color: #4b5563;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableManagementComponent {
  private readonly mockData = inject(MockDataService);
  private readonly fb = inject(FormBuilder);

  readonly tables = signal<DiningTable[]>(this.mockData.getDiningTables());
  readonly editingTableId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    capacity: [4, [Validators.required, Validators.min(1)]],
    area: ['', [Validators.required]],
    status: ['available' as TableStatus, [Validators.required]]
  });

  startCreate(): void {
    this.editingTableId.set(0);
    this.form.reset({
      name: '',
      capacity: 4,
      area: '',
      status: 'available'
    });
  }

  startEdit(table: DiningTable): void {
    this.editingTableId.set(table.id);
    this.form.reset({
      name: table.name,
      capacity: table.capacity,
      area: table.area,
      status: table.status
    });
  }

  save(): void {
    if (this.form.invalid || this.editingTableId() === null) {
      return;
    }

    const id = this.editingTableId();
    const raw = this.form.getRawValue();

    if (id === 0) {
      const nextId = Math.max(...this.tables().map(table => table.id), 0) + 1;
      this.tables.update(items => [
        {
          id: nextId,
          name: raw.name,
          capacity: Number(raw.capacity),
          area: raw.area,
          status: raw.status,
          guests: 0,
          elapsedMinutes: 0
        },
        ...items
      ]);
    } else {
      this.tables.update(items =>
        items.map(item =>
          item.id === id
            ? {
                ...item,
                name: raw.name,
                capacity: Number(raw.capacity),
                area: raw.area,
                status: raw.status
              }
            : item
        )
      );
    }

    this.cancel();
  }

  remove(id: number): void {
    this.tables.update(items => items.filter(item => item.id !== id));
    if (this.editingTableId() === id) {
      this.cancel();
    }
  }

  cancel(): void {
    this.editingTableId.set(null);
    this.form.reset({
      name: '',
      capacity: 4,
      area: '',
      status: 'available'
    });
  }

  statusLabel(status: TableStatus): string {
    if (status === 'available') {
      return 'Trống';
    }
    if (status === 'serving') {
      return 'Đang phục vụ';
    }
    if (status === 'pending-payment') {
      return 'Chờ thanh toán';
    }

    return 'Hủy';
  }
}
