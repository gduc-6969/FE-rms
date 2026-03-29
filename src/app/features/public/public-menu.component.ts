import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
  computed,
  inject
} from '@angular/core';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { MenuService } from '../../core/services/menu.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryResponse, MenuItemResponse } from '../../core/models/app.models';

const ALL_CATEGORY_ID = -1;

@Component({
  selector: 'app-public-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    FormsModule,
    CurrencyPipe,
    RouterLink
  ],
  template: `
    <div class="public-menu-page">
      <!-- Navigation Bar -->
      <nav class="top-nav">
        <div class="nav-brand">
          <img class="nav-logo" src="/assets/logo.jpg" alt="Desinare logo" />
          <span class="nav-name">Desinare</span>
        </div>
        <div class="nav-links">
          <a class="nav-link" routerLink="/" [replaceUrl]="true">Home</a>
          <a class="nav-link active">Menu</a>
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
      </nav>

      <!-- Content Area -->
      <div class="menu-content">
        <!-- Menu Header -->
        <header class="menu-header">
          <h1>Our Menu</h1>
          <p class="tagline">Seasonal ingredients, crafted with passion.</p>
        </header>

        <!-- Search Row -->
        <div class="search-row">
          <div class="search-wrapper">
            <mat-icon>search</mat-icon>
            <input
              type="text"
              [(ngModel)]="keyword"
              placeholder="Search dishes, ingredients..."
              class="search-input"
            />
          </div>
        </div>

        @if (keyword || selectedCategoryId() !== ALL_ID) {
          <p class="results-count">{{ displayedItems().length }} items found</p>
        }

        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading menu...</p>
          </div>
        }

        @if (loadError()) {
          <div class="error-state">
            <mat-icon>error_outline</mat-icon>
            <p>Failed to load the menu. Please try again.</p>
            <button class="retry-btn" (click)="retryLoad()">
              <mat-icon>refresh</mat-icon>
              Retry
            </button>
          </div>
        }

        @if (!isLoading() && !loadError()) {
          <!-- Category Pills -->
          <div class="category-pills">
            <button
              type="button"
              [class.active]="selectedCategoryId() === ALL_ID"
              (click)="selectCategory(ALL_ID)">
              All ({{ allItems().length }})
            </button>
            @for (cat of categories(); track cat.id) {
              <button
                type="button"
                [class.active]="selectedCategoryId() === cat.id"
                (click)="selectCategory(cat.id)">
                {{ cat.name }} ({{ countByCategory(cat.id) }})
              </button>
            }
          </div>

          <!-- Menu List -->
          <section class="menu-list">
            @for (item of displayedItems(); track item.id) {
              <mat-card class="menu-card">
                <div class="card-layout">
                  <div class="dish-image" [style.backgroundImage]="item.imageUrl ? 'url(' + item.imageUrl + ')' : ''"></div>
                  <div class="dish-content">
                    <div class="dish-header">
                      <div class="dish-titles">
                        <h3>{{ item.name }}</h3>
                        <p class="dish-category-label">{{ item.categoryName }}</p>
                      </div>
                      <span class="dish-price">{{ item.price | currency : 'VND' : 'symbol' : '1.0-0' }}</span>
                    </div>
                    <p class="dish-desc">{{ item.categoryName }} · Price: {{ item.price | number }}đ</p>
                  </div>
                </div>
              </mat-card>
            }

            @if (displayedItems().length === 0) {
              <div class="empty-state">
                <mat-icon>restaurant_menu</mat-icon>
                <p>No dishes found matching your search.</p>
              </div>
            }
          </section>
        }

        <!-- CTA -->
        <div class="menu-cta">
          <p>Ready to dine with us?</p>
          <a class="cta-primary" (click)="onBookTable()">
            <mat-icon>calendar_today</mat-icon>
            Book a Table
          </a>
        </div>
      </div>

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

    .public-menu-page {
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

    /* Nav - same as landing */
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
      background: rgba(15, 15, 15, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(44, 44, 44, 0.5);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
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

    .nav-link:hover, .nav-link.active {
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
      color: #E06C6C;
    }

    .dropdown-item.sign-out:hover mat-icon {
      color: #E06C6C;
    }

    /* Content */
    .menu-content {
      max-width: 720px;
      margin: 0 auto;
      padding: 90px 20px 40px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .menu-header {
      text-align: center;
      padding: 20px 0 8px;
    }

    .menu-header h1 {
      margin: 0;
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      font-weight: 700;
      color: #F0F0F0;
      position: relative;
      display: inline-block;
    }

    .menu-header h1::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 3px;
      background: #C5A028;
      border-radius: 2px;
    }

    .tagline {
      margin: 16px 0 0;
      color: #A0A0A0;
      font-size: 15px;
      font-style: italic;
    }

    /* Search */
    .search-row {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .search-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      background: #242424;
      border: 1px solid #2C2C2C;
      border-radius: 12px;
      padding: 0 16px;
      transition: all 0.2s ease;
    }

    .search-wrapper:focus-within {
      border-color: #C5A028;
      box-shadow: 0 0 0 3px rgba(197, 160, 40, 0.15);
    }

    .search-wrapper mat-icon { color: #A0A0A0; }

    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #F0F0F0;
      font-size: 15px;
      padding: 14px 0;
    }

    .search-input::placeholder { color: #A0A0A0; }

    .results-count {
      margin: 0;
      font-size: 14px;
      color: #A0A0A0;
    }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px 0;
      color: #A0A0A0;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #2C2C2C;
      border-top-color: #C5A028;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px 0;
      color: #E06C6C;
    }

    .error-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .retry-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 12px;
      background: #C5A028;
      border: none;
      color: #0F0F0F;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .retry-btn:hover {
      background: #D4AF37;
    }

    /* Category pills */
    .category-pills {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 4px;
      -webkit-overflow-scrolling: touch;
    }

    .category-pills::-webkit-scrollbar { height: 4px; }
    .category-pills::-webkit-scrollbar-track { background: #1A1A1A; border-radius: 2px; }
    .category-pills::-webkit-scrollbar-thumb { background: #2C2C2C; border-radius: 2px; }

    .category-pills button {
      border: 1px solid #2C2C2C;
      border-radius: 20px;
      padding: 10px 18px;
      background: #1A1A1A;
      color: #F0F0F0;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .category-pills button:hover {
      background: #242424;
      border-color: #C5A028;
    }

    .category-pills button.active {
      background: #C5A028;
      border-color: #C5A028;
      color: #0F0F0F;
      font-weight: 600;
    }

    /* Menu list */
    .menu-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .menu-card {
      border-radius: 16px;
      background: #1A1A1A;
      border: 1px solid #2C2C2C;
      overflow: hidden;
      transition: all 0.2s ease;
      padding: 0;
    }

    .menu-card:hover {
      border-color: #C5A028;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .card-layout {
      display: flex;
      gap: 16px;
      height: 140px;
    }

    .dish-image {
      width: 120px;
      height: 140px;
      background: linear-gradient(135deg, #242424 0%, #1A1A1A 100%);
      background-size: cover;
      background-position: center;
      flex-shrink: 0;
    }

    .dish-content {
      flex: 1;
      padding: 14px 14px 14px 0;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .dish-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .dish-titles {
      flex: 1;
      min-width: 0;
    }

    .dish-titles h3 {
      margin: 0;
      color: #F0F0F0;
      font-weight: 600;
      font-size: 15px;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dish-category-label {
      margin: 2px 0 0;
      color: #A0A0A0;
      font-size: 12px;
      font-style: italic;
    }

    .dish-price {
      color: #C5A028;
      font-weight: 700;
      font-size: 15px;
      white-space: nowrap;
    }

    .dish-desc {
      margin: 8px 0;
      color: #A0A0A0;
      font-size: 13px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 0;
      color: #A0A0A0;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #2C2C2C;
    }

    /* CTA at bottom */
    .menu-cta {
      text-align: center;
      padding: 40px 0 20px;
      border-top: 1px solid #2C2C2C;
      margin-top: 16px;
    }

    .menu-cta p {
      margin: 0 0 16px;
      font-size: 18px;
      color: #A0A0A0;
    }

    .cta-primary {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #C5A028;
      color: #0F0F0F;
      border: none;
      border-radius: 12px;
      padding: 14px 28px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 4px 20px rgba(197, 160, 40, 0.3);
    }

    .cta-primary:hover {
      background: #D4AF37;
      transform: translateY(-2px);
    }

    .cta-primary mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    @media (max-width: 768px) {
      .nav-links { display: none; }
      .menu-content { padding: 80px 16px 32px; }
    }

    @media (max-width: 640px) {
      .dish-image { width: 100px; min-height: 100px; }
      .dish-content { padding: 12px 12px 12px 0; }
      .dish-titles h3 { font-size: 14px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicMenuComponent implements OnInit {
  readonly ALL_ID = ALL_CATEGORY_ID;
  keyword = '';

  categories = signal<CategoryResponse[]>([]);
  allItems = signal<MenuItemResponse[]>([]);
  isLoading = signal(true);
  loadError = signal(false);
  selectedCategoryId = signal<number>(ALL_CATEGORY_ID);

  readonly displayedItems = computed(() => {
    const kw = this.keyword.trim().toLowerCase();
    const catId = this.selectedCategoryId();
    let items = catId === ALL_CATEGORY_ID
      ? this.allItems()
      : this.allItems().filter(i => i.categoryId === catId);

    if (kw) {
      items = items.filter(i =>
        i.name.toLowerCase().includes(kw) ||
        i.categoryName.toLowerCase().includes(kw)
      );
    }
    return items;
  });

  constructor(private readonly menuService: MenuService) {}

  ngOnInit(): void {
    this.loadMenu();
  }

  retryLoad(): void {
    this.loadMenu();
  }

  private loadMenu(): void {
    this.isLoading.set(true);
    this.loadError.set(false);

    this.menuService.getCategories().subscribe({
      next: cats => this.categories.set(cats.filter(c => c.status === 'hoat_dong')),
      error: err => console.error('Failed to load categories', err)
    });

    this.menuService.getAvailableMenuItems().subscribe({
      next: items => {
        this.allItems.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set(true);
      }
    });
  }

  selectCategory(id: number): void {
    this.selectedCategoryId.set(id);
  }

  countByCategory(categoryId: number): number {
    return this.allItems().filter(i => i.categoryId === categoryId).length;
  }

  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  showLoginPrompt = signal(false);
  userMenuOpen = signal(false);

  toggleUserMenu(): void {
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  goToAccount(): void {
    this.userMenuOpen.set(false);
    this.router.navigate(['/customer/home'], { replaceUrl: true });
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
