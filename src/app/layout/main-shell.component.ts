import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { UserRole } from '../core/models/app.models';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-main-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    @if (isAdmin()) {
      <mat-sidenav-container class="shell-container">
        <mat-sidenav mode="side" [opened]="true" class="sidebar">
          <div class="brand">
            <mat-icon>restaurant</mat-icon>
            <div>
              <span>RMS</span>
              <small>Restaurant UI</small>
            </div>
          </div>

          <mat-nav-list>
            @for (item of navItems(); track item.path) {
              <a mat-list-item [routerLink]="item.path" routerLinkActive="active-link" class="nav-item">
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                <span matListItemTitle>{{ item.label }}</span>
              </a>
            }
          </mat-nav-list>
        </mat-sidenav>

        <mat-sidenav-content>
          <mat-toolbar class="toolbar">
            <div class="toolbar-left">
              <strong>{{ roleLabel() }}</strong>
              <span class="name">• {{ authService.fullName() ?? 'Unknown user' }}</span>
            </div>
            <button mat-stroked-button (click)="logout()">
              <mat-icon>logout</mat-icon>
              Logout
            </button>
          </mat-toolbar>

          <main class="page-content">
            <router-outlet />
          </main>
        </mat-sidenav-content>
      </mat-sidenav-container>
    } @else {
      <section class="top-shell">
        <header class="topbar">
          <div class="top-brand">
            <img
              class="top-logo-image"
              src="/assets/logo.jpg"
              alt="Desinare logo"
            />
            <strong>Desinare</strong>
          </div>

          <button mat-icon-button (click)="logout()" aria-label="logout">
            <mat-icon>logout</mat-icon>
          </button>
        </header>

        <nav class="top-nav">
          @for (item of navItems(); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active-top-link" class="top-link">
              <mat-icon>{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <main class="top-content" [class.customer-content]="isCustomer()">
          <router-outlet />
        </main>
      </section>
    }
  `,
  styles: [
    `
      .shell-container {
        height: 100dvh;
        background: radial-gradient(circle at top left, #eff6ff 0%, #f8fafc 46%, #f9fafb 100%);
      }

      .sidebar {
        width: 260px;
        border-right: 1px solid #eef2ff;
        background: #ffffff;
      }

      .brand {
        display: flex;
        gap: 10px;
        align-items: center;
        padding: 20px 18px;
        font-size: 20px;
        font-weight: 700;
        border-bottom: 1px solid #f1f5f9;
      }

      .brand small {
        display: block;
        font-size: 12px;
        line-height: 1.2;
        color: #64748b;
        font-weight: 500;
        margin-top: 2px;
      }

      .toolbar {
        display: flex;
        justify-content: space-between;
        margin: 14px 14px 0;
        border-radius: 14px;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
      }

      .toolbar-left {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .name {
        color: #6b7280;
      }

      .page-content {
        padding: 20px 14px 20px;
        background: transparent;
        min-height: calc(100dvh - 64px);
      }

      .active-link {
        background: #eff6ff;
        color: #1d4ed8;
        border-radius: 12px;
      }

      .nav-item {
        border-radius: 12px;
        margin-inline: 8px;
      }

      @media (max-width: 1024px) {
        .sidebar {
          width: 220px;
        }
      }

      .top-shell {
        min-height: 100dvh;
        display: grid;
        grid-template-rows: auto auto 1fr;
        background: #0F0F0F;
      }

      .topbar {
        height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        border-bottom: 1px solid #2C2C2C;
        background: #1A1A1A;
        backdrop-filter: blur(20px);
      }

      .top-brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .top-brand strong {
        color: #C5A028;
        font-size: 20px;
        font-weight: 600;
        font-family: 'Playfair Display', serif;
        font-style: italic;
      }

      .top-logo-image {
        width: 36px;
        height: 36px;
        object-fit: contain;
      }

      .topbar button {
        color: #F0F0F0;
      }

      .topbar mat-icon {
        color: #A0A0A0;
      }

      .topbar button:hover mat-icon {
        color: #C5A028;
      }

      .top-nav {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid #2C2C2C;
        background: #1A1A1A;
        backdrop-filter: blur(20px);
        overflow: auto;
      }

      .top-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-width: 140px;
        max-width: 140px;
        padding: 12px 16px;
        border-radius: 12px;
        color: #F0F0F0;
        background: #242424;
        border: 1px solid #2C2C2C;
        text-decoration: none;
        white-space: nowrap;
        transition: all 0.2s ease;
        font-weight: 500;
      }

      .top-link:hover {
        background: #2C2C2C;
        border-color: #C5A028;
      }

      .top-link mat-icon {
        color: #A0A0A0;
        transition: color 0.2s ease;
      }

      .top-link:hover mat-icon {
        color: #C5A028;
      }

      .active-top-link {
        background: #C5A028;
        border-color: #C5A028;
        color: #0F0F0F;
      }

      .active-top-link:hover {
        background: #D4AF37;
      }

      .active-top-link mat-icon {
        color: #0F0F0F;
      }

      .top-content {
        padding: 0;
        background: transparent;
      }

      .customer-content {
        max-width: 620px;
        width: 100%;
        justify-self: center;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainShellComponent {
  readonly role = this.authService.role;
  readonly isAdmin = computed(() => this.role() === 'admin');
  readonly isCustomer = computed(() => this.role() === 'customer');

  readonly navByRole: Record<UserRole, NavItem[]> = {
    admin: [
      { label: 'Dashboard', icon: 'space_dashboard', path: '/admin/dashboard' },
      { label: 'Quản lý thực đơn', icon: 'restaurant_menu', path: '/admin/menu' },
      { label: 'Quản lý bàn', icon: 'table_restaurant', path: '/admin/tables' },
      { label: 'Quản lý kho', icon: 'inventory_2', path: '/admin/inventory' },
      { label: 'Quản lý giảm giá', icon: 'sell', path: '/admin/discounts' },
      { label: 'Quản lý nhân viên', icon: 'groups', path: '/admin/staff' },
      { label: 'Reports', icon: 'analytics', path: '/admin/reports' }
    ],
    staff: [
      { label: 'Bàn & Thanh toán', icon: 'table_bar', path: '/staff/tables' },
      { label: 'Lịch sử thanh toán', icon: 'receipt_long', path: '/staff/payment-history' },
      { label: 'Shift', icon: 'schedule', path: '/staff/shift' }
    ],
    customer: [
      { label: 'Home', icon: 'home', path: '/customer/home' },
      { label: 'Menu', icon: 'menu_book', path: '/customer/menu' },
      { label: 'Reservation', icon: 'event_seat', path: '/customer/reservation' },
      { label: 'Profile', icon: 'person', path: '/customer/profile' }
    ]
  };

  readonly navItems = computed(() => {
    const role = this.role();
    return role ? this.navByRole[role] : [];
  });

  readonly roleLabel = computed(() => {
    const role = this.role();
    const labels: Record<UserRole, string> = {
      admin: 'Manager/Admin',
      staff: 'Nhân viên (Phục vụ + Thu ngân)',
      customer: 'Khách hàng'
    };

    return role ? labels[role] : 'Người dùng';
  });

  constructor(
    public readonly authService: AuthService,
    private readonly router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
