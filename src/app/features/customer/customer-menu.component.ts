import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
  computed
} from '@angular/core';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MenuService } from '../../core/services/menu.service';
import { CategoryResponse, MenuItemResponse } from '../../core/models/app.models';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const ALL_CATEGORY_ID = -1;

@Component({
  selector: 'app-customer-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatDialogModule, FormsModule, CurrencyPipe
  ],
  template: `
    <section class="menu-page">
      <!-- Menu Header -->
      <header class="menu-header">
        <h1>Our Menu</h1>
        <p class="tagline">Seasonal ingredients, crafted with passion.</p>
      </header>

      <!-- Search & Filter Row -->
      <div class="search-row">
        <div class="search-wrapper">
          <mat-icon>search</mat-icon>
          <input
            type="text"
            [(ngModel)]="keyword"
            (ngModelChange)="onKeywordChange($event)"
            placeholder="Search dishes, ingredients..."
            class="search-input"
          />
        </div>
        <button class="filter-btn" (click)="showFilters = !showFilters">
          <mat-icon>tune</mat-icon>
        </button>
      </div>

      <!-- Results Count -->
      @if (keyword || selectedCategoryId() !== ALL_ID) {
        <p class="results-count">{{ displayedItems().length }} items found</p>
      }

      <!-- Loading state -->
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading menu...</p>
        </div>
      }

      <!-- Category Pills with Counts -->
      @if (!isLoading()) {
        <div class="category-pills">
          <!-- "All" pill -->
          <button
            type="button"
            [class.active]="selectedCategoryId() === ALL_ID"
            (click)="selectCategory(ALL_ID)"
          >
            All ({{ allItems().length }})
          </button>

          @for (cat of categories(); track cat.id) {
            <button
              type="button"
              [class.active]="selectedCategoryId() === cat.id"
              (click)="selectCategory(cat.id)"
            >
              {{ cat.name }} ({{ countByCategory(cat.id) }})
            </button>
          }
        </div>

        <!-- Menu List -->
        <section class="menu-list">
          @for (item of displayedItems(); track item.id) {
            <mat-card class="menu-card" (click)="openDetails(item)">
              <div class="card-layout">
                <div class="dish-image" [style.backgroundImage]="item.imageUrl ? 'url(' + item.imageUrl + ')' : ''">
                </div>
                <div class="dish-content">
                  <div class="dish-header">
                    <div class="dish-titles">
                      <div class="title-row">
                        <h3>{{ item.name }}</h3>
                      </div>
                      <p class="dish-category-label">{{ item.categoryName }}</p>
                    </div>
                    <span class="dish-price">{{ item.price | currency : 'VND' : 'symbol' : '1.0-0' }}</span>
                  </div>
                  <p class="dish-desc">{{ item.categoryName }} · Price: {{ item.price | number }}đ</p>
                </div>
              </div>
            </mat-card>
          }

          @if (displayedItems().length === 0 && !isLoading()) {
            <div class="empty-state">
              <mat-icon>restaurant_menu</mat-icon>
              <p>Không tìm thấy món ăn phù hợp.</p>
            </div>
          }
        </section>
      }
    </section>
  `,
  styles: [
    `
      .menu-page {
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: #0F0F0F;
        min-height: 100vh;
        padding: 20px;
      }

      /* Menu Header */
      .menu-header {
        text-align: center;
        padding: 8px 0 16px;
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

      /* Search Row */
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

      .search-wrapper mat-icon {
        color: #A0A0A0;
      }

      .search-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: #F0F0F0;
        font-size: 15px;
        padding: 14px 0;
      }

      .search-input::placeholder {
        color: #A0A0A0;
      }

      .filter-btn {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: #242424;
        border: 1px solid #2C2C2C;
        color: #A0A0A0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .filter-btn:hover {
        border-color: #C5A028;
        color: #C5A028;
      }

      /* Results Count */
      .results-count {
        margin: 0;
        font-size: 14px;
        color: #A0A0A0;
      }

      /* Loading State */
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

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Category Pills */
      .category-pills {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 4px;
        -webkit-overflow-scrolling: touch;
      }

      .category-pills::-webkit-scrollbar {
        height: 4px;
      }

      .category-pills::-webkit-scrollbar-track {
        background: #1A1A1A;
        border-radius: 2px;
      }

      .category-pills::-webkit-scrollbar-thumb {
        background: #2C2C2C;
        border-radius: 2px;
      }

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

      /* Menu List - Horizontal Cards */
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
        cursor: pointer;
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
        position: relative;
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

      .title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: nowrap;
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
        flex-shrink: 1;
        min-width: 0;
      }

      .dish-category-label {
        margin: 2px 0 0;
        color: #A0A0A0;
        font-size: 12px;
        font-style: italic;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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

      /* Empty State */
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

      /* Mobile Layout */
      @media (max-width: 640px) {
        .menu-page {
          padding: 16px;
        }

        .dish-image {
          width: 100px;
          min-height: 100px;
        }

        .dish-content {
          padding: 12px 12px 12px 0;
        }

        .dish-titles h3 {
          font-size: 14px;
        }

        .dish-desc {
          font-size: 12px;
          -webkit-line-clamp: 1;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerMenuComponent implements OnInit {
  readonly ALL_ID = ALL_CATEGORY_ID;

  keyword = '';
  showFilters = false;

  // Signals for state
  categories = signal<CategoryResponse[]>([]);
  allItems = signal<MenuItemResponse[]>([]);
  isLoading = signal(true);
  selectedCategoryId = signal<number>(ALL_CATEGORY_ID);

  // Search subject for debounce
  private readonly searchSubject = new Subject<string>();

  // Items shown after keyword/category filter (client-side)
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

  constructor(
    private readonly menuService: MenuService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);

    // Load categories - only show active ones (hoat_dong)
    this.menuService.getCategories().subscribe({
      next: cats => {
        this.categories.set(cats.filter(c => c.status === 'hoat_dong'));
      },
      error: err => console.error('Failed to load categories', err)
    });

    // Load available menu items
    this.menuService.getAvailableMenuItems().subscribe({
      next: items => {
        this.allItems.set(items);
        this.isLoading.set(false);
      },
      error: err => {
        console.error('Failed to load menu items', err);
        this.isLoading.set(false);
      }
    });
  }

  selectCategory(id: number): void {
    this.selectedCategoryId.set(id);
  }

  countByCategory(categoryId: number): number {
    return this.allItems().filter(i => i.categoryId === categoryId).length;
  }

  onKeywordChange(value: string): void {
    this.keyword = value;
  }

  openDetails(item: MenuItemResponse): void {
    console.log('Opening details for:', item);
  }
}
