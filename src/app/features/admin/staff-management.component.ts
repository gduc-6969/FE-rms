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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
    MatSnackBarModule,
    MatPaginatorModule
  ],
  template: `
    <section class="rms-page">
      <div class="page-header">
        <div>
          <h2>Staff Management</h2>
          <p>Manage staff accounts and assign roles.</p>
        </div>
        <button mat-flat-button color="primary" (click)="startCreate()">
          <mat-icon>person_add</mat-icon>
          Add Staff
        </button>
      </div>

      <!-- Add new staff form -->
      @if (isCreating()) {
        <mat-card>
          <mat-card-header>
            <mat-card-title>Add New Staff</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="createForm" (ngSubmit)="createStaff()" class="create-form">
              <mat-form-field appearance="outline">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="name" placeholder="John Doe" />
                @if (createForm.get('name')?.hasError('required')) {
                  <mat-error>Full name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" placeholder="email@gmail.com" />
                @if (createForm.get('email')?.hasError('required')) {
                  <mat-error>Email is required</mat-error>
                }
                @if (createForm.get('email')?.hasError('email')) {
                  <mat-error>Invalid email format</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput formControlName="password" type="password" placeholder="At least 6 characters" />
                @if (createForm.get('password')?.hasError('required')) {
                  <mat-error>Password is required</mat-error>
                }
                @if (createForm.get('password')?.hasError('minlength')) {
                  <mat-error>Password must be at least 6 characters</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Phone Number</mat-label>
                <input matInput formControlName="phone" placeholder="0901234567" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="NHAN_VIEN">Staff</mat-option>
                  <mat-option value="QUAN_LY">Manager</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="actions">
                <button mat-stroked-button type="button" (click)="cancelCreate()">Cancel</button>
                <button mat-flat-button color="primary" type="submit"
                  [disabled]="createForm.invalid || loading()">
                  @if (loading()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    Create Account
                  }
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <!-- Edit role form -->
      @if (editingId() !== null) {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="QUAN_LY">Manager</mat-option>
                  <mat-option value="NHAN_VIEN">Staff</mat-option>
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

      <!-- Staff list table -->
      <mat-card>
        <mat-card-content>
          @if (loading() && items().length === 0) {
            <div class="loading-wrapper">
              <mat-spinner diameter="40" />
            </div>
          } @else {
            <table mat-table [dataSource]="items()" class="full-width">
              <ng-container matColumnDef="fullName">
                <th mat-header-cell *matHeaderCellDef>Full Name</th>
                <td mat-cell *matCellDef="let row">{{ row.fullName }}</td>
              </ng-container>
              <ng-container matColumnDef="username">
                <th mat-header-cell *matHeaderCellDef>Username</th>
                <td mat-cell *matCellDef="let row">{{ row.username }}</td>
              </ng-container>
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let row">
                  <span class="role-badge" [class]="'role-' + row.role">
                    {{ roleLabel(row.role) }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let row">{{ row.email }}</td>
              </ng-container>
              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef>Phone</th>
                <td mat-cell *matCellDef="let row">{{ row.phone || '-' }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <span class="status-badge" [class]="'status-' + row.status">
                    {{ statusLabel(row.status) }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button (click)="startEdit(row)" title="Change Role">
                    <mat-icon>manage_accounts</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="remove(row.id)" title="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>

            @if (items().length === 0) {
              <div class="no-data">No staff members yet. Click "Add Staff" to create one.</div>
            }

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
    .create-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 8px; }
    .full-width { width: 100%; }
    .loading-wrapper { display: flex; justify-content: center; padding: 40px; }
    .no-data { text-align: center; padding: 40px; color: #6b7280; }

    .role-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .role-badge.role-QUAN_LY { background: #dbeafe; color: #1d4ed8; }
    .role-badge.role-NHAN_VIEN { background: #dcfce7; color: #15803d; }

    .status-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-badge.status-hoat_dong { background: #dcfce7; color: #15803d; }
    .status-badge.status-ngung_hoat_dong { background: #fee2e2; color: #b91c1c; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffManagementComponent implements OnInit {
  private readonly staffService = inject(StaffService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  private allStaff: UserResponse[] = [];
  readonly items = signal<UserResponse[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly isCreating = signal(false);
  readonly loading = signal(false);

  // Pagination
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);

  readonly displayedColumns = ['fullName', 'username', 'role', 'email', 'phone', 'status', 'actions'];

  readonly form = this.fb.nonNullable.group({
    role: ['' as Role, Validators.required]
  });

  readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: [''],
    role: ['NHAN_VIEN' as Role, Validators.required]
  });

  roleLabel(role: Role): string {
    const map: Record<Role, string> = {
      QUAN_LY: 'Manager',
      NHAN_VIEN: 'Staff',
      KHACH_HANG: 'Customer'
    };
    return map[role] ?? role;
  }

   statusLabel(status: UserStatus): string {
    const map: Record<UserStatus, string> = {
      hoat_dong: 'Active',
      ngung_hoat_dong: 'Inactive'
    };
    return map[status] ?? status;
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    // Load all users with large page size
    this.staffService.getAllStaff(0, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          // Filter out customers and inactive staff
          this.allStaff = page.content.filter(u =>
            u.role !== 'KHACH_HANG' && u.status !== 'ngung_hoat_dong'
          );
          this.totalElements.set(this.allStaff.length);
          this.updateDisplayedItems();
          this.loading.set(false);
        },
        error: () => {
          this.showError('Failed to load staff list');
          this.loading.set(false);
        }
      });
  }

  private updateDisplayedItems(): void {
    const start = this.currentPage() * this.pageSize();
    const end = start + this.pageSize();
    this.items.set(this.allStaff.slice(start, end));
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.updateDisplayedItems();
  }

  startCreate(): void {
    this.isCreating.set(true);
    this.editingId.set(null);
    this.createForm.reset({ role: 'NHAN_VIEN' });
  }

  cancelCreate(): void {
    this.isCreating.set(false);
    this.createForm.reset();
  }

  createStaff(): void {
    if (this.createForm.invalid) return;

    const formValue = this.createForm.getRawValue();
    this.loading.set(true);

    this.staffService.createStaff({
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      phone: formValue.phone || undefined,
      role: formValue.role
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: newUser => {
          this.allStaff.unshift(newUser);
          this.totalElements.set(this.allStaff.length);
          this.updateDisplayedItems();
          this.cancelCreate();
          this.loading.set(false);
          this.showSuccess('Staff created successfully');
        },
        error: (err) => {
          const msg = err?.error?.message || 'Failed to create staff';
          this.showError(msg);
          this.loading.set(false);
        }
      });
  }

  startEdit(item: UserResponse): void {
    this.editingId.set(item.id);
    this.isCreating.set(false);
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
          this.showSuccess('Role updated successfully');
        },
        error: () => {
          this.showError('Failed to update role');
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
          this.allStaff = this.allStaff.filter(item => item.id !== id);
          this.totalElements.set(this.allStaff.length);
          this.updateDisplayedItems();
          this.loading.set(false);
          this.showSuccess('Staff deleted successfully');
        },
        error: () => {
          this.showError('Failed to delete staff');
          this.loading.set(false);
        }
      });
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset();
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: 'snack-error' });
  }
}