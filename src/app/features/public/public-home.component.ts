import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="landing-page">
      <!-- Navigation Bar -->
      <nav class="top-nav">
        <div class="nav-brand">
          <img class="nav-logo" src="/assets/logo.jpg" alt="Desinare logo" />
          <span class="nav-name">Desinare</span>
        </div>
        <div class="nav-links">
          <a class="nav-link" routerLink="/">Home</a>
          <a class="nav-link" routerLink="/menu">Menu</a>
          <a class="nav-link" (click)="onBookTable()">Reservation</a>
        </div>
        <a class="nav-login" routerLink="/login">
          <mat-icon>person_outline</mat-icon>
          Sign In
        </a>
        <button class="mobile-menu-btn" (click)="mobileMenuOpen.set(!mobileMenuOpen())">
          <mat-icon>{{ mobileMenuOpen() ? 'close' : 'menu' }}</mat-icon>
        </button>
      </nav>

      <!-- Mobile Menu -->
      @if (mobileMenuOpen()) {
        <div class="mobile-menu">
          <a class="mobile-link" routerLink="/" (click)="mobileMenuOpen.set(false)">Home</a>
          <a class="mobile-link" routerLink="/menu" (click)="mobileMenuOpen.set(false)">Menu</a>
          <a class="mobile-link" (click)="onBookTable(); mobileMenuOpen.set(false)">Reservation</a>
          <a class="mobile-link sign-in" routerLink="/login" (click)="mobileMenuOpen.set(false)">
            <mat-icon>person_outline</mat-icon> Sign In
          </a>
        </div>
      }

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <div class="status-badge">
            <span class="status-dot"></span>
            Open Now
          </div>
          <h1 class="hero-title">
            <span class="brand-accent">Desinare</span>
          </h1>
          <p class="hero-tagline">"Take a seat, for a classic treat."</p>
          <p class="hero-description">
            Fine Dining in the Heart of the City — experience the art of gastronomy
            in an intimate setting. Our chefs craft each dish with passion, using the
            finest seasonal ingredients to create unforgettable flavors.
          </p>
          <div class="hero-actions">
            <a class="cta-primary" (click)="onBookTable()">
              <mat-icon>calendar_today</mat-icon>
              Book a Table
            </a>
            <a class="cta-secondary" routerLink="/menu">
              Explore Our Menu
              <mat-icon>arrow_forward</mat-icon>
            </a>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <div class="feature-card">
          <div class="feature-icon-wrap">
            <mat-icon>restaurant</mat-icon>
          </div>
          <h3>Exquisite Cuisine</h3>
          <p>Seasonal menus crafted by award-winning chefs using locally sourced ingredients.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon-wrap">
            <mat-icon>wine_bar</mat-icon>
          </div>
          <h3>Curated Wines</h3>
          <p>An extensive wine list hand-selected to complement every dish on our menu.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon-wrap">
            <mat-icon>celebration</mat-icon>
          </div>
          <h3>Private Events</h3>
          <p>Elegant private dining spaces perfect for celebrations and business gatherings.</p>
        </div>
      </section>

      <!-- About / Story Section -->
      <section class="about">
        <div class="about-content">
          <h2>A Culinary Journey</h2>
          <div class="about-layout">
            <div class="about-text">
              <p>
                At Desinare, every meal tells a story. Founded with a passion for bringing
                people together through exceptional food, our restaurant has been a beloved
                destination for over a decade.
              </p>
              <p>
                Our philosophy is simple: source the finest local, seasonal ingredients
                and let their natural flavors shine. From our carefully curated menu to our
                warm, inviting ambiance, we believe dining is more than just food — it's an
                experience to savor.
              </p>
              <p>
                Whether you're celebrating a special occasion or enjoying a quiet evening
                with loved ones, our team is dedicated to making every visit memorable.
              </p>
            </div>
            <div class="about-image">
              <div class="about-image-placeholder">
                <mat-icon>restaurant_menu</mat-icon>
                <span>Our Kitchen</span>
              </div>
            </div>
          </div>
          <div class="about-stats">
            <div class="stat">
              <span class="stat-number">12+</span>
              <span class="stat-label">Years of Excellence</span>
            </div>
            <div class="stat">
              <span class="stat-number">50+</span>
              <span class="stat-label">Signature Dishes</span>
            </div>
            <div class="stat">
              <span class="stat-number">4.9</span>
              <span class="stat-label">Guest Rating</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Menu Preview -->
      <section class="menu-preview">
        <div class="section-header">
          <h2>Signature Dishes</h2>
          <a class="section-link" routerLink="/menu">View Full Menu <mat-icon>arrow_forward</mat-icon></a>
        </div>
        <div class="menu-grid">
          @for (dish of signatureDishes; track dish.name) {
            <div class="menu-preview-card">
              <div class="menu-img-placeholder">
                <mat-icon>{{ dish.icon }}</mat-icon>
              </div>
              <div class="menu-preview-info">
                <h4>{{ dish.name }}</h4>
                <p>{{ dish.description }}</p>
                <span class="menu-price">{{ dish.price }}</span>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Chef's Recommendations -->
      <section class="chef-section">
        <div class="section-header">
          <div class="chef-header-row">
            <h2>Chef's Recommendations</h2>
            <span class="chef-badge">
              <mat-icon>workspace_premium</mat-icon>
              Chef's Pick
            </span>
          </div>
          <a class="section-link" routerLink="/menu">Discover More <mat-icon>arrow_forward</mat-icon></a>
        </div>
        <div class="chef-grid">
          @for (pick of chefPicks; track pick.name) {
            <div class="chef-card">
              <div class="chef-img-placeholder">
                <mat-icon>{{ pick.icon }}</mat-icon>
              </div>
              <div class="chef-pick-badge-small">
                <mat-icon>star</mat-icon>
              </div>
              <div class="chef-card-info">
                <h4>{{ pick.name }}</h4>
                <p>{{ pick.description }}</p>
                <span class="menu-price">{{ pick.price }}</span>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Photo Gallery / Ambiance -->
      <section class="gallery">
        <div class="section-header">
          <h2>Our Ambiance</h2>
        </div>
        <div class="gallery-grid">
          @for (photo of galleryPhotos; track photo.label) {
            <div class="gallery-item" [class]="photo.size">
              <div class="gallery-placeholder">
                <mat-icon>{{ photo.icon }}</mat-icon>
                <span>{{ photo.label }}</span>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Customer Reviews / Testimonials -->
      <section class="reviews">
        <div class="section-header">
          <h2>What Our Guests Say</h2>
        </div>
        <div class="reviews-grid">
          @for (review of reviews; track review.name) {
            <div class="review-card">
              <mat-icon class="quote-icon">format_quote</mat-icon>
              <p class="review-text">{{ review.text }}</p>
              <div class="review-stars">
                @for (s of [1,2,3,4,5]; track s) {
                  <mat-icon class="star" [class.filled]="s <= review.stars">star</mat-icon>
                }
              </div>
              <div class="reviewer">
                <div class="reviewer-avatar">{{ review.name.charAt(0) }}</div>
                <div>
                  <strong>{{ review.name }}</strong>
                  <small>{{ review.date }}</small>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- CTA Banner -->
      <section class="cta-banner">
        <h2>Ready for an Unforgettable Evening?</h2>
        <p>Reserve your table today and let us take care of the rest.</p>
        <a class="cta-primary" (click)="onBookTable()">
          <mat-icon>calendar_today</mat-icon>
          Book a Table Now
        </a>
      </section>

      <!-- Footer -->
      <footer id="contact" class="landing-footer">
        <div class="footer-columns">
          <div class="footer-col">
            <div class="footer-brand">
              <img class="footer-logo" src="/assets/logo.jpg" alt="Desinare logo" />
              <span class="footer-name">Desinare</span>
            </div>
            <p class="footer-desc">Fine dining in the heart of the city. Crafted with passion since 2014.</p>
          </div>
          <div class="footer-col">
            <h4>Quick Links</h4>
            <a routerLink="/">Home</a>
            <a routerLink="/menu">Menu</a>
            <a (click)="onBookTable()">Reservations</a>
            <a routerLink="/login">Sign In</a>
          </div>
          <div class="footer-col">
            <h4>Contact Us</h4>
            <p><mat-icon>location_on</mat-icon> 123 Fine Dining Avenue, Gourmet City</p>
            <p><mat-icon>schedule</mat-icon> Mon–Sun: 11:00 AM – 11:00 PM</p>
            <p><mat-icon>phone</mat-icon> +1 (555) 123-4567</p>
            <p><mat-icon>email</mat-icon> hello&#64;desinare.com</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p class="footer-copy">&copy; 2026 Desinare. All rights reserved.</p>
          <div class="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>

      <!-- Login Prompt Overlay -->
      @if (showLoginPrompt()) {
        <div class="prompt-overlay" (click)="closePrompt()">
          <div class="prompt-box" (click)="$event.stopPropagation()">
            <button class="prompt-close" (click)="closePrompt()">
              <mat-icon>close</mat-icon>
            </button>
            <div class="prompt-icon">
              <mat-icon>lock</mat-icon>
            </div>
            <h3>Sign In Required</h3>
            <p>Please sign in or create an account to book a table at Desinare.</p>
            <div class="prompt-actions">
              <button class="prompt-btn primary" (click)="goToLogin()">
                <mat-icon>login</mat-icon>
                Sign In
              </button>
              <button class="prompt-btn secondary" (click)="closePrompt()">
                Cancel
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .landing-page {
      background: #0F0F0F;
      color: #F0F0F0;
      min-height: 100dvh;
      position: relative;
    }

    /* Prompt Overlay */
    .prompt-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .prompt-box {
      position: relative;
      background: #1A1A1A;
      border: 1px solid #2C2C2C;
      border-radius: 20px;
      padding: 40px 36px 32px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
    }

    .prompt-close {
      position: absolute;
      top: 14px;
      right: 14px;
      background: transparent;
      border: none;
      color: #A0A0A0;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .prompt-close:hover { color: #F0F0F0; }

    .prompt-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(197, 160, 40, 0.1);
      border: 2px solid #C5A028;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .prompt-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #C5A028;
    }

    .prompt-box h3 {
      margin: 0 0 10px;
      font-size: 22px;
      font-weight: 700;
      color: #F0F0F0;
    }

    .prompt-box p {
      margin: 0 0 28px;
      font-size: 15px;
      color: #A0A0A0;
      line-height: 1.5;
    }

    .prompt-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .prompt-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .prompt-btn.primary {
      background: #C5A028;
      color: #0F0F0F;
    }

    .prompt-btn.primary:hover {
      background: #D4AF37;
    }

    .prompt-btn.secondary {
      background: transparent;
      border: 1px solid #2C2C2C;
      color: #A0A0A0;
    }

    .prompt-btn.secondary:hover {
      border-color: #555;
      color: #F0F0F0;
    }

    .prompt-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* ===== Navigation ===== */
    .top-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 32px;
      background: rgba(15, 15, 15, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(44, 44, 44, 0.5);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-logo {
      width: 36px;
      height: 36px;
      object-fit: contain;
      border-radius: 8px;
    }

    .nav-name {
      font-family: 'Playfair Display', 'Times New Roman', serif;
      font-size: 26px;
      font-weight: 700;
      font-style: italic;
      color: #C5A028;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 32px;
    }

    .nav-link {
      color: #A0A0A0;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.02em;
      transition: color 0.2s ease;
      cursor: pointer;
    }

    .nav-link:hover {
      color: #C5A028;
    }

    .nav-login {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #F0F0F0;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 10px 20px;
      border: 1px solid #2C2C2C;
      border-radius: 10px;
      background: rgba(26, 26, 26, 0.7);
      transition: all 0.2s ease;
    }

    .nav-login:hover {
      border-color: #C5A028;
      color: #C5A028;
      background: rgba(197, 160, 40, 0.08);
    }

    .nav-login mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .mobile-menu-btn {
      display: none;
      background: transparent;
      border: 1px solid #2C2C2C;
      border-radius: 10px;
      color: #F0F0F0;
      padding: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mobile-menu-btn:hover {
      border-color: #C5A028;
      color: #C5A028;
    }

    .mobile-menu {
      position: fixed;
      top: 65px;
      left: 0;
      right: 0;
      z-index: 99;
      background: rgba(15, 15, 15, 0.97);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid #2C2C2C;
      display: flex;
      flex-direction: column;
      padding: 16px 24px;
      gap: 4px;
    }

    .mobile-link {
      color: #A0A0A0;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
      padding: 14px 0;
      border-bottom: 1px solid #1A1A1A;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .mobile-link:hover {
      color: #C5A028;
    }

    .mobile-link.sign-in {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #C5A028;
      border-bottom: none;
      margin-top: 8px;
    }

    /* ===== Hero Section ===== */
    .hero {
      position: relative;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        linear-gradient(180deg, rgba(15, 15, 15, 0.4) 0%, rgba(15, 15, 15, 0.95) 100%),
        url('/assets/bg.jpg');
      background-size: cover;
      background-position: center;
      padding: 120px 32px 80px;
    }

    .hero-content {
      max-width: 640px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(26, 26, 26, 0.9);
      border: 1px solid #2C2C2C;
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #2BAE66;
      margin-bottom: 24px;
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

    .hero-title { margin: 0; }

    .brand-accent {
      font-family: 'Playfair Display', 'Times New Roman', serif;
      font-size: clamp(52px, 8vw, 80px);
      font-weight: 700;
      font-style: italic;
      color: #C5A028;
      line-height: 1.1;
    }

    .hero-tagline {
      margin: 12px 0 0;
      font-size: 20px;
      font-style: italic;
      color: #A0A0A0;
      letter-spacing: 0.02em;
    }

    .hero-description {
      margin: 20px 0 0;
      font-size: 16px;
      line-height: 1.7;
      color: #A0A0A0;
      max-width: 520px;
    }

    .hero-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 36px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .cta-primary {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #C5A028;
      color: #0F0F0F;
      border: none;
      border-radius: 12px;
      padding: 16px 32px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 4px 20px rgba(197, 160, 40, 0.3);
    }

    .cta-primary:hover {
      background: #D4AF37;
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(197, 160, 40, 0.4);
    }

    .cta-primary mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .cta-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #C5A028;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      padding: 16px 24px;
      border: 1.5px solid rgba(197, 160, 40, 0.4);
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .cta-secondary:hover {
      border-color: #C5A028;
      background: rgba(197, 160, 40, 0.08);
      gap: 12px;
    }

    .cta-secondary mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* ===== Features Section ===== */
    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      padding: 80px 32px;
      max-width: 960px;
      margin: 0 auto;
    }

    .feature-card {
      background: #1A1A1A;
      border: 1px solid #2C2C2C;
      border-radius: 16px;
      padding: 32px 24px;
      text-align: center;
      transition: all 0.2s ease;
    }

    .feature-card:hover {
      border-color: #C5A028;
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    .feature-icon-wrap {
      width: 56px;
      height: 56px;
      background: rgba(197, 160, 40, 0.1);
      border: 1px solid rgba(197, 160, 40, 0.2);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .feature-icon-wrap mat-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
      color: #C5A028;
    }

    .feature-card h3 {
      margin: 0 0 10px;
      font-size: 18px;
      font-weight: 600;
      color: #F0F0F0;
    }

    .feature-card p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: #A0A0A0;
    }

    /* ===== About Section ===== */
    .about {
      padding: 80px 32px;
      max-width: 960px;
      margin: 0 auto;
    }

    .about h2 {
      font-family: 'Playfair Display', 'Times New Roman', serif;
      font-size: 36px;
      font-weight: 700;
      font-style: italic;
      color: #C5A028;
      margin: 0 0 32px;
      text-align: center;
    }

    .about-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      align-items: center;
    }

    .about-text p {
      font-size: 15px;
      line-height: 1.8;
      color: #A0A0A0;
      margin: 0 0 16px;
    }

    .about-text p:last-child { margin-bottom: 0; }

    .about-image-placeholder {
      width: 100%;
      height: 320px;
      background: linear-gradient(135deg, #1A1A1A 0%, #242424 100%);
      border: 1px solid #2C2C2C;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #555;
    }

    .about-image-placeholder mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .about-image-placeholder span {
      font-size: 14px;
      font-weight: 500;
    }

    .about-stats {
      display: flex;
      justify-content: center;
      gap: 48px;
      margin-top: 48px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .stat-number {
      font-family: 'Playfair Display', 'Times New Roman', serif;
      font-size: 36px;
      font-weight: 700;
      color: #C5A028;
    }

    .stat-label {
      font-size: 13px;
      color: #A0A0A0;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* ===== Section Header (shared) ===== */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .section-header h2 {
      margin: 0;
      font-family: 'Playfair Display', 'Times New Roman', serif;
      font-size: 30px;
      font-weight: 700;
      font-style: italic;
      color: #C5A028;
    }

    .section-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #C5A028;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: gap 0.2s ease;
    }

    .section-link:hover { gap: 10px; }

    .section-link mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* ===== Menu Preview ===== */
    .menu-preview {
      padding: 80px 32px;
      max-width: 960px;
      margin: 0 auto;
    }

    .menu-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .menu-preview-card {
      background: #1A1A1A;
      border: 1px solid #2C2C2C;
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      gap: 16px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .menu-preview-card:hover {
      border-color: #C5A028;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .menu-img-placeholder {
      width: 140px;
      min-height: 140px;
      flex-shrink: 0;
      background: linear-gradient(135deg, #242424 0%, #1A1A1A 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .menu-img-placeholder mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #333;
    }

    .menu-preview-info {
      padding: 18px 18px 18px 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 6px;
    }

    .menu-preview-info h4 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
      color: #F0F0F0;
    }

    .menu-preview-info p {
      margin: 0;
      font-size: 13px;
      color: #A0A0A0;
      line-height: 1.5;
    }

    .menu-price {
      color: #C5A028;
      font-weight: 700;
      font-size: 16px;
    }

    /* ===== Chef's Recommendations ===== */
    .chef-section {
      padding: 0 32px 80px;
      max-width: 960px;
      margin: 0 auto;
    }

    .chef-header-row {
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

    .chef-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .chef-card {
      position: relative;
      background: #1A1A1A;
      border: 1px solid #2C2C2C;
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .chef-card:hover {
      border-color: #C5A028;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .chef-img-placeholder {
      height: 140px;
      background: linear-gradient(135deg, #242424 0%, #1A1A1A 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chef-img-placeholder mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #333;
    }

    .chef-pick-badge-small {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 28px;
      height: 28px;
      background: #C5A028;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chef-pick-badge-small mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #0F0F0F;
    }

    .chef-card-info {
      padding: 16px;
    }

    .chef-card-info h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #F0F0F0;
    }

    .chef-card-info p {
      margin: 6px 0 10px;
      font-size: 13px;
      color: #A0A0A0;
      line-height: 1.4;
    }

    /* ===== Photo Gallery ===== */
    .gallery {
      padding: 80px 32px;
      max-width: 960px;
      margin: 0 auto;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-auto-rows: 180px;
      gap: 16px;
    }

    .gallery-item {
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .gallery-item:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }

    .gallery-item.wide {
      grid-column: span 2;
    }

    .gallery-item.tall {
      grid-row: span 2;
    }

    .gallery-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1A1A1A 0%, #242424 100%);
      border: 1px solid #2C2C2C;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #555;
    }

    .gallery-placeholder mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .gallery-placeholder span {
      font-size: 12px;
      font-weight: 500;
    }

    /* ===== Reviews ===== */
    .reviews {
      padding: 0 32px 80px;
      max-width: 960px;
      margin: 0 auto;
    }

    .reviews-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .review-card {
      background: #1A1A1A;
      border: 1px solid #2C2C2C;
      border-radius: 16px;
      padding: 28px 24px;
      transition: all 0.2s ease;
    }

    .review-card:hover {
      border-color: rgba(197, 160, 40, 0.3);
    }

    .quote-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #C5A028;
      opacity: 0.6;
      margin-bottom: 8px;
    }

    .review-text {
      margin: 0 0 16px;
      font-size: 14px;
      line-height: 1.7;
      color: #D0D0D0;
      font-style: italic;
    }

    .review-stars {
      display: flex;
      gap: 2px;
      margin-bottom: 14px;
    }

    .star {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #333;
    }

    .star.filled {
      color: #C5A028;
    }

    .reviewer {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .reviewer-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #242424;
      border: 1px solid #C5A028;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      color: #C5A028;
    }

    .reviewer strong {
      display: block;
      font-size: 14px;
      color: #F0F0F0;
    }

    .reviewer small {
      font-size: 12px;
      color: #A0A0A0;
    }

    /* ===== CTA Banner ===== */
    .cta-banner {
      background: #1A1A1A;
      border-top: 1px solid #2C2C2C;
      border-bottom: 1px solid #2C2C2C;
      text-align: center;
      padding: 80px 32px;
    }

    .cta-banner h2 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #F0F0F0;
    }

    .cta-banner p {
      margin: 12px 0 28px;
      font-size: 16px;
      color: #A0A0A0;
    }

    /* ===== Footer ===== */
    .landing-footer {
      padding: 60px 32px 32px;
    }

    .footer-columns {
      display: grid;
      grid-template-columns: 2fr 1fr 1.5fr;
      gap: 40px;
      max-width: 960px;
      margin: 0 auto 40px;
    }

    .footer-col h4 {
      margin: 0 0 16px;
      font-size: 15px;
      font-weight: 600;
      color: #F0F0F0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .footer-col a {
      display: block;
      color: #A0A0A0;
      text-decoration: none;
      font-size: 14px;
      padding: 4px 0;
      transition: color 0.2s ease;
    }

    .footer-col a:hover {
      color: #C5A028;
    }

    .footer-col p {
      margin: 0 0 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #A0A0A0;
    }

    .footer-col p mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #C5A028;
      flex-shrink: 0;
    }

    .footer-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .footer-logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
      border-radius: 8px;
    }

    .footer-name {
      font-family: 'Playfair Display', 'Times New Roman', serif;
      font-size: 22px;
      font-weight: 700;
      font-style: italic;
      color: #C5A028;
    }

    .footer-desc {
      font-size: 14px;
      color: #A0A0A0;
      line-height: 1.6;
      margin: 0;
    }

    .footer-bottom {
      border-top: 1px solid #2C2C2C;
      padding-top: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 960px;
      margin: 0 auto;
    }

    .footer-copy {
      margin: 0;
      font-size: 13px;
      color: #555;
    }

    .footer-legal {
      display: flex;
      gap: 20px;
    }

    .footer-legal a {
      color: #555;
      text-decoration: none;
      font-size: 13px;
      transition: color 0.2s ease;
    }

    .footer-legal a:hover {
      color: #A0A0A0;
    }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
      .nav-links, .nav-login { display: none; }
      .mobile-menu-btn { display: block; }

      .features { grid-template-columns: 1fr; padding: 48px 20px; }
      .about { padding: 48px 20px; }
      .about-layout { grid-template-columns: 1fr; }
      .about-stats { gap: 24px; }

      .menu-preview { padding: 48px 20px; }
      .menu-grid { grid-template-columns: 1fr; }

      .chef-section { padding: 0 20px 48px; }
      .chef-grid { grid-template-columns: 1fr; }

      .gallery { padding: 48px 20px; }
      .gallery-grid {
        grid-template-columns: 1fr 1fr;
        grid-auto-rows: 140px;
      }
      .gallery-item.wide { grid-column: span 2; }
      .gallery-item.tall { grid-row: span 1; }

      .reviews { padding: 0 20px 48px; }
      .reviews-grid { grid-template-columns: 1fr; }

      .hero { padding: 100px 20px 60px; }
      .top-nav { padding: 14px 20px; }
      .cta-banner { padding: 48px 20px; }

      .footer-columns { grid-template-columns: 1fr; gap: 32px; }
      .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
    }

    @media (max-width: 480px) {
      .hero-actions {
        flex-direction: column;
        width: 100%;
      }

      .cta-primary, .cta-secondary {
        width: 100%;
        justify-content: center;
      }

      .about-stats {
        flex-direction: column;
        gap: 20px;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicHomeComponent {
  readonly mobileMenuOpen = signal(false);

  readonly signatureDishes = [
    { name: 'Truffle Pasta', description: 'Hand-made pappardelle with black truffle and aged parmesan cream', price: '$42', icon: 'lunch_dining' },
    { name: 'Grilled Salmon', description: 'Atlantic salmon filet, herb-crusted with seasonal vegetables', price: '$38', icon: 'set_meal' },
    { name: 'Spring Risotto', description: 'Carnaroli rice with fresh herbs, asparagus and parmesan', price: '$32', icon: 'rice_bowl' },
    { name: 'Wagyu Steak', description: 'A5 grade wagyu, charcoal grilled with red wine reduction', price: '$68', icon: 'restaurant' }
  ];

  readonly chefPicks = [
    { name: 'Citrus Ceviche', description: 'Lime-cured sea bass with mango salsa', price: '$24', icon: 'tapas' },
    { name: 'Chocolate Lava', description: 'Warm molten center with vanilla gelato', price: '$16', icon: 'cake' },
    { name: 'Lobster Bisque', description: 'Rich & creamy with a hint of cognac', price: '$28', icon: 'ramen_dining' }
  ];

  readonly galleryPhotos = [
    { label: 'Dining Hall', icon: 'chair', size: 'wide' },
    { label: 'Private Room', icon: 'meeting_room', size: '' },
    { label: 'Bar Area', icon: 'local_bar', size: '' },
    { label: 'Garden Terrace', icon: 'yard', size: 'tall' },
    { label: 'Kitchen', icon: 'soup_kitchen', size: '' },
    { label: 'Wine Cellar', icon: 'wine_bar', size: 'wide' }
  ];

  readonly reviews = [
    {
      name: 'Sophie Laurent',
      text: 'An absolutely magical evening. The truffle pasta was divine, and the service was impeccable. We\'ll be back for our anniversary every year.',
      stars: 5,
      date: 'March 2026'
    },
    {
      name: 'James Chen',
      text: 'The best fine dining experience in the city. Loved the intimate ambiance and the chef\'s attention to detail in every dish.',
      stars: 5,
      date: 'February 2026'
    },
    {
      name: 'Maria Garcia',
      text: 'Booked online and the whole process was seamless. The wagyu steak was cooked to perfection. Highly recommended for special occasions!',
      stars: 4,
      date: 'January 2026'
    }
  ];

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  showLoginPrompt = signal(false);

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  onBookTable(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/customer/reservation']);
    } else {
      this.showLoginPrompt.set(true);
    }
  }

  closePrompt(): void {
    this.showLoginPrompt.set(false);
  }

  goToLogin(): void {
    this.showLoginPrompt.set(false);
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/customer/reservation' } });
  }
}
