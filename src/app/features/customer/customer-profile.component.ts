import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <section class="profile-page">
      <header class="section-title">My Profile</header>

      <mat-card class="profile-card">
        <mat-card-content>
          <div class="profile-head">
            <div class="avatar"><mat-icon>person</mat-icon></div>
            <div>
              <h2>John Doe</h2>
              <p>Member since Jan 2026</p>
            </div>
          </div>

          <ul class="contact-list">
            <li><mat-icon>mail</mat-icon> john.doe&#64;email.com</li>
            <li><mat-icon>call</mat-icon> +1 (555) 123-4567</li>
            <li><mat-icon>location_on</mat-icon> Downtown, City 12345</li>
          </ul>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content>
          <h3><mat-icon>event</mat-icon> Reservation History</h3>

          <div class="history-item">
            <div>
              <p>March 10, 2026</p>
              <small>7:00 PM · 2 guests</small>
            </div>
            <button mat-flat-button color="primary">Book Again</button>
          </div>

          <div class="history-item">
            <div>
              <p>February 25, 2026</p>
              <small>8:30 PM · 4 guests</small>
            </div>
            <button mat-flat-button color="primary">Book Again</button>
          </div>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .profile-page {
        display: grid;
        gap: 16px;
      }

      .section-title {
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        font-size: 34px;
      }

      .profile-card {
        border-radius: 18px;
      }

      .profile-head {
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .avatar {
        width: 88px;
        height: 88px;
        border-radius: 999px;
        background: #ff6a33;
        color: #fff;
        display: grid;
        place-items: center;
      }

      .avatar mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }

      .profile-head p {
        margin: 4px 0 0;
        color: #6b7280;
      }

      .contact-list {
        list-style: none;
        padding: 0;
        margin: 16px 0 0;
        display: grid;
        gap: 10px;
      }

      .contact-list li {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .history-item {
        margin-top: 12px;
        border-radius: 12px;
        background: #f3f4f6;
        padding: 12px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }

      .history-item p {
        margin: 0;
      }

      .history-item small {
        color: #6b7280;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerProfileComponent {}
