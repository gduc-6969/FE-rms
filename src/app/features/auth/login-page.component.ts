import { ChangeDetectionStrategy, Component, signal, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule
  ],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="brand-row">
          <div class="brand-icon"><mat-icon>bar_chart</mat-icon></div>
          <div class="brand-name">Gastros</div>
        </div>

        @if (mode() === 'login') {
          <div class="header">
            <h1>Welcome Back</h1>
            <p>ENTER YOUR CREDENTIALS TO CONTINUE</p>
          </div>

          <form class="auth-form" [formGroup]="loginForm" (ngSubmit)="onLogin()">
            <label class="field-label" for="login-email">EMAIL OR PHONE NUMBER</label>
            <div class="input-shell">
              <mat-icon>mail_outline</mat-icon>
              <input id="login-email" formControlName="email" placeholder="you@example.com" />
            </div>

            <label class="field-label" for="login-password">PASSWORD</label>
            <div class="input-shell">
              <mat-icon>lock_outline</mat-icon>
              <input
                id="login-password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
              />
              <button class="icon-btn" type="button" (click)="togglePasswordVisibility()" aria-label="Toggle password visibility">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>

            <div class="row-options">
              <label class="remember-me">
                <input type="checkbox" formControlName="rememberMe" />
                <span>Remember me</span>
              </label>
              <button class="text-action" type="button" (click)="onForgotPassword()">Forgot Password?</button>
            </div>

            @if (errorMessage()) {
              <p class="error">{{ errorMessage() }}</p>
            }

            <button class="submit-btn" type="submit" [disabled]="loginForm.invalid || isLoading()">
              {{ isLoading() ? 'LOGGING IN...' : 'LOGIN' }}
              <mat-icon>arrow_forward</mat-icon>
            </button>

            <div class="quick-login">
              <p>QUICK DEMO ACCESS</p>
              <div class="quick-buttons">
                <button type="button" (click)="quickLogin('customer')">Customer</button>
                <button type="button" (click)="quickLogin('staff')">Staff</button>
                <button type="button" (click)="quickLogin('admin')">Manager</button>
              </div>
            </div>

            <div class="toggle-mode">
              <span>New to Gastros?</span>
              <button class="text-action" type="button" (click)="toggleMode()">Create an account</button>
            </div>
          </form>
        } @else {
          <div class="header">
            <h1>Create Account</h1>
            <p>REGISTER TO ACCESS THE RESTAURANT SYSTEM</p>
          </div>

          <form class="auth-form" [formGroup]="registerForm" (ngSubmit)="onRegister()">
            <div class="role-tabs" role="tablist" aria-label="Register role">
              <button
                class="role-tab"
                [class.active]="registerRole() === 'customer'"
                type="button"
                (click)="setRegisterRole('customer')"
              >
                <mat-icon>person_outline</mat-icon>
                <span>CUSTOMER</span>
              </button>
              <button
                class="role-tab"
                [class.active]="registerRole() === 'staff'"
                type="button"
                (click)="setRegisterRole('staff')"
              >
                <mat-icon>groups_2</mat-icon>
                <span>STAFF</span>
              </button>
            </div>

            <label class="field-label" for="register-name">FULL NAME</label>
            <div class="input-shell">
              <mat-icon>person_outline</mat-icon>
              <input id="register-name" formControlName="name" placeholder="Nguyen Van A" />
            </div>

            <label class="field-label" for="register-email">EMAIL</label>
            <div class="input-shell">
              <mat-icon>mail_outline</mat-icon>
              <input id="register-email" formControlName="email" placeholder="you@example.com" />
            </div>

            <label class="field-label" for="register-password">PASSWORD</label>
            <div class="input-shell">
              <mat-icon>lock_outline</mat-icon>
              <input id="register-password" type="password" formControlName="password" placeholder="••••••••" />
            </div>

            @if (errorMessage()) {
              <p class="error">{{ errorMessage() }}</p>
            }

            <button class="submit-btn" type="submit" [disabled]="registerForm.invalid || isLoading()">
              {{
                isLoading()
                  ? 'CREATING...'
                  : registerRole() === 'staff'
                    ? 'REGISTER AS STAFF'
                    : 'REGISTER AS CUSTOMER'
              }}
              <mat-icon>arrow_forward</mat-icon>
            </button>
            <div class="toggle-mode">
              <span>Already have an account?</span>
              <button class="text-action" type="button" (click)="toggleMode()">Sign in</button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .login-page {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 24px 16px;
        background: #f3f4f6;
      }

      .login-card {
        width: min(100%, 560px);
        box-sizing: border-box;
        border-radius: 32px;
        background: #f3f4f6;
        padding: 6px;
        font-family: 'Inter', Roboto, 'Helvetica Neue', sans-serif;
        font-size: 16px;
      }

      .brand-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin: 8px 0 32px;
      }

      .brand-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: #ff6a2c;
        color: #ffffff;
        display: grid;
        place-items: center;
      }

      .brand-icon mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .brand-name {
        font-size: 44px;
        line-height: 1;
        font-weight: 800;
        color: #23252f;
      }

      .header h1 {
        font-size: clamp(42px, 7vw, 56px);
        font-weight: 900;
        color: #23252f;
      }

      .header p {
        margin: 10px 0 26px;
        font-size: 16px;
        letter-spacing: 0.11em;
        color: #687282;
        font-weight: 700;
      }

      .auth-form {
        display: grid;
        gap: 10px;
      }

      .field-label {
        margin-top: 8px;
        color: #8b95a5;
        font-size: 16px;
        letter-spacing: 0.12em;
        font-weight: 800;
      }

      .role-tabs {
        margin: 6px 0 6px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .role-tab {
        min-height: 82px;
        border-radius: 18px;
        border: 1px solid #e5e7eb;
        background: #f8fafc;
        color: #98a2b3;
        font-size: 16px;
        letter-spacing: 0.1em;
        font-weight: 800;
        display: grid;
        place-items: center;
        gap: 4px;
        cursor: pointer;
      }

      .role-tab mat-icon {
        font-size: 21px;
        width: 21px;
        height: 21px;
      }

      .role-tab.active {
        border-color: #ff6a2c;
        background: #fef6f0;
        color: #ff6a2c;
      }

      .input-shell {
        border: 1px solid #e5e7eb;
        border-radius: 24px;
        min-height: 70px;
        padding: 0 18px;
        display: flex;
        align-items: center;
        gap: 12px;
        background: #ffffff;
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
      }

      .input-shell mat-icon {
        color: #98a2b3;
      }

      .input-shell input {
        border: none;
        outline: none;
        width: 100%;
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        background: transparent;
      }

      .input-shell input::placeholder {
        color: #9ca3af;
      }

      .icon-btn {
        border: none;
        background: transparent;
        display: grid;
        place-items: center;
        padding: 0;
        cursor: pointer;
      }

      .icon-btn mat-icon {
        color: #98a2b3;
      }

      .row-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 2px;
      }

      .remember-me {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #6b7280;
        font-weight: 600;
      }

      .remember-me input {
        width: 20px;
        height: 20px;
        accent-color: #2e3038;
      }

      .text-action {
        border: none;
        background: transparent;
        color: #ff6a2c;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
      }

      .submit-btn {
        margin-top: 8px;
        min-height: 78px;
        border: none;
        border-radius: 24px;
        background: #2e3038;
        color: #ffffff;
        font-size: 16px;
        letter-spacing: 0.12em;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        box-shadow: 0 12px 20px rgba(15, 23, 42, 0.12);
      }

      .submit-btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .submit-btn mat-icon {
        font-size: 30px;
        width: 30px;
        height: 30px;
      }

      .error {
        color: #dc2626;
        margin: 0;
        text-align: left;
        font-size: 16px;
        font-weight: 700;
      }

      .toggle-mode {
        border-top: 1px solid #d5d9e1;
        margin-top: 30px;
        padding-top: 20px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-size: 16px;
        color: #687282;
        font-weight: 700;
      }

      .quick-login {
        margin-top: 14px;
      }

      .quick-login p {
        margin: 8px 0 14px;
        color: #8b95a5;
        text-align: center;
        font-size: 16px;
        letter-spacing: 0.12em;
        font-weight: 800;
      }

      .quick-buttons {
        display: flex;
        justify-content: center;
        gap: 12px;
      }

      .quick-buttons button {
        min-width: 96px;
        height: 34px;
        border-radius: 999px;
        border: 1px solid #d5d9e1;
        background: #f8fafc;
        color: #687282;
        font-weight: 700;
        cursor: pointer;
      }

      @media (max-width: 640px) {
        .login-card {
          width: min(100%, 460px);
        }

        .brand-name {
          font-size: 34px;
        }

        .header h1 {
          font-size: clamp(30px, 9vw, 44px);
        }

        .header p {
          font-size: 16px;
        }

        .input-shell {
          min-height: 58px;
        }

        .input-shell input {
          font-size: 16px;
        }

        .submit-btn {
          min-height: 58px;
          font-size: 16px;
        }

        .text-action {
          font-size: 16px;
        }

        .error {
          font-size: 16px;
        }

        .toggle-mode {
          font-size: 16px;
          flex-wrap: wrap;
        }
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
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  readonly registerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly showPassword = signal(false);
  readonly registerRole = signal<'customer' | 'staff'>('customer');

  toggleMode(): void {
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
    this.errorMessage.set('');
    this.showPassword.set(false);
    this.registerRole.set('customer');
  }

  setRegisterRole(role: 'customer' | 'staff'): void {
    this.registerRole.set(role);
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  onForgotPassword(): void {
    this.errorMessage.set('Tính năng quên mật khẩu sẽ được cập nhật sớm.');
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    const { email, password } = this.loginForm.getRawValue();
    const credentials = { email, password };

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
    const payload = {
      ...this.registerForm.getRawValue(),
      role: this.registerRole()
    };

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

