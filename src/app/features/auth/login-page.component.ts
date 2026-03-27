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
        <div class="brand-block">
          <div class="brand-row">
            <img
              class="brand-logo-image"
              src="/assets/vecteezy_steak-creative-icon-design_15969625-removebg-preview.png"
              alt="Desinare steak logo"
            />
            <div class="brand-name">Desinare</div>
          </div>
          <div class="brand-stars" aria-hidden="true">
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
          </div>
          <p class="brand-nickname">"Take a seat, for a classic treat."</p>
        </div>

        @if (mode() === 'login') {
          <form class="auth-form login-form" [formGroup]="loginForm" (ngSubmit)="onLogin()">
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

            <div class="toggle-mode">
              <span>New to Desinare?</span>
              <button class="text-action" type="button" (click)="toggleMode()">Create an account</button>
            </div>
          </form>
        } @else {
    

          <form class="auth-form register-form" [formGroup]="registerForm" (ngSubmit)="onRegister()">
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
              {{ isLoading() ? 'CREATING...' : 'REGISTER' }}
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
      :host {
        --v-cream: #181617;
        --v-parchment: #171416;
        --v-sepia: #9f8864;
        --v-brass: #b3905f;
        --v-burgundy: #5f2236;
        --v-forest: #465548;
        --v-ink: #fff4e4;
        --v-muted: #c8baa4;
      }

      .login-page {
        min-height: 100dvh;
        height: 100dvh;
        display: grid;
        place-items: center;
        padding: clamp(8px, 2vh, 16px) 12px;
        background:
          linear-gradient(145deg, rgba(10, 10, 12, 0.93) 0%, rgba(21, 17, 18, 0.91) 62%, rgba(19, 13, 16, 0.94) 100%),
          url('/assets/vecteezy_vector-vintage-fast-food-seamless-pattern-hand-drawn_14469007.jpg');
        background-position: center;
        background-size: cover;
        position: relative;
        overflow: hidden;
      }

      .login-page::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          radial-gradient(circle at 25% 10%, rgba(179, 144, 95, 0.14), transparent 34%),
          radial-gradient(circle at 85% 86%, rgba(95, 34, 54, 0.22), transparent 36%);
      }

      .login-page::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          repeating-linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.012) 0,
            rgba(255, 255, 255, 0.012) 1px,
            rgba(0, 0, 0, 0.018) 1px,
            rgba(0, 0, 0, 0.018) 3px
          ),
          repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.008) 0,
            rgba(255, 255, 255, 0.008) 2px,
            rgba(0, 0, 0, 0.014) 2px,
            rgba(0, 0, 0, 0.014) 4px
          );
        opacity: 0.24;
      }

      .login-card {
        width: min(100%, 520px);
        box-sizing: border-box;
        border-radius: 0;
        background: linear-gradient(180deg, rgba(23, 20, 21, 0.96) 0%, rgba(16, 14, 15, 0.96) 100%);
        border: 1px solid rgba(179, 144, 95, 0.44);
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55), inset 0 0 0 1px rgba(251, 226, 178, 0.04);
        padding: 20px 20px 18px;
        font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
        font-size: 16px;
        color: var(--v-ink);
        position: relative;
        z-index: 1;
      }

      .brand-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin: 4px 0 8px;
      }

      .brand-block {
        text-align: center;
        margin-bottom: 12px;
      }

      .brand-logo-image {
        width: 52px;
        height: 52px;
        object-fit: contain;
        filter: none;
      }

      .brand-name {
        font-family: 'Playfair Display', 'Times New Roman', serif;
        font-size: clamp(42px, 6.2vw, 58px);
        line-height: 1.08;
        color: #fff8eb;
        letter-spacing: 0.01em;
        font-weight: 700;
        font-style: italic;
        text-shadow: 0 0 10px rgba(247, 238, 223, 0.22), 0 0 20px rgba(109, 73, 31, 0.2);
      }

      .brand-stars {
        display: flex;
        justify-content: center;
        gap: 6px;
        margin: 0 0 6px;
        color: #c8a46c;
        font-size: 11px;
        letter-spacing: 0.1em;
      }

      .brand-nickname {
        margin: 0;
        font-size: 16px;
        line-height: 1.25;
        color: #fff0da;
        font-style: italic;
        letter-spacing: 0.02em;
        text-shadow: 0 0 8px rgba(240, 228, 206, 0.16);
      }

      .header {
        position: relative;
        margin-bottom: 6px;
      }

      .header::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: -12px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(179, 144, 95, 0.52), transparent);
      }

      .header h1 {
        font-family: 'Playfair Display', 'Times New Roman', serif;
        font-size: clamp(42px, 7vw, 56px);
        font-weight: 700;
        color: #fff2dc;
        letter-spacing: 0.01em;
      }

      .header p {
        margin: 8px 0 22px;
        font-size: 16px;
        letter-spacing: 0.11em;
        color: #d5c7b0;
        font-weight: 600;
        text-transform: uppercase;
        font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
      }

      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
        font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
      }

      .login-form {
        min-height: 430px;
      }

      .register-form {
        min-height: 0;
      }

      .field-label {
        margin-top: 2px;
        color: #e5d2b2;
        font-size: 12px;
        letter-spacing: 0.11em;
        font-weight: 600;
        font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
      }

      .input-shell {
        border: 1px solid rgba(179, 144, 95, 0.52);
        border-radius: 0;
        min-height: 56px;
        padding: 0 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        background: #1a1717;
        box-shadow: inset 0 0 0 1px rgba(246, 220, 171, 0.05);
      }

      .input-shell mat-icon,
      .icon-btn mat-icon {
        color: #c39b64;
      }

      .input-shell input {
        border: none;
        outline: none;
        width: 100%;
        font-size: 15px;
        font-weight: 500;
        color: #fff1dc;
        background: transparent;
        font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
      }

      .input-shell input::placeholder {
        color: #bcab93;
      }

      .icon-btn {
        border: none;
        background: transparent;
        display: grid;
        place-items: center;
        padding: 0;
        cursor: pointer;
      }

      .row-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0;
        font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
      }

      .remember-me {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #e0ceae;
        font-size: 14px;
        font-weight: 500;
        font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
      }

      .remember-me input {
        width: 20px;
        height: 20px;
        accent-color: #c39b64;
      }

      .text-action {
        border: none;
        background: transparent;
        color: #f0c88a;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: underline;
        text-decoration-color: rgba(214, 170, 108, 0.45);
        text-underline-offset: 4px;
        font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
      }

      .submit-btn {
        margin-top: 12px;
        min-height: 62px;
        border: 1px solid rgba(201, 167, 104, 0.66);
        border-radius: 0;
        background: linear-gradient(180deg, #6a273b 0%, #4b1a2a 100%);
        color: #fff4e3;
        font-size: 15px;
        letter-spacing: 0.13em;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(242, 212, 156, 0.1);
        text-transform: uppercase;
        font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
      }

      .login-form .submit-btn {
        margin-top: auto;
      }

      .submit-btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .submit-btn mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
      }

      .error {
        color: #f2a0a4;
        margin: 0;
        text-align: left;
        font-size: 14px;
        font-weight: 600;
        font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
      }

      .toggle-mode {
        border-top: 1px solid rgba(179, 144, 95, 0.24);
        margin-top: 14px;
        padding-top: 12px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-size: 14px;
        color: #d5c5ab;
        font-weight: 600;
        font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
      }

      @media (max-width: 640px) {
        .login-card {
          width: min(100%, 430px);
          padding: 14px;
        }

        .login-form {
          min-height: 0;
        }

        .brand-name {
          font-size: clamp(34px, 10vw, 46px);
          line-height: 1.06;
          letter-spacing: 0.01em;
        }

        .brand-nickname {
          font-size: 12px;
        }

        .header h1 {
          font-size: clamp(34px, 9vw, 46px);
        }

        .input-shell {
          min-height: 52px;
        }

        .submit-btn {
          min-height: 56px;
          margin-top: 10px;
        }

        .row-options,
        .toggle-mode {
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

  toggleMode(): void {
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
    this.errorMessage.set('');
    this.showPassword.set(false);
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
      ...this.registerForm.getRawValue()
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

  private goToRoleHome(role: UserRole): void {
    const routeMap: Record<UserRole, string> = {
      admin: '/admin/dashboard',
      staff: '/staff/tables',
      customer: '/customer/home'
    };

    this.router.navigateByUrl(routeMap[role]);
  }
}

