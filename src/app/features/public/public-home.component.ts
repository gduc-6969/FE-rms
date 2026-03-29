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
          <a class="nav-link" routerLink="/" [replaceUrl]="true">Home</a>
          <a class="nav-link" routerLink="/menu" [replaceUrl]="true">Menu</a>
          <a class="nav-link" (click)="onBookTable()">Reservation</a>
        </div>
        @if (authService.isAuthenticated()) {
          <div class="nav-user" (click)="toggleUserMenu()">
            <div class="user-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <span class="user-name">{{ authService.fullName() ?? 'User' }}</span>
            <mat-icon class="chevron" [class.open]="userMenuOpen()">expand_more</mat-icon>
          </div>
          @if (userMenuOpen()) {
            <div class="user-dropdown-backdrop" (click)="userMenuOpen.set(false)"></div>
            <div class="user-dropdown">
              <a class="dropdown-item" (click)="goToAccount()">
                <mat-icon>account_circle</mat-icon>
                Account
              </a>
              <a class="dropdown-item sign-out" (click)="onSignOut()">
                <mat-icon>logout</mat-icon>
                Sign Out
              </a>
            </div>
          }
        } @else {
          <a class="nav-login" routerLink="/login">
            <mat-icon>person_outline</mat-icon>
            Sign In
          </a>
        }
        <button class="mobile-menu-btn" (click)="mobileMenuOpen.set(!mobileMenuOpen())">
          <mat-icon>{{ mobileMenuOpen() ? 'close' : 'menu' }}</mat-icon>
        </button>
      </nav>

      <!-- Mobile Menu -->
      @if (mobileMenuOpen()) {
        <div class="mobile-menu">
          <a class="mobile-link" routerLink="/" [replaceUrl]="true" (click)="mobileMenuOpen.set(false)">Home</a>
          <a class="mobile-link" routerLink="/menu" [replaceUrl]="true" (click)="mobileMenuOpen.set(false)">Menu</a>
          <a class="mobile-link" (click)="onBookTable(); mobileMenuOpen.set(false)">Reservation</a>
          @if (authService.isAuthenticated()) {
            <a class="mobile-link" (click)="goToAccount(); mobileMenuOpen.set(false)">
              <mat-icon>account_circle</mat-icon> Account
            </a>
            <a class="mobile-link sign-out" (click)="onSignOut(); mobileMenuOpen.set(false)">
              <mat-icon>logout</mat-icon> Sign Out
            </a>
          } @else {
            <a class="mobile-link sign-in" routerLink="/login" (click)="mobileMenuOpen.set(false)">
              <mat-icon>person_outline</mat-icon> Sign In
            </a>
          }
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
            <a class="cta-secondary" routerLink="/menu" [replaceUrl]="true">
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
              <img src="assets/food.jpg" alt="A Culinary Journey" class="about-img" />
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

      <!-- Photo Gallery / Ambiance -->
      <section class="gallery">
        <div class="section-header">
          <h2>Our Ambiance</h2>
        </div>
        <div class="gallery-grid">
          @for (photo of galleryPhotos; track photo.label) {
            <div class="gallery-item" [class]="photo.size">
              <img [src]="photo.image" [alt]="photo.label" />
              <div class="gallery-overlay">
                <mat-icon>{{ photo.icon }}</mat-icon>
                <span>{{ photo.label }}</span>
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

    /* Avatar dropdown */
    .nav-user {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px 6px 6px;
      border: 1px solid #2C2C2C;
      border-radius: 28px;
      background: rgba(26, 26, 26, 0.7);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      user-select: none;
    }

    .nav-user:hover {
      border-color: #C5A028;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #C5A028;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-avatar mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #0F0F0F;
    }

    .user-name {
      color: #F0F0F0;
      font-size: 13px;
      font-weight: 600;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chevron {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #A0A0A0;
      transition: transform 0.2s ease;
    }

    .chevron.open {
      transform: rotate(180deg);
    }

    .user-dropdown-backdrop {
      position: fixed;
      inset: 0;
      z-index: 199;
    }

    .user-dropdown {
      position: absolute;
      top: 60px;
      right: 32px;
      z-index: 200;
      background: #1A1A1A;
      border: 1px solid #2C2C2C;
      border-radius: 12px;
      padding: 8px;
      min-width: 180px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 8px;
      color: #F0F0F0;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .dropdown-item:hover {
      background: #242424;
    }

    .dropdown-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #A0A0A0;
    }

    .dropdown-item:hover mat-icon {
      color: #C5A028;
    }

    .dropdown-item.sign-out:hover {
      background: rgba(224, 108, 108, 0.1);
    }

    .dropdown-item.sign-out:hover mat-icon {
      color: #E06C6C;
    }

    .dropdown-item.sign-out:hover {
      color: #E06C6C;
    }

    .mobile-link.sign-out {
      color: #E06C6C;
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

    .about-img {
      width: 100%;
      height: 320px;
      object-fit: cover;
      border-radius: 16px;
      display: block;
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

    /* ===== Photo Gallery ===== */
    .gallery {
      padding: 80px 32px;
      max-width: 960px;
      margin: 0 auto;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-auto-rows: 260px;
      gap: 16px;
    }

    .gallery-item {
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }

    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .gallery-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding-bottom: 20px;
      gap: 4px;
      color: #fff;
      opacity: 1;
      transition: opacity 0.3s ease;
    }

    .gallery-overlay mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .gallery-overlay span {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .gallery-item:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
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
      grid-template-columns: 1fr 1fr;
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
        grid-auto-rows: 180px;
      }

      .reviews { padding: 0 20px 48px; }
      .reviews-grid { grid-template-columns: 1fr; }

      .hero { padding: 100px 20px 60px; }
      .top-nav { padding: 14px 20px; }
      .cta-banner { padding: 48px 20px; }

      .footer-columns { grid-template-columns: 1fr; gap: 24px; }
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

  readonly galleryPhotos = [
    { label: 'Dining Hall', icon: 'chair', size: '', image: 'assets/dininghall.jpg' },
    { label: 'Bar Area', icon: 'local_bar', size: '', image: 'assets/bar.jpg' },
    { label: 'Kitchen', icon: 'soup_kitchen', size: '', image: 'assets/kitchen.jpg' },
    { label: 'Wine Cellar', icon: 'wine_bar', size: '', image: 'assets/winecellar.jpg' }
  ];

  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  showLoginPrompt = signal(false);
  userMenuOpen = signal(false);

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleUserMenu(): void {
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  goToAccount(): void {
    this.userMenuOpen.set(false);
    this.router.navigate(['/customer/profile'], { replaceUrl: true });
  }

  onSignOut(): void {
    this.userMenuOpen.set(false);
    this.authService.logout();
    this.router.navigate(['/'], { replaceUrl: true });
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
