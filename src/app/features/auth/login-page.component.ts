import { ChangeDetectionStrategy, Component, signal, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';
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
        <!-- Back Button -->
        <button class="back-btn" type="button" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Back to Home
        </button>

        <!-- Desinare Brand Header -->
        <div class="brand-block">
          <div class="brand-row">
            <img
              class="brand-logo-image"
              src="/assets/logo.jpg"
              alt="Desinare steak logo"
            />
            <div class="brand-name">Desinare</div>
          </div>
          <p class="brand-nickname">"Take a seat, for a classic treat."</p>
        </div>

        @if (mode() === 'login') {
          <form class="auth-form login-form" [formGroup]="loginForm" (ngSubmit)="onLogin()">
            <div class="input-group">
              <input 
                id="login-email" 
                formControlName="email" 
                placeholder="Email Address or Phone Number" 
                type="text"
              />
            </div>

            <div class="input-group">
              <input
                id="login-password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="Password"
                (keydown)="preventSpace($event)"
              />
            </div>

            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox" formControlName="rememberMe" />
                <span class="checkmark"></span>
                Remember me
              </label>
              <button class="forgot-password" type="button" (click)="onForgotPassword()">Forgot password?</button>
            </div>

            @if (errorMessage()) {
              <p class="error">{{ errorMessage() }}</p>
            }

            <button class="submit-btn" type="submit" [disabled]="loginForm.invalid || isLoading()">
              {{ isLoading() ? 'LOGGING IN...' : 'CONTINUE' }}
              <mat-icon>arrow_forward</mat-icon>
            </button>

            <!-- Mode Toggle Inside Form -->
            <div class="toggle-mode">
              <span>New to Desinare?</span>
              <button class="text-action" type="button" (click)="toggleMode()">Create an account</button>
            </div>
          </form>
        } @else {
          <form class="auth-form register-form" [formGroup]="registerForm" (ngSubmit)="onRegister()">
            <div class="input-group">
              <input 
                id="register-name" 
                formControlName="name" 
                placeholder="Full Name" 
              />
            </div>

            <div class="input-group">
              <input 
                id="register-email" 
                formControlName="email" 
                placeholder="Email" 
                type="email"
              />
            </div>

            <div class="input-group">
              <input 
                id="register-password" 
                type="password" 
                formControlName="password" 
                placeholder="Password"
                (keydown)="preventSpace($event)"
              />
            </div>

            @if (errorMessage()) {
              <p class="error">{{ errorMessage() }}</p>
            }

            <button class="submit-btn" type="submit" [disabled]="registerForm.invalid || isLoading()">
              {{ isLoading() ? 'CREATING...' : 'CONTINUE' }}
              <mat-icon>arrow_forward</mat-icon>
            </button>

            <!-- Mode Toggle Inside Form -->
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
        display: block;
        width: 100%;
        height: 100%;
      }

      /* Main Container - Single Background Pattern */
      .login-page {
        min-height: 100dvh;
        height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        background: 
          linear-gradient(135deg, rgba(15, 15, 15, 0.9) 0%, rgba(26, 26, 26, 0.95) 100%),
          url('/assets/bg.jpg');
        background-size: cover;
        background-position: center;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

      /* Login Card */
      .login-card {
        position: relative;
        z-index: 1;
        width: min(440px, 90%);
        max-width: 440px;
        background: #1A1A1A;
        padding: 40px 35px;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
        border: 1px solid #2C2C2C;
      }

      /* Back Button */
      .back-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: transparent;
        border: none;
        color: #A0A0A0;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        padding: 0;
        margin-bottom: 16px;
        transition: color 0.2s ease;
      }

      .back-btn:hover {
        color: #C5A028;
      }

      .back-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* Desinare Branding */
      .brand-block {
        text-align: center;
        margin-bottom: 28px;
      }

      .brand-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        margin: 0 0 10px;
      }

      .brand-logo-image {
        width: 56px;
        height: 56px;
        object-fit: contain;
        border-radius: 12px;
      }

      .brand-name {
        font-family: 'Playfair Display', 'Times New Roman', serif;
        font-size: clamp(44px, 6vw, 56px);
        line-height: 1.1;
        color: #C5A028;
        letter-spacing: 0.02em;
        font-weight: 700;
        font-style: italic;
      }

      .brand-nickname {
        margin: 0;
        font-size: 17px;
        line-height: 1.3;
        color: #A0A0A0;
        font-style: italic;
        letter-spacing: 0.02em;
        font-weight: 400;
      }

      /* Form Styling */
      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .input-group {
        position: relative;
      }

      .input-group input {
        width: 100%;
        height: 54px;
        background: #242424;
        border: 1px solid #2C2C2C;
        border-radius: 12px;
        padding: 0 18px;
        font-size: 15px;
        color: #F0F0F0;
        font-weight: 500;
        outline: none;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }

      .input-group input::placeholder {
        color: #A0A0A0;
        font-weight: 400;
      }

      .input-group input:focus {
        background: #2C2C2C;
        border-color: #C5A028;
        box-shadow: 0 0 0 3px rgba(197, 160, 40, 0.15);
      }

      /* Error Message */
      .error {
        color: #E06C6C;
        font-size: 14px;
        margin: -8px 0 0 0;
        font-weight: 500;
      }

      /* Form Options Row */
      .form-options {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: -4px 0;
      }

      .remember-me {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: #A0A0A0;
        font-weight: 500;
        cursor: pointer;
        position: relative;
        user-select: none;
      }

      .remember-me input[type="checkbox"] {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .checkmark {
        width: 18px;
        height: 18px;
        min-width: 18px;
        border: 1.5px solid #555;
        border-radius: 4px;
        background: #242424;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .checkmark::after {
        content: '';
        display: none;
        width: 5px;
        height: 9px;
        border: solid #0F0F0F;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        margin-top: -1px;
      }

      .remember-me input[type="checkbox"]:checked ~ .checkmark {
        background: #C5A028;
        border-color: #C5A028;
      }

      .remember-me input[type="checkbox"]:checked ~ .checkmark::after {
        display: block;
      }

      .remember-me:hover .checkmark {
        border-color: #C5A028;
      }

      .forgot-password {
        background: transparent;
        border: none;
        color: #C5A028;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        padding: 0;
        transition: color 0.2s ease;
      }

      .forgot-password:hover {
        color: #D4AF37;
        text-decoration: underline;
        text-underline-offset: 3px;
      }

      /* Submit Button */
      .submit-btn {
        height: 54px;
        background: #C5A028;
        border: none;
        border-radius: 12px;
        color: #0F0F0F;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;
        margin-top: 8px;
      }

      .submit-btn:hover:not(:disabled) {
        background: #D4AF37;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(197, 160, 40, 0.3);
      }

      .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .submit-btn mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      /* Toggle Mode - Inside Form */
      .toggle-mode {
        border-top: 1px solid #2C2C2C;
        margin-top: 18px;
        padding-top: 16px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 14px;
        color: #A0A0A0;
        font-weight: 500;
      }

      .text-action {
        border: none;
        background: transparent;
        color: #C5A028;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: underline;
        text-decoration-color: rgba(197, 160, 40, 0.5);
        text-underline-offset: 3px;
        padding: 0;
        transition: all 0.2s ease;
      }

      .text-action:hover {
        color: #D4AF37;
        text-decoration-color: rgba(197, 160, 40, 0.8);
      }

      /* Responsive Design */
      @media (max-width: 640px) {
        .login-card {
          width: calc(100% - 24px);
          padding: 32px 26px;
          border-radius: 12px;
        }

        .brand-name {
          font-size: clamp(38px, 9vw, 48px);
        }

        .brand-logo-image {
          width: 50px;
          height: 50px;
        }

        .brand-nickname {
          font-size: 15px;
        }

        .input-group input {
          height: 50px;
        }

        .submit-btn {
          height: 50px;
        }
      }

      @media (max-width: 480px) {
        .login-card {
          border-radius: 10px;
          padding: 28px 22px;
        }

        .brand-name {
          font-size: clamp(34px, 10vw, 42px);
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
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = signal<'login' | 'register'>('login');
  readonly errorMessage = signal('');
  readonly isLoading = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(/^\S+$/)]],
    rememberMe: [false]
  });

  readonly registerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(/^\S+$/)]]
  });

  readonly showPassword = signal(false);

  preventSpace(event: KeyboardEvent): void {
    if (event.key === ' ') {
      event.preventDefault();
    }
  }

  toggleMode(): void {
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
    this.errorMessage.set('');
    this.showPassword.set(false);
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  onForgotPassword(): void {
    this.errorMessage.set('Forgot password feature coming soon.');
  }

  goBack(): void {
    this.router.navigate(['/'], { replaceUrl: true });
  }

  onSocialLogin(provider: 'twitter' | 'google' | 'facebook'): void {
    this.errorMessage.set(`Social login via ${provider} coming soon.`);
    // TODO: Implement social login integration
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
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          if (returnUrl && this.isSafeReturnUrl(returnUrl)) {
            this.router.navigateByUrl(returnUrl, { replaceUrl: true });
          } else {
            const role = this.authService.role();
            if (role) {
              this.goToRoleHome(role);
            }
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message || 'Login failed');
          // Error handling based on errorCode: USER_NOT_FOUND or INVALID_PASSWORD
          if (err.errorCode === 'USER_NOT_FOUND') {
            this.errorMessage.set('Account not found. Don\'t have an account? Sign up now!');
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
          alert('Registration successful! Please sign in.');
          this.mode.set('login');
          this.loginForm.patchValue({ email: payload.email, password: '' });
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message || 'Registration failed');
          if (err.errorCode === 'EMAIL_EXISTS') {
             this.errorMessage.set('Email already exists. Please use a different email.');
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

    this.router.navigate([routeMap[role]], { replaceUrl: true });
  }

  private isSafeReturnUrl(url: string): boolean {
    return url.startsWith('/') && !url.startsWith('//') && !url.includes('://');
  }
}

