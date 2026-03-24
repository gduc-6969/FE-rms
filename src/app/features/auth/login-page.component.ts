import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/app.models';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  template: `
    <div class="login-page">
      <mat-card class="login-card">
        <div class="header">
          <h1>Restaurant Management System</h1>
          <p>Đăng nhập để truy cập hệ thống RMS</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" placeholder="admin@restaurant.com" />
            <mat-icon matPrefix>mail</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mật khẩu</mat-label>
            <input matInput type="password" formControlName="password" placeholder="••••••••" />
            <mat-icon matPrefix>lock</mat-icon>
          </mat-form-field>

          @if (errorMessage()) {
            <p class="error">{{ errorMessage() }}</p>
          }

          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Đăng nhập</button>
        </form>

        <div class="quick-login">
          <p>Đăng nhập nhanh:</p>
          <div class="quick-buttons">
            <button mat-stroked-button type="button" (click)="quickLogin('admin')">Admin</button>
            <button mat-stroked-button type="button" (click)="quickLogin('staff')">Nhân viên</button>
            <button mat-stroked-button type="button" (click)="quickLogin('customer')">Customer</button>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-page {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 16px;
        background: linear-gradient(120deg, #eff6ff 0%, #f8fafc 100%);
      }

      .login-card {
        width: min(100%, 460px);
      }

      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
      }

      .header p {
        margin: 8px 0 24px;
        color: #6b7280;
      }

      form {
        display: grid;
        gap: 12px;
      }

      button[type='submit'] {
        height: 44px;
      }

      .error {
        color: #ef4444;
        margin: 0;
      }

      .quick-login {
        margin-top: 20px;
      }

      .quick-login p {
        margin-bottom: 8px;
        color: #6b7280;
      }

      .quick-buttons {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly errorMessage = signal('');

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  onSubmit(): void {
    const { email, password } = this.form.getRawValue();
    const role = this.authService.login(email, password);

    if (!role) {
      this.errorMessage.set('Sai tài khoản hoặc mật khẩu. Vui lòng thử lại.');
      return;
    }

    this.goToRoleHome(role);
  }

  quickLogin(role: UserRole): void {
    const accountMap: Record<UserRole, string> = {
      admin: 'admin@restaurant.com',
      staff: 'staff@restaurant.com',
      customer: 'customer@restaurant.com'
    };

    this.form.patchValue({ email: accountMap[role], password: 'password123' });
    this.onSubmit();
  }

  private goToRoleHome(role: UserRole): void {
    const routeMap: Record<UserRole, string> = {
      admin: '/admin/dashboard',
      staff: '/staff/tables',
      customer: '/customer/home'
    };

    this.router.navigateByUrl(routeMap[role]);
  }
}
