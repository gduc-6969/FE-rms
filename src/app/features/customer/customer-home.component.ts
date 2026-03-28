import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
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

      <!-- Booking Widget - Horizontal Stepper -->
      <mat-card class="booking-widget">
        <mat-card-content>
          <div class="booking-steps">
            <div class="booking-step">
              <mat-icon>event</mat-icon>
              <div class="step-content">
                <small>Date</small>
                <strong>Tomorrow, Mar 20</strong>
              </div>
            </div>
            <div class="step-divider"></div>
            <div class="booking-step">
              <mat-icon>schedule</mat-icon>
              <div class="step-content">
                <small>Time</small>
                <strong>7:30 PM</strong>
              </div>
            </div>
            <div class="step-divider"></div>
            <div class="booking-step">
              <mat-icon>people</mat-icon>
              <div class="step-content">
                <small>Guests</small>
                <strong>2 People</strong>
              </div>
            </div>
          </div>
          <button class="check-availability" routerLink="/customer/reservation">
            Check Availability
          </button>
          <p class="next-available">
            <mat-icon>access_time</mat-icon>
            Next available: Today, 7:30 PM
          </p>
        </mat-card-content>
      </mat-card>

      <!-- Explore Menu Card -->
      <mat-card class="menu-card" routerLink="/customer/menu">
        <div class="menu-card-image"></div>
        <div class="menu-card-overlay">
          <div class="menu-card-content">
            <h3>Explore Our Menu</h3>
            <p>Discover seasonal specialties & signature dishes</p>
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
        @for (item of seasonalItems; track item.name) {
          <mat-card class="specialty-card">
            <div class="specialty-image"></div>
            <mat-card-content>
              <p class="specialty-name">{{ item.name }}</p>
              <small class="specialty-desc">{{ item.description }}</small>
              <span class="specialty-price">{{ item.price }}</span>
            </mat-card-content>
          </mat-card>
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
        @for (dish of dishes; track dish.name) {
          <mat-card class="recommend-card">
            <div class="dish-image"></div>
            <div class="chef-pick-badge">
              <mat-icon>star</mat-icon>
            </div>
            <mat-card-content>
              <p class="dish-name">{{ dish.name }}</p>
              <small class="dish-desc">{{ dish.description }}</small>
              <span class="dish-price">{{ dish.price }}</span>
            </mat-card-content>
          </mat-card>
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
        align-items: center;
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
      }

      .specialty-card mat-card-content {
        padding: 12px;
      }

      .specialty-name {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #F0F0F0;
      }

      .specialty-desc {
        display: block;
        margin: 4px 0 8px;
        font-size: 12px;
        color: #A0A0A0;
        line-height: 1.4;
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
      }

      .dish-desc {
        display: block;
        margin: 4px 0 8px;
        font-size: 12px;
        color: #A0A0A0;
        line-height: 1.4;
      }

      .dish-price {
        color: #C5A028;
        font-weight: 600;
        font-size: 14px;
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
export class CustomerHomeComponent {
  readonly seasonalItems = [
    { name: 'Spring Risotto', description: 'Fresh herbs & parmesan', price: '$32' },
    { name: 'Citrus Ceviche', description: 'Lime-cured sea bass', price: '$24' },
    { name: 'Garden Salad', description: 'Seasonal greens', price: '$18' }
  ];

  readonly dishes = [
    { name: 'Truffle Pasta', description: 'Black truffle & cream', price: '$42' },
    { name: 'Grilled Salmon', description: 'Herb-crusted filet', price: '$38' },
    { name: 'Chocolate Lava', description: 'Molten center', price: '$16' }
  ];
}
