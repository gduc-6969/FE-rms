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
      <mat-card class="hero-card">
        <mat-card-content>
          <h2>La Cuisine Moderne</h2>
          <p>Fine Dining Experience</p>
          <button mat-flat-button color="primary">OPEN NOW</button>
        </mat-card-content>
      </mat-card>

      <button class="book-banner" routerLink="/customer/reservation">
        <mat-icon>event</mat-icon>
        <span>
          <strong>Book a Table</strong>
          <small>Select your favorite spot</small>
        </span>
      </button>

      <div class="meta-grid">
        <mat-card>
          <mat-card-content>
            <mat-icon>schedule</mat-icon>
            <small>NEXT SLOT</small>
            <p>Today, 7:30 PM</p>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-content>
            <mat-icon>location_on</mat-icon>
            <small>DISTANCE</small>
            <p>0.8 miles away</p>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="menu-cta" routerLink="/customer/menu">
        <mat-card-content>
          <div class="left">
            <mat-icon>grid_view</mat-icon>
            <div>
              <strong>Explore Menu</strong>
              <small>Seasonal specialties</small>
            </div>
          </div>
          <span>View</span>
        </mat-card-content>
      </mat-card>

      <div class="recommend-title">
        <h3>Chef's Recommendations</h3>
        <span>SHOW MORE</span>
      </div>

      <section class="recommend-grid">
        @for (dish of dishes; track dish.name) {
          <mat-card>
            <div class="dish-image"></div>
            <mat-card-content>
              <p>{{ dish.name }}</p>
              <small>{{ dish.price }}</small>
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
        gap: 14px;
      }

      .hero-card {
        border-radius: 18px;
        background: linear-gradient(135deg, #1f2937 0%, #475569 100%);
        color: white;
      }

      .hero-card p {
        margin: 6px 0 14px;
        color: #e2e8f0;
      }

      .book-banner {
        border: none;
        border-radius: 18px;
        background: #ff6a33;
        color: white;
        padding: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        text-align: left;
        cursor: pointer;
      }

      .book-banner span {
        display: grid;
      }

      .book-banner small {
        color: #ffedd5;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .meta-grid small {
        color: #64748b;
        font-weight: 600;
      }

      .meta-grid p {
        margin: 6px 0 0;
        font-weight: 700;
      }

      .menu-cta {
        cursor: pointer;
      }

      .menu-cta mat-card-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .menu-cta .left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .menu-cta small {
        display: block;
        color: #64748b;
      }

      .menu-cta span {
        color: #ff6a33;
        font-weight: 700;
      }

      .recommend-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .recommend-title span {
        color: #64748b;
        font-weight: 600;
        font-size: 12px;
      }

      .recommend-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .dish-image {
        height: 96px;
        border-radius: 14px 14px 0 0;
        background: linear-gradient(120deg, #f59e0b 0%, #78350f 100%);
      }

      .recommend-grid p {
        margin: 0;
        font-weight: 700;
      }

      .recommend-grid small {
        color: #ff6a33;
      }

      @media (max-width: 640px) {
        .recommend-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerHomeComponent {
  readonly dishes = [
    { name: 'Truffle Pasta', price: '$28' },
    { name: 'Grilled Salmon', price: '$35' },
    { name: 'Chocolate Lava', price: '$12' }
  ];
}
