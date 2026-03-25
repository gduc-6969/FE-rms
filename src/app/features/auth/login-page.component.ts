import { ChangeDetectionStrategy, Component, signal, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
          <h1>RMS</h1>
          <p>{{ mode() === 'login' ? 'Đăng nhập để truy cập hệ thống RMS' : 'Đăng ký tài khoản hệ thống RMS' }}</p>
        </div>

        @if (mode() === 'login') {
          <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
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

            <button mat-flat-button color="primary" type="submit" [disabled]="loginForm.invalid || isLoading()">Đăng nhập</button>
            <div class="toggle-mode">
              <span>Bạn chưa có tài khoản?</span>
              <button mat-button color="accent" type="button" (click)="toggleMode()">Đăng ký ngay</button>
            </div>
          </form>

          <div class="quick-login">
            <p>Đăng nhập nhanh:</p>
            <div class="quick-buttons">
              <button mat-stroked-button type="button" (click)="quickLogin('admin')">Admin</button>
              <button mat-stroked-button type="button" (click)="quickLogin('staff')">Nhân viên</button>
              <button mat-stroked-button type="button" (click)="quickLogin('customer')">Customer</button>
            </div>
          </div>
        } @else {
          <form [formGroup]="registerForm" (ngSubmit)="onRegister()">
            <mat-form-field appearance="outline">
              <mat-label>Họ và tên</mat-label>
              <input matInput formControlName="name" placeholder="Nguyễn Văn A" />
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" placeholder="email@example.com" />
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

            <button mat-flat-button color="primary" type="submit" [disabled]="registerForm.invalid || isLoading()">Đăng ký</button>
            <div class="toggle-mode">
              <span>Đã có tài khoản?</span>
              <button mat-button color="accent" type="button" (click)="toggleMode()">Đăng nhập</button>
            </div>
          </form>
        }
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
        box-sizing: border-box;
      }

      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        text-align: center;
      }

      .header p {
        margin: 8px 0 24px;
        color: #6b7280;
        text-align: center;
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
        text-align: center;
        font-size: 14px;
      }

      .toggle-mode {
        margin-top: 12px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
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
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = signal<'login' | 'register'>('login');
  readonly errorMessage = signal('');
  readonly isLoading = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly registerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  toggleMode(): void {
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
    this.errorMessage.set('');
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    const credentials = this.loginForm.getRawValue();

    this.authService.login(credentials)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          const role = this.authService.role();
          if (role) {
            this.goToRoleHome(role);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message || 'Lỗi đăng nhập');
          // Error handling based on errorCode: USER_NOT_FOUND or INVALID_PASSWORD
          if (err.errorCode === 'USER_NOT_FOUND') {
            this.errorMessage.set('Tài khoản không tồn tại. Bạn chưa có tài khoản? Đăng ký ngay!');
          }
        }
      });
  }

  onRegister(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    const payload = this.registerForm.getRawValue();

    this.authService.register(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          alert('Đăng ký thành công! Vui lòng đăng nhập.');
          this.mode.set('login');
          this.loginForm.patchValue({ email: payload.email, password: '' });
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message || 'Lỗi đăng ký');
          if (err.errorCode === 'EMAIL_EXISTS') {
             this.errorMessage.set('Email đã tồn tại. Vui lòng sử dụng email khác.');
          }
        }
      });
  }

  quickLogin(role: UserRole): void {
    const accountMap: Record<UserRole, string> = {
      admin: 'admin@restaurant.com',
      staff: 'staff@restaurant.com',
      customer: 'customer@restaurant.com'
    };

    this.loginForm.patchValue({ email: accountMap[role], password: 'password123' });
    this.onLogin();
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

