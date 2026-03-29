import {
  ChangeDetectionStrategy, Component, inject,
  signal, OnInit, DestroyRef
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
import { Role, UserResponse, UserStatus } from '../../core/models/user.models';
import { StaffService } from '../../core/services/staff.service';

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
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <section class="rms-page">
      <div class="page-header">
        <div>
          <h2>Quản lý nhân viên</h2>
          <p>Quản lý tài khoản và phân vai trò nhân viên.</p>
        </div>
      </div>

      <!-- Form chỉnh sửa vai trò -->
      @if (editingId() !== null) {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Vai trò</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="QUAN_LY">Quản lý</mat-option>
                  <mat-option value="NHAN_VIEN">Nhân viên</mat-option>
                </mat-select>
              </mat-form-field>
              <div class="actions">
                <button mat-stroked-button type="button" (click)="cancel()">Hủy</button>
                <button mat-flat-button color="primary" type="submit"
                  [disabled]="form.invalid || loading()">
                  {{ loading() ? 'Đang lưu...' : 'Lưu' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <!-- Bảng danh sách -->
      <mat-card>
        <mat-card-content>
          @if (loading() && items().length === 0) {
            <div class="loading-wrapper">
              <mat-spinner diameter="40" />
            </div>
          } @else {
            <table mat-table [dataSource]="items()" class="full-width">
              <ng-container matColumnDef="fullName">
                <th mat-header-cell *matHeaderCellDef>Họ tên</th>
                <td mat-cell *matCellDef="let row">{{ row.fullName }}</td>
              </ng-container>
              <ng-container matColumnDef="username">
                <th mat-header-cell *matHeaderCellDef>Tên đăng nhập</th>
                <td mat-cell *matCellDef="let row">{{ row.username }}</td>
              </ng-container>
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Vai trò</th>
                <td mat-cell *matCellDef="let row">{{ roleLabel(row.role) }}</td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let row">{{ row.email }}</td>
              </ng-container>
              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef>SĐT</th>
                <td mat-cell *matCellDef="let row">{{ row.phone }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
                <td mat-cell *matCellDef="let row">
                  {{ statusLabel(row.status) }}
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Hành động</th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button (click)="startEdit(row)" title="Đổi vai trò">
                    <mat-icon>manage_accounts</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="remove(row.id)" title="Xóa">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
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
    .loading-wrapper { display: flex; justify-content: center; padding: 40px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffManagementComponent implements OnInit {
  private readonly staffService = inject(StaffService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = signal<UserResponse[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly loading = signal(false);

  readonly displayedColumns = ['fullName', 'username', 'role', 'email', 'phone', 'status', 'actions'];

  readonly form = this.fb.nonNullable.group({
    role: ['' as Role, Validators.required]
  });

  // Map Role enum → label tiếng Việt
  roleLabel(role: Role): string {
    const map: Record<Role, string> = {
      QUAN_LY: 'Quản lý',
      NHAN_VIEN: 'Nhân viên',
      KHACH_HANG: 'Khách hàng'
    };
    return map[role] ?? role;
  }

   statusLabel(status: UserStatus): string {
    const map: Record<UserStatus, string> = {
      hoat_dong: 'Đang làm',
      ngung_hoat_dong: 'Nghỉ việc'
    };
    return map[status] ?? status;
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.staffService.getAllStaff()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: users => {
          this.items.set(users);
          this.loading.set(false);
        },
        error: () => {
          this.showError('Không thể tải danh sách nhân viên');
          this.loading.set(false);
        }
      });
  }

  startEdit(item: UserResponse): void {
    this.editingId.set(item.id);
    this.form.reset({ role: item.role });
  }

  save(): void {
    const id = this.editingId();
    if (this.form.invalid || id === null) return;

    const { role } = this.form.getRawValue();
    this.loading.set(true);

    this.staffService.updateRole(id, role)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.items.update(list =>
            list.map(item => item.id === id ? updated : item)
          );
          this.cancel();
          this.loading.set(false);
          this.showSuccess('Cập nhật vai trò thành công');
        },
        error: () => {
          this.showError('Cập nhật vai trò thất bại');
          this.loading.set(false);
        }
      });
  }

  remove(id: number): void {
    this.loading.set(true);
    this.staffService.delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.items.update(list => list.filter(item => item.id !== id));
          this.loading.set(false);
          this.showSuccess('Xóa nhân viên thành công');
        },
        error: () => {
          this.showError('Xóa nhân viên thất bại');
          this.loading.set(false);
        }
      });
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset();
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 3000 });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Đóng', { duration: 4000, panelClass: 'snack-error' });
  }
}