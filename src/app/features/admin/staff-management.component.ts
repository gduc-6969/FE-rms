import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { StaffMember } from '../../core/models/app.models';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-staff-management',
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
          <h2>Quản lý nhân viên</h2>
          <p>CRUD nhân viên và phân vai trò nội bộ.</p>
        </div>
        <button mat-flat-button color="primary" (click)="startCreate()">
          <mat-icon>person_add</mat-icon>
          Thêm nhân viên
        </button>
      </div>

      @if (editingId() !== null) {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
              <mat-form-field appearance="outline"><mat-label>Tên</mat-label><input matInput formControlName="name" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>SĐT</mat-label><input matInput formControlName="phone" /></mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Vai trò</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="Admin">Admin</mat-option>
                  <mat-option value="Phục Vụ">Phục Vụ</mat-option>
                  <mat-option value="Thu Ngân">Thu Ngân</mat-option>
                  <mat-option value="Nhân Viên">Nhân Viên</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Trạng thái</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="active">Active</mat-option>
                  <mat-option value="inactive">Inactive</mat-option>
                </mat-select>
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
            <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Tên</th><td mat-cell *matCellDef="let row">{{ row.name }}</td></ng-container>
            <ng-container matColumnDef="role"><th mat-header-cell *matHeaderCellDef>Vai trò</th><td mat-cell *matCellDef="let row">{{ row.role }}</td></ng-container>
            <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>Email</th><td mat-cell *matCellDef="let row">{{ row.email }}</td></ng-container>
            <ng-container matColumnDef="phone"><th mat-header-cell *matHeaderCellDef>SĐT</th><td mat-cell *matCellDef="let row">{{ row.phone }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Trạng thái</th><td mat-cell *matCellDef="let row">{{ row.status }}</td></ng-container>
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
      .rms-page { display: grid; gap: 16px; }
      .page-header { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
      .page-header p { margin: 4px 0 0; color: #6b7280; }
      .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
      .actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 8px; }
      .full-width { width: 100%; }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffManagementComponent {
  private readonly mockData = inject(MockDataService);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<StaffMember[]>(this.mockData.getStaffMembers());
  readonly editingId = signal<number | null>(null);
  readonly displayedColumns = ['name', 'role', 'email', 'phone', 'status', 'actions'];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    role: ['Nhân Viên' as StaffMember['role'], [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    status: ['active' as StaffMember['status'], [Validators.required]]
  });

  startCreate(): void {
    this.editingId.set(0);
    this.form.reset({ name: '', role: 'Nhân Viên', email: '', phone: '', status: 'active' });
  }

  startEdit(item: StaffMember): void {
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
    this.form.reset({ name: '', role: 'Nhân Viên', email: '', phone: '', status: 'active' });
  }
}
