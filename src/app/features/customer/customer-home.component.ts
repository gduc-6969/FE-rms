import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { MenuService } from '../../core/services/menu.service';
import { MenuItemResponse } from '../../core/models/app.models';
import { CustomerReservationFlowService } from '../../core/services/customer-reservation-flow.service';
import { ReservationService } from '../../core/services/reservation.service';

const HOME_SESSIONS = [
  { id: 'lunch' as const,  label: 'Lunch Session',  start: 10, end: 14, cutoffHour: 9,  cutoffMin: 30 },
  { id: 'dinner' as const, label: 'Dinner Session', start: 17, end: 22, cutoffHour: 16, cutoffMin: 0  }
];

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink, CurrencyPipe, DecimalPipe],
  template: `
    <section class="customer-home">
      <!-- Hero Section with Combined Headline -->
      <div class="hero-section">
        <div class="hero-overlay">
          <div class="status-badge">
            <span class="status-dot"></span>
            Open Now
          </div>
          <h1 class="hero-headline">
            <span class="brand-accent">La Cuisine Moderne</span>
            <span class="hero-subtitle">Fine Dining Redefined</span>
          </h1>
          <button class="hero-cta" routerLink="/customer/reservation">
            <mat-icon>calendar_today</mat-icon>
            Book a Table
          </button>
        </div>
      </div>

      <!-- Today's Dining Status Widget -->
      <mat-card class="booking-widget">
        <mat-card-content>
          <div class="booking-steps">
            <div class="booking-step">
              <mat-icon>calendar_today</mat-icon>
              <div class="step-content">
                <small>Today</small>
                <strong>{{ todayLabel() }}</strong>
              </div>
            </div>
            <div class="step-divider"></div>
            <div class="booking-step">
              <mat-icon>schedule</mat-icon>
              <div class="step-content">
                <small>Current Time</small>
                <strong>{{ currentTimeLabel() }}</strong>
              </div>
            </div>
            <div class="step-divider"></div>
            <div class="booking-step">
              <mat-icon>table_restaurant</mat-icon>
              <div class="step-content">
                <small>Tables</small>
                <strong>{{ bookableTables() }} Available</strong>
              </div>
            </div>
          </div>

          <!-- Session Badge -->
          <div class="session-badge-row">
            <span class="session-pill" [class.session-active]="sessionActive()" [class.session-booking-open]="bookingOpen()">
              <span class="session-indicator"></span>
              {{ sessionLabel() }}
            </span>
            @if (bookingOpen()) {
              <span class="booking-status open">
                <mat-icon>check_circle</mat-icon>
                Booking Open
              </span>
            } @else if (sessionActive()) {
              <span class="booking-status closed">
                <mat-icon>cancel</mat-icon>
                Booking Closed
              </span>
            }
          </div>

          <button class="check-availability" routerLink="/customer/reservation">
            Book a Table
          </button>
          <p class="next-available">
            <mat-icon>access_time</mat-icon>
            {{ sessionNote() }}
          </p>
        </mat-card-content>
      </mat-card>

      <!-- Explore Menu Card -->
      <mat-card class="menu-card" routerLink="/customer/menu">
        <div class="menu-card-image"></div>
        <div class="menu-card-overlay">
          <div class="menu-card-content">
            <h3>Explore Our Menu</h3>
            <p>Discover seasonal specialties &amp; signature dishes</p>
            <span class="menu-link">
              View Full Menu
              <mat-icon>arrow_forward</mat-icon>
            </span>
          </div>
        </div>
      </mat-card>

      <!-- Seasonal Specialties -->
      <div class="section-header">
        <h2>Seasonal Specialties</h2>
        <span class="section-link" routerLink="/customer/menu">Discover More</span>
      </div>
      <section class="specialties-grid">
        @if (isLoading()) {
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-card">
              <div class="skeleton-img"></div>
              <div class="skeleton-body">
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
              </div>
            </div>
          }
        } @else {
          @for (item of seasonalItems(); track item.id) {
            <mat-card class="specialty-card">
              <div class="specialty-image"
                [style.backgroundImage]="item.imageUrl ? 'url(' + item.imageUrl + ')' : ''">
              </div>
              <mat-card-content>
                <p class="specialty-name">{{ item.name }}</p>
                <small class="specialty-desc">{{ item.categoryName }}</small>
                <span class="specialty-price">{{ item.price | number }}đ</span>
              </mat-card-content>
            </mat-card>
          }
        }
      </section>

      <!-- Chef's Recommendations -->
      <div class="section-header">
        <div class="chef-header">
          <h2>Chef's Recommendations</h2>
          <span class="chef-badge">
            <mat-icon>workspace_premium</mat-icon>
            Chef's Pick
          </span>
        </div>
        <span class="section-link" routerLink="/customer/menu">Meet Our Selection</span>
      </div>
      <section class="recommend-grid">
        @if (isLoading()) {
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-card">
              <div class="skeleton-img tall"></div>
              <div class="skeleton-body">
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
              </div>
            </div>
          }
        } @else {
          @for (dish of chefDishes(); track dish.id) {
            <mat-card class="recommend-card">
              <div class="dish-image"
                [style.backgroundImage]="dish.imageUrl ? 'url(' + dish.imageUrl + ')' : ''">
              </div>
              <div class="chef-pick-badge">
                <mat-icon>star</mat-icon>
              </div>
              <mat-card-content>
                <p class="dish-name">{{ dish.name }}</p>
                <small class="dish-desc">{{ dish.categoryName }}</small>
                <span class="dish-price">{{ dish.price | number }}đ</span>
              </mat-card-content>
            </mat-card>
          }
        }
      </section>
    </section>
  `,
  styles: [
    `
      .customer-home {
        display: grid;
        gap: 16px;
        background: #0F0F0F;
        min-height: 100vh;
        padding: 0 0 20px 0;
      }

      /* Hero Section */
      .hero-section {
        position: relative;
        height: 320px;
        background: 
          linear-gradient(180deg, rgba(15, 15, 15, 0.3) 0%, rgba(15, 15, 15, 0.95) 100%),
          url('/assets/bg.jpg');
        background-size: cover;
        background-position: center;
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 24px 20px;
      }

      .status-badge {
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(26, 26, 26, 0.9);
        border: 1px solid #2C2C2C;
        border-radius: 20px;
        padding: 8px 14px;
        font-size: 13px;
        font-weight: 600;
        color: #2BAE66;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        background: #2BAE66;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .hero-headline {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .brand-accent {
        font-family: 'Playfair Display', 'Cormorant Garamond', serif;
        font-size: 36px;
        font-weight: 700;
        color: #C5A028;
        font-style: italic;
      }

      .hero-subtitle {
        font-size: 18px;
        font-weight: 400;
        color: #A0A0A0;
        letter-spacing: 0.05em;
      }

      .hero-cta {
        margin-top: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        background: #C5A028;
        color: #0F0F0F;
        border: none;
        border-radius: 12px;
        padding: 16px 32px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 20px rgba(197, 160, 40, 0.3);
        width: fit-content;
      }

      .hero-cta:hover {
        background: #D4AF37;
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(197, 160, 40, 0.4);
      }

      .hero-cta mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      /* Booking Widget */
      .booking-widget {
        margin: -40px 20px 0;
        position: relative;
        z-index: 10;
        border-radius: 16px;
        background: #1A1A1A;
        border: 1px solid #2C2C2C;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      }

      .booking-steps {
        display: flex;
        align-items: stretch;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 16px;
      }

      .booking-step {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        padding: 12px;
        background: #242424;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        min-width: 0;
      }

      .booking-step:hover {
        border-color: #C5A028;
        background: #2C2C2C;
      }

      .booking-step mat-icon {
        color: #C5A028;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .step-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .step-content small {
        font-size: 11px;
        color: #A0A0A0;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        white-space: nowrap;
      }

      .step-content strong {
        font-size: 14px;
        color: #F0F0F0;
        font-weight: 600;
      }

      .step-divider {
        width: 1px;
        height: 40px;
        background: #2C2C2C;
        flex-shrink: 0;
      }

      .check-availability {
        width: 100%;
        background: transparent;
        border: 2px solid #C5A028;
        border-radius: 12px;
        color: #C5A028;
        padding: 14px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .check-availability:hover {
        background: #C5A028;
        color: #0F0F0F;
      }

      .next-available {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin: 14px 0 0;
        font-size: 13px;
        color: #A0A0A0;
      }

      .next-available mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #2BAE66;
      }

      /* Session Badge Row */
      .session-badge-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 16px 0;
        padding: 12px 16px;
        background: #242424;
        border-radius: 12px;
      }

      .session-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #A0A0A0;
      }

      .session-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #5A5A5A;
        flex-shrink: 0;
      }

      .session-pill.session-active {
        color: #F0F0F0;
      }

      .session-pill.session-active .session-indicator {
        background: #2BAE66;
        box-shadow: 0 0 6px rgba(43, 174, 102, 0.5);
        animation: pulse 2s infinite;
      }

      .session-pill.session-booking-open .session-indicator {
        background: #C5A028;
        box-shadow: 0 0 6px rgba(197, 160, 40, 0.5);
      }

      .booking-status {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .booking-status mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .booking-status.open { color: #2BAE66; }
      .booking-status.closed { color: #E06C6C; }

      /* Menu Card */
      .menu-card {
        margin: 0 20px;
        position: relative;
        height: 180px;
        border-radius: 16px;
        overflow: hidden;
        cursor: pointer;
        border: 1px solid #2C2C2C;
        transition: all 0.2s ease;
      }

      .menu-card:hover {
        border-color: #C5A028;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }

      .menu-card-image {
        position: absolute;
        inset: 0;
        background: linear-gradient(120deg, #242424 0%, #1A1A1A 100%);
      }

      .menu-card-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(26, 26, 26, 0.7) 100%);
        display: flex;
        align-items: center;
        padding: 24px;
      }

      .menu-card-content h3 {
        margin: 0;
        font-size: 22px;
        font-weight: 600;
        color: #F0F0F0;
      }

      .menu-card-content p {
        margin: 8px 0 16px;
        font-size: 14px;
        color: #A0A0A0;
      }

      .menu-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #C5A028;
        font-weight: 600;
        font-size: 14px;
        transition: gap 0.2s ease;
      }

      .menu-card:hover .menu-link {
        gap: 12px;
      }

      .menu-link mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* Section Headers */
      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        margin-top: 8px;
      }

      .section-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #F0F0F0;
      }

      .chef-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chef-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: transparent;
        border: 1px solid #C5A028;
        border-radius: 16px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 600;
        color: #C5A028;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .chef-badge mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .section-link {
        color: #C5A028;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: color 0.2s ease;
      }

      .section-link:hover {
        color: #D4AF37;
      }

      /* Seasonal Specialties Grid */
      .specialties-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        padding: 0 20px;
      }

      .specialty-card {
        border-radius: 16px;
        background: #1A1A1A;
        border: 1px solid #2C2C2C;
        overflow: hidden;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .specialty-card:hover {
        border-color: #C5A028;
        transform: translateY(-2px);
      }

      .specialty-image {
        height: 80px;
        background: linear-gradient(120deg, #242424 0%, #1A1A1A 100%);
        background-size: cover;
        background-position: center;
      }

      .specialty-card mat-card-content {
        padding: 12px;
      }

      .specialty-name {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #F0F0F0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .specialty-desc {
        display: block;
        margin: 4px 0 8px;
        font-size: 12px;
        color: #A0A0A0;
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .specialty-price {
        color: #C5A028;
        font-weight: 600;
        font-size: 14px;
      }

      /* Chef's Recommendations Grid */
      .recommend-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        padding: 0 20px;
      }

      .recommend-card {
        position: relative;
        border-radius: 16px;
        background: #1A1A1A;
        border: 1px solid #2C2C2C;
        overflow: hidden;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .recommend-card:hover {
        border-color: #C5A028;
        transform: translateY(-2px);
      }

      .dish-image {
        height: 96px;
        background: linear-gradient(120deg, #242424 0%, #1A1A1A 100%);
        background-size: cover;
        background-position: center;
      }

      .chef-pick-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 28px;
        height: 28px;
        background: #C5A028;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chef-pick-badge mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #0F0F0F;
      }

      .recommend-card mat-card-content {
        padding: 12px;
      }

      .dish-name {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #F0F0F0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .dish-desc {
        display: block;
        margin: 4px 0 8px;
        font-size: 12px;
        color: #A0A0A0;
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .dish-price {
        color: #C5A028;
        font-weight: 600;
        font-size: 14px;
      }

      /* Skeleton Loading */
      .skeleton-card {
        border-radius: 16px;
        background: #1A1A1A;
        border: 1px solid #2C2C2C;
        overflow: hidden;
      }

      .skeleton-img {
        height: 80px;
        background: linear-gradient(90deg, #242424 25%, #2C2C2C 50%, #242424 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }

      .skeleton-img.tall {
        height: 96px;
      }

      .skeleton-body {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .skeleton-line {
        height: 12px;
        border-radius: 6px;
        background: linear-gradient(90deg, #242424 25%, #2C2C2C 50%, #242424 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }

      .skeleton-line.short {
        width: 60%;
      }

      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* Mobile Responsive */
      @media (max-width: 768px) {
        .booking-steps {
          flex-direction: column;
          gap: 8px;
        }

        .booking-step {
          width: 100%;
        }

        .step-divider {
          display: none;
        }

        .specialties-grid,
        .recommend-grid {
          grid-template-columns: 1fr;
        }

        .hero-section {
          height: 280px;
        }

        .brand-accent {
          font-size: 28px;
        }

        .hero-subtitle {
          font-size: 16px;
        }
      }

      @media (max-width: 480px) {
        .hero-cta {
          width: 100%;
        }

        .chef-badge {
          display: none;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerHomeComponent implements OnInit, OnDestroy {
  // ── Backend data ──
  isLoading = signal(true);
  seasonalItems = signal<MenuItemResponse[]>([]);
  chefDishes = signal<MenuItemResponse[]>([]);

  // ── Session / clock ──
  private readonly reservationFlow = inject(CustomerReservationFlowService);
  private readonly reservationService = inject(ReservationService);
  private readonly nowMin = signal(this.currentMinOfDay());
  private readonly clockHandle: ReturnType<typeof setInterval>;

  constructor(private readonly menuService: MenuService) {
    this.clockHandle = setInterval(() => this.nowMin.set(this.currentMinOfDay()), 60_000);
  }

  ngOnInit(): void {
    this.menuService.getAvailableMenuItems().subscribe({
      next: items => {
        this.seasonalItems.set(items.slice(0, 3));
        this.chefDishes.set(items.slice(3, 6));
        this.isLoading.set(false);
      },
      error: err => {
        console.error('Failed to load menu items for home page', err);
        this.isLoading.set(false);
      }
    });

    this.reservationService.getAvailableTables().subscribe({
      next: tables => this.bookableTables.set(tables.filter(t => t.status === 'trong').length),
      error: () => this.bookableTables.set(0)
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.clockHandle);
  }

  private currentMinOfDay(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  readonly todayLabel = computed(() => {
    this.nowMin();
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  });

  readonly currentTimeLabel = computed(() => {
    const totalMin = this.nowMin();
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${dh}:${m.toString().padStart(2, '0')} ${period}`;
  });

  private readonly activeSession = computed(() => {
    const min = this.nowMin();
    return HOME_SESSIONS.find(s => min >= s.start * 60 && min < s.end * 60) ?? null;
  });

  readonly sessionActive = computed(() => !!this.activeSession());

  readonly sessionLabel = computed(() => {
    const s = this.activeSession();
    if (s) return s.label;
    const min = this.nowMin();
    if (min < HOME_SESSIONS[0].start * 60) return 'Opening Soon';
    if (min < HOME_SESSIONS[1].start * 60) return 'Afternoon Break';
    return 'Closed for Tonight';
  });

  readonly bookingOpen = computed(() => {
    const min = this.nowMin();
    return HOME_SESSIONS.some(s => min < s.cutoffHour * 60 + s.cutoffMin && min < s.end * 60);
  });

  readonly sessionNote = computed(() => {
    const min = this.nowMin();
    const s = this.activeSession();
    if (s) {
      const cutoff = s.cutoffHour * 60 + s.cutoffMin;
      if (min < cutoff) {
        const p = s.cutoffHour >= 12 ? 'PM' : 'AM';
        const dh = s.cutoffHour > 12 ? s.cutoffHour - 12 : s.cutoffHour;
        return `Accepting reservations until ${dh}:${s.cutoffMin.toString().padStart(2, '0')} ${p}`;
      }
      return `${s.label} in progress · Walk-ins welcome`;
    }
    const dinner = HOME_SESSIONS[1];
    if (min >= HOME_SESSIONS[0].end * 60 && min < dinner.start * 60) {
      return min < dinner.cutoffHour * 60 + dinner.cutoffMin
        ? 'Dinner starts at 5:00 PM · Reservations open'
        : 'Dinner starts at 5:00 PM · Booking closed';
    }
    if (min < HOME_SESSIONS[0].start * 60) return 'Lunch begins at 10:00 AM';
    return 'Restaurant is closed · See you tomorrow';
  });

  readonly bookableTables = signal(0);
}
