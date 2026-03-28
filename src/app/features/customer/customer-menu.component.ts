import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MockDataService } from '../../core/services/mock-data.service';

interface MenuItem {
  id: number;
  name: string;
  nameEn: string;
  description: string;
  price: number;
  category: string;
  uiCategory: string;
  isChefPick?: boolean;
  dietary?: string[];
}

@Component({
  selector: 'app-customer-menu',
  standalone: true,
  imports: [
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
            placeholder="Search dishes, ingredients..."
            class="search-input"
          />
        </div>
        <button class="filter-btn" (click)="showFilters = !showFilters">
          <mat-icon>tune</mat-icon>
        </button>
      </div>

      <!-- Results Count -->
      @if (keyword || selectedCategory() !== 'All') {
        <p class="results-count">{{ filteredItems().length }} items found</p>
      }

      <!-- Category Pills with Counts -->
      <div class="category-pills">
        @for (cat of categoriesWithCounts(); track cat.name) {
          <button
            type="button"
            [class.active]="selectedCategory() === cat.name"
            (click)="selectedCategory.set(cat.name)"
          >
            {{ cat.name }} ({{ cat.count }})
          </button>
        }
      </div>

      <!-- Menu List -->
      <section class="menu-list">
        @for (item of filteredItems(); track item.id) {
          <mat-card class="menu-card" (click)="openDetails(item)">
            <div class="card-layout">
              <div class="dish-image">
                @if (item.isChefPick) {
                  <span class="chef-badge">
                    <mat-icon>star</mat-icon>
                  </span>
                }
              </div>
              <div class="dish-content">
                <div class="dish-header">
                  <div class="dish-titles">
                    <div class="title-row">
                      <h3>{{ item.nameEn }}</h3>
                      <!-- Dietary Icons next to name -->
                      @if (item.dietary && item.dietary.length) {
                        <div class="dietary-badges">
                          @for (badge of item.dietary; track badge) {
                            <span class="dietary-icon" [attr.title]="badge">
                              @switch (badge) {
                                @case ('spicy') { 🌶️ }
                                @case ('vegetarian') { 🥬 }
                                @case ('vegan') { 🌱 }
                                @case ('gluten-free') { 🌾 }
                                @case ('seafood') { 🦐 }
                                @case ('beef') { 🥩 }
                              }
                            </span>
                          }
                        </div>
                      }
                    </div>
                    <p class="dish-name-vn">{{ item.name }}</p>
                  </div>
                  <span class="dish-price">{{ item.price | currency : 'USD' : 'symbol' : '1.0-0' }}</span>
                </div>
                <p class="dish-desc">{{ item.description }}</p>
              </div>
            </div>
          </mat-card>
        }
      </section>
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
        position: relative;
        flex-shrink: 0;
      }

      .chef-badge {
        position: absolute;
        top: 8px;
        left: 8px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #C5A028;
        color: #0F0F0F;
        border-radius: 50%;
      }

      .chef-badge mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
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

      .dish-name-vn {
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

      .dish-footer {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 12px;
        margin-top: auto;
        min-height: 28px;
      }

      .dietary-badges {
        display: flex;
        gap: 4px;
        flex-wrap: nowrap;
        flex-shrink: 0;
      }

      .dietary-icon {
        font-size: 12px;
        padding: 2px 4px;
        background: #242424;
        border: 1px solid #2C2C2C;
        border-radius: 6px;
        line-height: 1;
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
export class CustomerMenuComponent {
  keyword = '';
  showFilters = false;
  selectedCategory = signal('All');

  private readonly rawItems: MenuItem[] = this.mockData.getMenuItems().map((item, index) => ({
    ...item,
    nameEn: this.getEnglishName(item.name),
    description: this.getDescription(item.name),
    uiCategory: item.category === 'Khai vị' ? 'Appetizers' : item.category === 'Món chính' ? 'Mains' : 'Desserts',
    isChefPick: index === 0 || index === 3,
    dietary: this.getDietary(item.name)
  }));

  readonly categoriesWithCounts = computed(() => {
    const all = this.rawItems.length;
    const appetizers = this.rawItems.filter(i => i.uiCategory === 'Appetizers').length;
    const mains = this.rawItems.filter(i => i.uiCategory === 'Mains').length;
    const desserts = this.rawItems.filter(i => i.uiCategory === 'Desserts').length;

    return [
      { name: 'All', count: all },
      { name: 'Appetizers', count: appetizers },
      { name: 'Mains', count: mains },
      { name: 'Desserts', count: desserts }
    ];
  });

  readonly filteredItems = computed(() => {
    const keyword = this.keyword.trim().toLowerCase();
    const category = this.selectedCategory();

    let items = category === 'All'
      ? this.rawItems
      : this.rawItems.filter(item => item.uiCategory === category);

    if (keyword) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(keyword) ||
        item.nameEn.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword)
      );
    }

    return items;
  });

  constructor(
    private readonly mockData: MockDataService,
    private readonly dialog: MatDialog
  ) {}

  openDetails(item: MenuItem): void {
    // Could open a modal with full details
    console.log('Opening details for:', item);
  }

  private getEnglishName(vn: string): string {
    const translations: Record<string, string> = {
      'Bò lúc lắc': 'Shaking Beef',
      'Gỏi cuốn tôm thịt': 'Shrimp & Pork Spring Rolls',
      'Phở bò': 'Beef Pho Noodle Soup',
      'Cơm tấm sườn': 'Broken Rice with Grilled Pork',
      'Bánh mì thịt': 'Vietnamese Baguette Sandwich',
      'Chả giò': 'Crispy Spring Rolls',
      'Cà phê sữa đá': 'Vietnamese Iced Coffee',
      'Chè ba màu': 'Three-Color Dessert'
    };
    return translations[vn] || vn;
  }

  private getDescription(name: string): string {
    const descriptions: Record<string, string> = {
      'Bò lúc lắc': 'Tender beef cubes sautéed with garlic and bell peppers, served with fresh salad and steamed rice.',
      'Gỏi cuốn tôm thịt': 'Fresh rice paper rolls with shrimp, pork, vermicelli, and herbs, served with peanut dipping sauce.',
      'Phở bò': 'Traditional Vietnamese noodle soup with slow-simmered beef broth, rice noodles, and fresh herbs.',
      'Cơm tấm sườn': 'Grilled pork chop served over broken rice with pickled vegetables and fish sauce.',
      'Bánh mì thịt': 'Crispy baguette filled with grilled pork, pâté, pickled vegetables, and cilantro.',
      'Chả giò': 'Crispy fried spring rolls filled with pork, shrimp, and vegetables, served with nuoc cham.',
      'Cà phê sữa đá': 'Strong Vietnamese coffee with condensed milk, served over ice.',
      'Chè ba màu': 'Layered dessert with mung beans, red beans, and pandan jelly in coconut milk.'
    };
    return descriptions[name] || 'A delicious dish prepared with fresh ingredients.';
  }

  private getDietary(name: string): string[] {
    const dietary: Record<string, string[]> = {
      'Bò lúc lắc': ['beef', 'spicy'],
      'Gỏi cuốn tôm thịt': ['seafood'],
      'Phở bò': ['beef', 'gluten-free'],
      'Cơm tấm sườn': ['spicy'],
      'Bánh mì thịt': [],
      'Chả giò': ['seafood'],
      'Cà phê sữa đá': ['vegetarian'],
      'Chè ba màu': ['vegan', 'gluten-free']
    };
    return dietary[name] || [];
  }
}
